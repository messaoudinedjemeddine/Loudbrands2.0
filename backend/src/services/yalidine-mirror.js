// Keeps the local database in sync with the Yalidine account.
//
// - yalidine_parcels: one row per Yalidine parcel (status, payment, fees, location, label…)
// - yalidine_status_history: every status change
// - orders.deliveryStatus: derived from the Yalidine status (Yalidine is the source of truth)
//
// Used by the sync job (snapshots from GET /parcels and /histories) and by webhooks (events).
// Never stores personal data from Yalidine: it is masked in API responses ("M*****d").

const prisma = require('../config/database');

// ---------------------------------------------------------------------------
// Status → our DeliveryStatus enum
// ---------------------------------------------------------------------------

const READY_STATUSES = [
  'Pas encore expédié', 'A vérifier', 'En préparation', 'Pas encore ramassé',
  'Prêt à expédier', 'En passation',
];
const IN_TRANSIT_STATUSES = [
  'Ramassé', 'Bloqué', 'Débloqué', 'Transfert', 'Expédié', 'Centre', 'En localisation',
  'Vers Wilaya', 'En transit', 'Reçu à Wilaya', 'En attente du client', 'Prêt pour livreur',
  'Sorti en livraison', 'En attente', 'En alerte', 'Alerte résolue', 'Tentative échouée',
];
const DONE_STATUSES = ['Livré'];
const RETURNED_STATUSES = [
  'Echèc livraison', 'Retour vers centre', 'Retourné au centre', 'Retour transfert',
  'Retour groupé', 'Retour à retirer', 'Retour non retiré', 'Colis abandonné',
  'Retour vers vendeur', 'Retourné au vendeur', 'Switch annulé', 'Echange échoué',
];

/**
 * Map a Yalidine status to our DeliveryStatus enum.
 * Returns null when the status should not change deliveryStatus
 * (unknown status, or "Annulé" which is handled by the order's call-center status).
 */
function mapToDeliveryStatus(yalidineStatus) {
  if (!yalidineStatus) return null;
  if (READY_STATUSES.includes(yalidineStatus)) return 'READY';
  if (IN_TRANSIT_STATUSES.includes(yalidineStatus)) return 'IN_TRANSIT';
  if (DONE_STATUSES.includes(yalidineStatus)) return 'DONE';
  if (RETURNED_STATUSES.includes(yalidineStatus)) return 'RETURNED';
  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Yalidine dates are Algeria local time ("2026-11-09 15:50:16", UTC+1, no DST). */
function parseYalidineDate(value) {
  if (!value || typeof value !== 'string') return null;
  const m = value.trim().match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?))?/);
  if (!m) return null;
  const time = m[2] ? (m[2].length === 5 ? `${m[2]}:00` : m[2]) : '00:00:00';
  const d = new Date(`${m[1]}T${time}+01:00`);
  return isNaN(d.getTime()) ? null : d;
}

const toInt = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
};
const toBool = (v) => v === true || v === 1 || v === '1' || v === 'true';
const toStr = (v) => (v === null || v === undefined || v === '' ? null : String(v));

/**
 * Find our order for a parcel: first by trackingNumber, then by Yalidine order_id = our orderNumber.
 */
async function findOrderForParcel(tracking, yalidineOrderId) {
  const byTracking = await prisma.order.findFirst({
    where: { trackingNumber: tracking },
    select: { id: true, trackingNumber: true, deliveryStatus: true },
  });
  if (byTracking) return byTracking;
  if (!yalidineOrderId) return null;
  return prisma.order.findUnique({
    where: { orderNumber: String(yalidineOrderId) },
    select: { id: true, trackingNumber: true, deliveryStatus: true },
  });
}

/** Link the parcel to the order unless another parcel already holds that order. */
async function resolveOrderLink(tracking, order) {
  if (!order) return null;
  const holder = await prisma.yalidineParcel.findUnique({
    where: { orderId: order.id },
    select: { tracking: true },
  });
  if (holder && holder.tracking !== tracking) return null; // one order ↔ one parcel
  return order;
}

/**
 * Apply a Yalidine status to the linked order: set deliveryStatus (Yalidine wins) and,
 * if the order lost its tracking number, restore it.
 */
