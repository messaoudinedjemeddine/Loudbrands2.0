// Parcels read from the local Yalidine mirror (no Yalidine API calls, no quota used).
// Mounted at /api/shipping/parcels.
//
// GET  /                 list with search, filters, pagination
// GET  /stats            counts by status group, status and payment
// GET  /:tracking        one parcel with timeline and customer/order details
// POST /:tracking/cancel (admin) delete the parcel at Yalidine (only while "En préparation")

const express = require('express');
const prisma = require('../config/database');
const yalidineService = require('../services/yalidine');
const { STATUS_GROUPS } = require('../services/yalidine-mirror');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken, requireRole(['ADMIN', 'CONFIRMATRICE', 'AGENT_LIVRAISON']));

const ORDER_SELECT = {
  id: true,
  orderNumber: true,
  customerName: true,
  customerPhone: true,
  deliveryType: true,
  deliveryAddress: true,
  deliveryDetails: true,
  total: true,
  subtotal: true,
  deliveryFee: true,
  notes: true,
  callCenterStatus: true,
  deliveryStatus: true,
  createdAt: true,
  city: { select: { name: true, nameAr: true } },
  deliveryDesk: { select: { name: true } },
};

const ORDER_SELECT_WITH_ITEMS = {
  ...ORDER_SELECT,
  items: {
    select: {
      quantity: true,
      price: true,
      size: true,
      product: { select: { name: true, nameAr: true } },
      productSize: { select: { size: true } },
    },
  },
};

