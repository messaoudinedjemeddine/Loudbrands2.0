// Pulls data from the Yalidine API into the local mirror (yalidine_parcels + yalidine_status_history).
//
// - fullSync():        every parcel + every history entry (first run / repair). ~5 + ~N/1000 calls.
// - incrementalSync(): parcels and history entries whose status changed since yesterday (Algeria time).
//                      Runs on a timer as a safety net for webhooks; a few calls per run.
//
// Only one sync runs at a time. Results of the last run are kept in memory (getSyncState()).

const yalidineService = require('./yalidine');
const mirror = require('./yalidine-mirror');
const prisma = require('../config/database');

const PAGE_SIZE = 1000; // Yalidine maximum
const MAX_PAGES = 200; // safety stop (200k rows)

const state = {
  running: null, // 'full' | 'incremental' | null
  lastRun: null, // { mode, startedAt, finishedAt, ok, parcels, created, linked, historyRows, apiCalls, error }
  lastSuccessAt: null,
};

/** Today's date in Algeria (UTC+1) as YYYY-MM-DD, optionally shifted by `days`. */
function algeriaDate(days = 0) {
  const d = new Date(Date.now() + 60 * 60 * 1000 + days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

async function apiGet(url, counter) {
  const response = await yalidineService.throttledRequest(() => yalidineService.client.get(url));
  counter.apiCalls++;
  if (response.status === 429) {
    const err = new Error('Yalidine quota exceeded (429)');
    err.quotaExceeded = true;
    throw err;
  }
  if (response.status >= 400) {
    throw new Error(`Yalidine API error ${response.status} on ${url}: ${JSON.stringify(response.data).slice(0, 200)}`);
  }
  return response.data;
}

/** Iterate over every page of a list endpoint. `query` is a URLSearchParams-compatible object. */
async function forEachPage(endpoint, query, counter, onPage) {
  for (let page = 1; page <= MAX_PAGES; page++) {
    const params = new URLSearchParams({ ...query, page_size: String(PAGE_SIZE), page: String(page) });
    const data = await apiGet(`${endpoint}?${params.toString()}`, counter);
    const items = Array.isArray(data && data.data) ? data.data : [];
    await onPage(items, data);
    if (!data || !data.has_more || items.length === 0) break;
  }
}

async function syncParcels(query, counter) {
  await forEachPage('/parcels/', query, counter, async (items) => {
    for (const parcel of items) {
      const r = await mirror.upsertParcelSnapshot(parcel);
      if (!r) continue;
      counter.parcels++;
      if (r.created) counter.created++;
      if (r.orderId) counter.linked++;
    }
  });
}

async function syncHistories(query, counter) {
  await forEachPage('/histories/', query, counter, async (items) => {
    counter.historyRows += await mirror.saveHistorySnapshot(items);
  });
}

async function run(mode, fn) {
  if (!yalidineService.isConfigured()) {
    return { ok: false, error: 'Yalidine API credentials not configured' };
  }
  if (state.running) {
    return { ok: false, skipped: true, error: `A ${state.running} sync is already running` };
  }
  state.running = mode;
  const counter = { parcels: 0, created: 0, linked: 0, historyRows: 0, apiCalls: 0 };
  const startedAt = new Date();
  console.log(`🔄 Yalidine ${mode} sync started`);
  try {
    await fn(counter);
    state.lastRun = { mode, startedAt, finishedAt: new Date(), ok: true, ...counter };
    state.lastSuccessAt = state.lastRun.finishedAt;
    console.log(`✅ Yalidine ${mode} sync done:`, counter);
    return state.lastRun;
  } catch (error) {
    state.lastRun = { mode, startedAt, finishedAt: new Date(), ok: false, ...counter, error: error.message };
    console.error(`❌ Yalidine ${mode} sync failed:`, error.message);
    return state.lastRun;
  } finally {
    state.running = null;
  }
}

/** Every parcel and every history entry. */
function fullSync() {
  return run('full', async (counter) => {
    await syncParcels({}, counter);
    await syncHistories({}, counter);
  });
}

/** Parcels / history whose status changed between yesterday and today (Algeria time). */
function incrementalSync() {
  const range = `${algeriaDate(-1)},${algeriaDate(0)}`;
  return run('incremental', async (counter) => {
    await syncParcels({ date_last_status: range }, counter);
    await syncHistories({ date_status: range }, counter);
  });
}

function getSyncState() {
  return { running: state.running, lastRun: state.lastRun, lastSuccessAt: state.lastSuccessAt };
}

let timer = null;

/**
 * Start the periodic incremental sync.
 * Enabled when YALIDINE_SYNC_ENABLED=true, or by default in production.
 * Interval: YALIDINE_SYNC_INTERVAL_MINUTES (default 20, minimum 5).
 */
function startScheduler() {
  const enabled =
    process.env.YALIDINE_SYNC_ENABLED !== undefined
      ? process.env.YALIDINE_SYNC_ENABLED === 'true'
      : process.env.NODE_ENV === 'production';
  if (!enabled) {
    console.log('ℹ️ Yalidine auto-sync disabled (set YALIDINE_SYNC_ENABLED=true to enable)');
    return;
  }
  if (!yalidineService.isConfigured()) {
    console.log('ℹ️ Yalidine auto-sync not started: credentials not configured');
    return;
  }
  const minutes = Math.max(5, parseInt(process.env.YALIDINE_SYNC_INTERVAL_MINUTES || '20', 10) || 20);
  console.log(`⏱️ Yalidine auto-sync every ${minutes} min`);

  // First run shortly after boot: full sync if the mirror is empty, otherwise incremental.
  setTimeout(async () => {
    try {
      const count = await prisma.yalidineParcel.count();
      if (count === 0) await fullSync();
      else await incrementalSync();
    } catch (e) {
      console.error('❌ Initial Yalidine sync error:', e.message);
    }
  }, 30 * 1000);

  timer = setInterval(async () => {
    try {
      await incrementalSync();
      // Retry webhook events that failed earlier (e.g. database hiccup).
      await require('./yalidine-webhook').processPendingEvents();
    } catch (e) {
      console.error('❌ Yalidine sync error:', e.message);
    }
  }, minutes * 60 * 1000);
  if (timer.unref) timer.unref();
}

// ---------------------------------------------------------------------------
// Mismatch report: where the web app and the Yalidine account disagree
// ---------------------------------------------------------------------------

async function getMismatchReport({ limit = 100 } = {}) {
  const take = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);

  const parcelSelect = {
    tracking: true, yalidineOrderId: true, lastStatus: true, lastStatusAt: true,
    toWilayaName: true, toCommuneName: true, price: true, dateCreation: true,
  };

  // 1. Parcels at Yalidine with no matching order in the app
  const parcelsWithoutOrderWhere = { orderId: null, deletedAt: null };
  // 2. Orders that have a tracking number Yalidine doesn't know (or that was deleted there)
  const mirrorTrackings = prisma.yalidineParcel.findMany({ where: { deletedAt: null }, select: { tracking: true } });
  // 3. Confirmed orders that never got a tracking number
  const confirmedWithoutTrackingWhere = { callCenterStatus: 'CONFIRMED', trackingNumber: null };

  const [parcelsWithoutOrderCount, parcelsWithoutOrder, known, ordersWithTracking, confirmedWithoutTrackingCount, confirmedWithoutTracking, totalParcels] =
    await Promise.all([
      prisma.yalidineParcel.count({ where: parcelsWithoutOrderWhere }),
      prisma.yalidineParcel.findMany({ where: parcelsWithoutOrderWhere, select: parcelSelect, orderBy: { dateCreation: 'desc' }, take }),
      mirrorTrackings,
      prisma.order.findMany({
        where: { trackingNumber: { not: null } },
        select: { id: true, orderNumber: true, trackingNumber: true, customerName: true, callCenterStatus: true, deliveryStatus: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where: confirmedWithoutTrackingWhere }),
      prisma.order.findMany({
        where: confirmedWithoutTrackingWhere,
        select: { id: true, orderNumber: true, customerName: true, customerPhone: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take,
      }),
      prisma.yalidineParcel.count({ where: { deletedAt: null } }),
    ]);

  const knownSet = new Set(known.map((p) => p.tracking));
  const ordersWithUnknownTracking = ordersWithTracking.filter((o) => !knownSet.has(o.trackingNumber));

  return {
    note: state.lastSuccessAt
      ? undefined
      : 'No successful sync yet in this process: run a full sync first or results may be incomplete.',
    lastSyncAt: state.lastSuccessAt,
    totalParcelsInMirror: totalParcels,
    parcelsWithoutOrder: { count: parcelsWithoutOrderCount, items: parcelsWithoutOrder },
    ordersWithUnknownTracking: { count: ordersWithUnknownTracking.length, items: ordersWithUnknownTracking.slice(0, take) },
    confirmedOrdersWithoutTracking: { count: confirmedWithoutTrackingCount, items: confirmedWithoutTracking },
  };
}

module.exports = { fullSync, incrementalSync, getSyncState, startScheduler, getMismatchReport, algeriaDate };
