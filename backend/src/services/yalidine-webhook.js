// Yalidine webhook: signature check, event storage and background processing.
// Spec: docs/YALIDINE_API.md → "Webhooks".

const crypto = require('crypto');
const prisma = require('../config/database');
const mirror = require('./yalidine-mirror');

const KNOWN_TYPES = [
  'parcel_created',
  'parcel_edited',
  'parcel_deleted',
  'parcel_status_updated',
  'parcel_payment_updated',
];
const MAX_ATTEMPTS = 5;

/** HMAC-SHA256(rawBody, secret) as hex, compared in constant time. */
function isValidSignature(rawBody, signature, secret) {
  if (!secret || !signature || !Buffer.isBuffer(rawBody)) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature).trim(), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Store the events of one delivery. Duplicate event_ids are ignored.
 * Returns { received, stored }.
 */
async function storeDelivery(payload) {
  const type = payload && payload.type;
  const events = Array.isArray(payload && payload.events) ? payload.events : [];
  const rows = events
    .filter((e) => e && e.event_id)
    .map((e) => ({
      eventId: String(e.event_id),
      type: String(type || 'unknown'),
      tracking: e.data && e.data.tracking ? String(e.data.tracking) : null,
      occurredAt: mirror.parseYalidineDate(e.occurred_at),
      data: e.data || {},
      status: KNOWN_TYPES.includes(type) ? 'pending' : 'ignored',
      error: KNOWN_TYPES.includes(type) ? null : `Unknown event type: ${type}`,
    }));
  if (rows.length === 0) return { received: events.length, stored: 0 };
  const result = await prisma.yalidineWebhookEvent.createMany({ data: rows, skipDuplicates: true });
  return { received: events.length, stored: result.count };
}

/**
 * Apply one stored event to the mirror.
 * Events for parcels we don't know are ignored (the periodic sync adds new parcels with full data);
 * this also keeps Yalidine dashboard test events (fake trackings) out of the mirror.
 * Returns 'processed' or 'ignored:<why>'.
 */
async function applyEvent(evt) {
  const d = evt.data || {};
  const tracking = d.tracking ? String(d.tracking) : null;
  if (!tracking) return 'ignored:no tracking';

  const parcelExists = !!(await prisma.yalidineParcel.findUnique({ where: { tracking }, select: { id: true } }));

  if (evt.type === 'parcel_created') {
    if (!parcelExists) {
      // Only create it here if it belongs to one of our orders (repairs a missing tracking number).
      const order = d.order_id
        ? await prisma.order.findUnique({ where: { orderNumber: String(d.order_id) }, select: { id: true } })
        : null;
      if (!order) return 'ignored:unknown parcel (will come with the next sync)';
    }
    await mirror.applyCreatedEvent({ tracking, order_id: d.order_id, label: d.label, import_id: d.import_id });
    return 'processed';
  }

  if (!parcelExists) return 'ignored:unknown parcel (will come with the next sync)';

  switch (evt.type) {
    case 'parcel_status_updated':
      await mirror.applyStatusEvent({ tracking, status: d.status, reason: d.reason, occurredAt: evt.occurredAt });
      return 'processed';
    case 'parcel_payment_updated':
      await mirror.applyPaymentEvent({ tracking, status: d.status, payment_id: d.payment_id });
      return 'processed';
    case 'parcel_edited':
      await mirror.applyEditedEvent({ tracking, label: d.label });
      return 'processed';
    case 'parcel_deleted':
      await mirror.applyDeletedEvent({ tracking });
      return 'processed';
    default:
      return `ignored:unknown type ${evt.type}`;
  }
}

let processing = false;

/**
 * Process pending (and retry failed) events, oldest first. Safe to call often:
 * only one run at a time; returns counts.
 */
async function processPendingEvents() {
  if (processing) return { skipped: true };
  processing = true;
  const counts = { processed: 0, ignored: 0, failed: 0 };
  try {
    for (let batch = 0; batch < 50; batch++) {
      const events = await prisma.yalidineWebhookEvent.findMany({
        where: {
          OR: [{ status: 'pending' }, { status: 'failed', attempts: { lt: MAX_ATTEMPTS } }],
        },
        orderBy: [{ occurredAt: 'asc' }, { receivedAt: 'asc' }],
        take: 200,
      });
      if (events.length === 0) break;

      for (const evt of events) {
        try {
          const outcome = await applyEvent(evt);
          const ignored = outcome.startsWith('ignored:');
          await prisma.yalidineWebhookEvent.update({
            where: { id: evt.id },
            data: {
              status: ignored ? 'ignored' : 'processed',
              error: ignored ? outcome.slice('ignored:'.length) : null,
              attempts: { increment: 1 },
              processedAt: new Date(),
            },
          });
          counts[ignored ? 'ignored' : 'processed']++;
        } catch (error) {
          console.error(`❌ Yalidine webhook event ${evt.eventId} failed:`, error.message);
          await prisma.yalidineWebhookEvent.update({
            where: { id: evt.id },
            data: { status: 'failed', error: error.message.slice(0, 1000), attempts: { increment: 1 } },
          });
          counts.failed++;
        }
      }
    }
    if (counts.processed || counts.ignored || counts.failed) {
      console.log('📦 Yalidine webhook events processed:', counts);
    }
    return counts;
  } finally {
    processing = false;
  }
}

module.exports = { isValidSignature, storeDelivery, processPendingEvents, applyEvent, KNOWN_TYPES };