async function applyToOrder(order, tracking, yalidineStatus) {
  if (!order) return;
  const data = {};
  const mapped = mapToDeliveryStatus(yalidineStatus);
  if (mapped && mapped !== order.deliveryStatus) data.deliveryStatus = mapped;
  if (!order.trackingNumber) data.trackingNumber = tracking;
  if (Object.keys(data).length > 0) {
    await prisma.order.update({ where: { id: order.id }, data });
  }
}

// ---------------------------------------------------------------------------
// Snapshots (sync job): GET /parcels items and GET /histories items
// ---------------------------------------------------------------------------

/**
 * Upsert one parcel object as returned by GET /v1/parcels.
 * Only overwrites the status if the snapshot is at least as recent as what we have,
 * so an older snapshot never undoes a newer webhook event.
 * Returns { tracking, created, orderId }.
 */
async function upsertParcelSnapshot(p) {
  const tracking = toStr(p && p.tracking);
  if (!tracking) return null;

  const yalidineOrderId = toStr(p.order_id);
  const lastStatusAt = parseYalidineDate(p.date_last_status);
  const existing = await prisma.yalidineParcel.findUnique({ where: { tracking } });
  const order = await resolveOrderLink(tracking, await findOrderForParcel(tracking, yalidineOrderId));

  const statusIsNewer =
    !existing || !existing.lastStatusAt || !lastStatusAt || lastStatusAt >= existing.lastStatusAt;

  const data = {
    yalidineOrderId,
    isStopdesk: toBool(p.is_stopdesk),
    stopdeskId: toInt(p.stopdesk_id),
    stopdeskName: toStr(p.stopdesk_name),
    toWilayaId: toInt(p.to_wilaya_id),
    toWilayaName: toStr(p.to_wilaya_name),
    toCommuneName: toStr(p.to_commune_name),
    productList: toStr(p.product_list),
    price: toInt(p.price),
    deliveryFee: toInt(p.delivery_fee),
    freeshipping: toBool(p.freeshipping),
    hasExchange: toBool(p.has_exchange),
    label: toStr(p.label),
    importId: toInt(p.import_id),
    dateCreation: parseYalidineDate(p.date_creation),
    dateExpedition: parseYalidineDate(p.date_expedition),
    paymentStatus: toStr(p.payment_status),
    paymentId: toStr(p.payment_id),
    deletedAt: null,
    lastSyncedAt: new Date(),
    ...(order ? { orderId: order.id } : {}),
    ...(statusIsNewer
      ? {
          lastStatus: toStr(p.last_status),
          lastStatusAt,
          currentCenterName: toStr(p.current_center_name),
          currentWilayaName: toStr(p.current_wilaya_name),
        }
      : {}),
  };

  await prisma.yalidineParcel.upsert({
    where: { tracking },
    create: { tracking, ...data },
    update: data,
  });

  if (statusIsNewer) await applyToOrder(order, tracking, toStr(p.last_status));

  return { tracking, created: !existing, orderId: order ? order.id : null };
}

/**
 * Store history items as returned by GET /v1/histories (duplicates are ignored).
 * Items for parcels we don't have yet are skipped (sync parcels first).
 */
async function saveHistorySnapshot(items) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const trackings = [...new Set(items.map((h) => h && h.tracking).filter(Boolean))];
  const known = new Set(
    (await prisma.yalidineParcel.findMany({ where: { tracking: { in: trackings } }, select: { tracking: true } }))
      .map((r) => r.tracking)
  );
  const rows = items
    .filter((h) => h && known.has(h.tracking) && h.status && parseYalidineDate(h.date_status))
    .map((h) => ({
      tracking: h.tracking,
      status: h.status,
      reason: toStr(h.reason),
      occurredAt: parseYalidineDate(h.date_status),
      centerName: toStr(h.center_name),
      wilayaName: toStr(h.wilaya_name),
      communeName: toStr(h.commune_name),
    }));
  if (rows.length === 0) return 0;
  const result = await prisma.yalidineStatusHistory.createMany({ data: rows, skipDuplicates: true });

  // The latest history item carries the failure reason; copy it onto the parcel.
  for (const tracking of new Set(rows.map((r) => r.tracking))) {
    const latest = rows
      .filter((r) => r.tracking === tracking)
      .sort((a, b) => b.occurredAt - a.occurredAt)[0];
    await prisma.yalidineParcel.updateMany({
      where: {
        tracking,
        lastStatus: latest.status,
        OR: [{ lastStatusAt: null }, { lastStatusAt: { lte: latest.occurredAt } }],
      },
      data: { lastStatusReason: latest.reason },
    });
  }
  return result.count;
}