function parseDate(value, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
  return new Date(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}+01:00`);
}

/**
 * Order ids whose phone contains these digits, ignoring spaces/dashes and the
 * +213 / leading-0 prefix ("+213 550 12 34 56" matches "0550123456").
 */
async function orderIdsByPhone(digits) {
  let core = digits;
  if (core.startsWith('00213')) core = core.slice(5);
  else if (core.startsWith('213') && core.length >= 11) core = core.slice(3);
  else if (core.startsWith('0') && core.length >= 9) core = core.slice(1);
  if (core.length < 4) return [];
  const rows = await prisma.$queryRaw`
    SELECT id FROM orders
    WHERE regexp_replace("customerPhone", '[^0-9]', '', 'g') LIKE ${'%' + core + '%'}
    LIMIT 1000`;
  return rows.map((r) => r.id);
}

/** Build the Prisma where clause from query params. */
async function buildWhere(query) {
  const and = [];

  if (query.includeDeleted !== 'true') and.push({ deletedAt: null });

  if (query.group && STATUS_GROUPS[query.group]) {
    and.push({ lastStatus: { in: STATUS_GROUPS[query.group] } });
  }
  if (query.status) {
    const statuses = String(query.status).split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length) and.push({ lastStatus: { in: statuses } });
  }
  if (query.paymentStatus) and.push({ paymentStatus: String(query.paymentStatus) });
  if (query.wilayaId && !isNaN(parseInt(query.wilayaId, 10))) {
    and.push({ toWilayaId: parseInt(query.wilayaId, 10) });
  }
  if (query.stopdesk === 'true') and.push({ isStopdesk: true });
  if (query.stopdesk === 'false') and.push({ isStopdesk: false });
  if (query.linked === 'true') and.push({ orderId: { not: null } });
  if (query.linked === 'false') and.push({ orderId: null });

  const dateField = query.dateField === 'lastStatusAt' ? 'lastStatusAt' : 'dateCreation';
  const from = parseDate(query.dateFrom);
  const to = parseDate(query.dateTo, true);
  if (from || to) and.push({ [dateField]: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } });

  const q = String(query.q || '').trim();
  if (q) {
    const digits = q.replace(/\D/g, '');
    const or = [
      { tracking: { contains: q, mode: 'insensitive' } },
      { yalidineOrderId: { contains: q, mode: 'insensitive' } },
      { order: { is: { orderNumber: { contains: q, mode: 'insensitive' } } } },
      { order: { is: { customerName: { contains: q, mode: 'insensitive' } } } },
    ];
    if (digits.length >= 4) {
      const ids = await orderIdsByPhone(digits);
      if (ids.length) or.push({ orderId: { in: ids } });
    }
    and.push({ OR: or });
  }

  return and.length ? { AND: and } : {};
}

router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 25, 1), 100);
    const sortField = ['lastStatusAt', 'dateCreation', 'tracking'].includes(req.query.sort) ? req.query.sort : 'lastStatusAt';
    const sortDir = req.query.dir === 'asc' ? 'asc' : 'desc';
    const where = await buildWhere(req.query);

    const [total, parcels] = await Promise.all([
      prisma.yalidineParcel.count({ where }),
      prisma.yalidineParcel.findMany({
        where,
        orderBy: [{ [sortField]: { sort: sortDir, nulls: 'last' } }, { tracking: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { order: { select: ORDER_SELECT } },
      }),
    ]);

    res.json({ total, page, pageSize, totalPages: Math.ceil(total / pageSize), parcels });
  } catch (error) {
    console.error('Parcels list error:', error);
    res.status(500).json({ error: 'Failed to load parcels' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    // Same filters as the list, except status/group (so the cards show the breakdown).
    const { status, group, ...rest } = req.query;
    const where = await buildWhere(rest);

    const [byStatus, byPayment, total] = await Promise.all([
      prisma.yalidineParcel.groupBy({ by: ['lastStatus'], where, _count: { _all: true } }),
      prisma.yalidineParcel.groupBy({ by: ['paymentStatus'], where, _count: { _all: true } }),
      prisma.yalidineParcel.count({ where }),
    ]);

    const statuses = {};
    for (const row of byStatus) statuses[row.lastStatus || 'Inconnu'] = row._count._all;

    const groups = { READY: 0, IN_TRANSIT: 0, DONE: 0, RETURNED: 0, OTHER: 0 };
    for (const [name, count] of Object.entries(statuses)) {
      const g = Object.keys(STATUS_GROUPS).find((k) => STATUS_GROUPS[k].includes(name));
      groups[g || 'OTHER'] += count;
    }

    const payments = {};
    for (const row of byPayment) payments[row.paymentStatus || 'inconnu'] = row._count._all;

    res.json({ total, groups, statuses, payments });
  } catch (error) {
    console.error('Parcels stats error:', error);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

router.get('/:tracking', async (req, res) => {
  try {
    const parcel = await prisma.yalidineParcel.findUnique({
      where: { tracking: req.params.tracking },
      include: {
        order: { select: ORDER_SELECT_WITH_ITEMS },
        history: { orderBy: { occurredAt: 'desc' } },
      },
    });
    if (!parcel) return res.status(404).json({ error: 'Parcel not found' });
    res.json(parcel);
  } catch (error) {
    console.error('Parcel detail error:', error);
    res.status(500).json({ error: 'Failed to load parcel' });
  }
});

router.post('/:tracking/cancel', requireRole(['ADMIN']), async (req, res) => {
  const { tracking } = req.params;
  try {
    const parcel = await prisma.yalidineParcel.findUnique({ where: { tracking } });
    if (!parcel) return res.status(404).json({ error: 'Parcel not found' });
    if (parcel.lastStatus && parcel.lastStatus !== 'En préparation') {
      return res.status(409).json({ error: `Impossible d'annuler: le colis est "${parcel.lastStatus}" (seulement possible en "En préparation").` });
    }
    await yalidineService.deleteParcel(tracking); // throws if Yalidine refuses
    await prisma.yalidineParcel.update({ where: { tracking }, data: { deletedAt: new Date() } });
    if (parcel.orderId) {
      await prisma.order.update({
        where: { id: parcel.orderId },
        data: { trackingNumber: null, yalidineShipmentId: null, deliveryStatus: 'NOT_READY' },
      });
      await prisma.yalidineParcel.update({ where: { tracking }, data: { orderId: null } });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Parcel cancel error:', error.message);
    res.status(error.notDeleted ? 409 : 500).json({ error: error.message || 'Failed to cancel parcel' });
  }
});

module.exports = router;