// ---------------------------------------------------------------------------
// Events (webhooks)
// ---------------------------------------------------------------------------

/** Make sure a parcel row exists for this tracking (webhook may arrive before the first sync). */
async function ensureParcel(tracking, extra = {}) {
  const existing = await prisma.yalidineParcel.findUnique({ where: { tracking } });
  if (existing) return existing;
  const order = await resolveOrderLink(tracking, await findOrderForParcel(tracking, extra.yalidineOrderId));
  return prisma.yalidineParcel.create({
    data: { tracking, ...extra, ...(order ? { orderId: order.id } : {}) },
  });
}

/**
 * parcel_status_updated: { tracking, status, reason } at occurredAt.
 * Adds a history row; updates the parcel/order only if this event is the newest we know.
 */
async function applyStatusEvent({ tracking, status, reason, occurredAt }) {
  if (!tracking || !status) return { applied: false };
  const at = occurredAt instanceof Date ? occurredAt : parseYalidineDate(occurredAt) || new Date();
  const parcel = await ensureParcel(tracking);

  await prisma.yalidineStatusHistory.createMany({
    data: [{ tracking, status, reason: toStr(reason), occurredAt: at }],
    skipDuplicates: true,
  });

  if (parcel.lastStatusAt && at < parcel.lastStatusAt) return { applied: false, reason: 'older event' };

  await prisma.yalidineParcel.update({
    where: { tracking },
    data: { lastStatus: status, lastStatusReason: toStr(reason), lastStatusAt: at, deletedAt: null },
  });
  const order = parcel.orderId
    ? await prisma.order.findUnique({
        where: { id: parcel.orderId },
        select: { id: true, trackingNumber: true, deliveryStatus: true },
      })
    : await resolveOrderLink(tracking, await findOrderForParcel(tracking, parcel.yalidineOrderId));
  if (order && !parcel.orderId) {
    await prisma.yalidineParcel.update({ where: { tracking }, data: { orderId: order.id } });
  }
  await applyToOrder(order, tracking, status);
  return { applied: true };
}

/** parcel_payment_updated: { tracking, status, payment_id } */
async function applyPaymentEvent({ tracking, status, payment_id }) {
  if (!tracking) return;
  await ensureParcel(tracking);
  await prisma.yalidineParcel.update({
    where: { tracking },
    data: { paymentStatus: toStr(status), paymentId: toStr(payment_id) },
  });
}

/** parcel_created: { order_id, tracking, label, import_id } */
async function applyCreatedEvent({ tracking, order_id, label, import_id }) {
  if (!tracking) return;
  await ensureParcel(tracking, { yalidineOrderId: toStr(order_id) });
  await prisma.yalidineParcel.update({
    where: { tracking },
    data: { label: toStr(label), importId: toInt(import_id), yalidineOrderId: toStr(order_id), deletedAt: null },
  });
  // Repair orders that were confirmed but never got their tracking number saved.
  const parcel = await prisma.yalidineParcel.findUnique({ where: { tracking } });
  if (parcel.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: parcel.orderId },
      select: { id: true, trackingNumber: true, deliveryStatus: true },
    });
    await applyToOrder(order, tracking, null);
  }
}

/** parcel_edited: { tracking, label } */
async function applyEditedEvent({ tracking, label }) {
  if (!tracking) return;
  await ensureParcel(tracking);
  await prisma.yalidineParcel.update({ where: { tracking }, data: { label: toStr(label) } });
}

/** parcel_deleted: { tracking } — keep the row (and history), mark it deleted. */
async function applyDeletedEvent({ tracking }) {
  if (!tracking) return;
  await prisma.yalidineParcel.updateMany({ where: { tracking }, data: { deletedAt: new Date() } });
}

const STATUS_GROUPS = {
  READY: READY_STATUSES,
  IN_TRANSIT: IN_TRANSIT_STATUSES,
  DONE: DONE_STATUSES,
  RETURNED: RETURNED_STATUSES,
};

module.exports = {
  STATUS_GROUPS,
  mapToDeliveryStatus,
  parseYalidineDate,
  upsertParcelSnapshot,
  saveHistorySnapshot,
  applyStatusEvent,
  applyPaymentEvent,
  applyCreatedEvent,
  applyEditedEvent,
  applyDeletedEvent,
};
