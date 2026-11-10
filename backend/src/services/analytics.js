// Business analytics for Loud Styles.
//
// Rules (agreed with the owner):
// - Revenue is recognised when Yalidine marks the parcel "Livré" (the customer paid the courier),
//   dated on the delivery day (Algeria time).
// - Revenue = products only (item price × quantity), delivery fees excluded.
// - Only Loud Styles products count (brand slug 'loud-styles'); in mixed orders, only those items.
// - Profit = sale price − cost of making. Cost = order_items.unitCost (snapshot at sale time),
//   falling back to the product's current costPrice.
//
// An order's outcome comes from its Yalidine parcel (mirror). Orders without a parcel fall back
// to orders.deliveryStatus (DONE / RETURNED) dated on orders.updatedAt.

const { Prisma } = require('@prisma/client');
const prisma = require('../config/database');
const { STATUS_GROUPS } = require('./yalidine-mirror');

const BRAND_SLUG = 'loud-styles';
const TZ = 'Africa/Algiers';
const UNITS = ['day', 'week', 'month', 'year'];
const RETURNED = STATUS_GROUPS.RETURNED;
const PENDING = [...STATUS_GROUPS.READY, ...STATUS_GROUPS.IN_TRANSIT];

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Algeria-local YYYY-MM-DD → UTC timestamp string usable as SQL ::timestamp (columns are UTC). */
function algeriaDayStartUtc(day) {
  return new Date(`${day}T00:00:00+01:00`).toISOString().replace('T', ' ').replace('Z', '');
}

function addDays(day, n) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from, to) {
  return Math.round((new Date(`${to}T12:00:00Z`) - new Date(`${from}T12:00:00Z`)) / 86400000) + 1;
}

/** Validate/complete a period. `to` is inclusive. Defaults to the last 30 days. */
function resolvePeriod({ from, to, groupBy }) {
  const today = new Date(Date.now() + 3600000).toISOString().slice(0, 10);
  const end = isDate(to) ? to : today;
  const start = isDate(from) ? from : addDays(end, -29);
  if (start > end) throw Object.assign(new Error('La date de début est après la date de fin'), { status: 400 });
  const days = daysBetween(start, end);
  if (days > 366 * 10) throw Object.assign(new Error('Période trop longue (10 ans maximum)'), { status: 400 });
  const unit = UNITS.includes(groupBy) ? groupBy : days <= 62 ? 'day' : days <= 210 ? 'week' : days <= 1100 ? 'month' : 'year';
  return {
    from: start,
    to: end,
    days,
    unit,
    startUtc: algeriaDayStartUtc(start),
    endUtc: algeriaDayStartUtc(addDays(end, 1)), // exclusive
    previous: { from: addDays(start, -days), to: addDays(start, -1) },
  };
}

// ---------------------------------------------------------------------------
// SQL building blocks
// ---------------------------------------------------------------------------

/** One row per order that reached a final outcome: delivered or returned, with its date. */
const OUTCOMES = Prisma.sql`
  SELECT o.id AS order_id,
         o."orderNumber" AS order_number,
         CASE
           WHEN p.id IS NOT NULL AND p."lastStatus" = 'Livré' THEN 'delivered'
           WHEN p.id IS NOT NULL AND p."lastStatus" = ANY(${RETURNED}) THEN 'returned'
           WHEN p.id IS NULL AND o."deliveryStatus"::text = 'DONE' THEN 'delivered'
           WHEN p.id IS NULL AND o."deliveryStatus"::text = 'RETURNED' THEN 'returned'
         END AS outcome,
         COALESCE(p."lastStatusAt", o."updatedAt") AS at,
         COALESCE(p."toWilayaName", c.name) AS wilaya
  FROM orders o
  LEFT JOIN yalidine_parcels p ON p."orderId" = o.id AND p."deletedAt" IS NULL
  LEFT JOIN cities c ON c.id = o."cityId"
`;

/** Loud Styles order lines with revenue and cost. */
const LS_LINES = Prisma.sql`
  SELECT oi."orderId" AS order_id,
         pr.id AS product_id,
         pr.name AS product_name,
         cat.name AS category_name,
         oi.quantity AS qty,
         oi.price * oi.quantity AS revenue,
         COALESCE(oi."unitCost", NULLIF(pr."costPrice", 0), 0) * oi.quantity AS cost,
         (COALESCE(oi."unitCost", NULLIF(pr."costPrice", 0)) IS NULL) AS cost_missing
  FROM order_items oi
  JOIN products pr ON pr.id = oi."productId"
  JOIN brands b ON b.id = pr."brandId" AND b.slug = ${BRAND_SLUG}
  LEFT JOIN categories cat ON cat.id = pr."categoryId"
`;

const n = (v) => (v === null || v === undefined ? 0 : Number(v));
const round = (v) => Math.round(n(v));

async function totalsFor(startUtc, endUtc) {
  const [row] = await prisma.$queryRaw`
    WITH outc AS (${OUTCOMES}),
         lines AS (${LS_LINES})
    SELECT
      COUNT(DISTINCT CASE WHEN outc.outcome = 'delivered' THEN outc.order_id END) AS delivered_orders,
      COUNT(DISTINCT CASE WHEN outc.outcome = 'returned' THEN outc.order_id END) AS returned_orders,
      COALESCE(SUM(CASE WHEN outc.outcome = 'delivered' THEN lines.revenue END), 0) AS revenue,
      COALESCE(SUM(CASE WHEN outc.outcome = 'delivered' THEN lines.cost END), 0) AS cost,
      COALESCE(SUM(CASE WHEN outc.outcome = 'delivered' THEN lines.qty END), 0) AS items_sold,
      COALESCE(SUM(CASE WHEN outc.outcome = 'returned' THEN lines.revenue END), 0) AS returned_value,
      COALESCE(SUM(CASE WHEN outc.outcome = 'delivered' AND lines.cost_missing THEN lines.qty END), 0) AS cost_missing_items
    FROM outc
    JOIN lines ON lines.order_id = outc.order_id
    WHERE outc.outcome IS NOT NULL
      AND outc.at >= ${startUtc}::timestamp AND outc.at < ${endUtc}::timestamp`;

  const revenue = n(row.revenue);
  const cost = n(row.cost);
  const delivered = n(row.delivered_orders);
  const returned = n(row.returned_orders);
  return {
    revenue: round(revenue),
    cost: round(cost),
    profit: round(revenue - cost),
    margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
    deliveredOrders: delivered,
    returnedOrders: returned,
    returnedValue: round(row.returned_value),
    itemsSold: n(row.items_sold),
    averageOrder: delivered > 0 ? round(revenue / delivered) : 0,
    deliveryRate: delivered + returned > 0 ? (delivered / (delivered + returned)) * 100 : null,
    costMissingItems: n(row.cost_missing_items),
  };
}

async function ordersCreated(startUtc, endUtc) {
  const [row] = await prisma.$queryRaw`
    WITH lines AS (${LS_LINES})
    SELECT
      COUNT(DISTINCT o.id) AS created,
      COUNT(DISTINCT CASE WHEN o."callCenterStatus"::text = 'CONFIRMED' THEN o.id END) AS confirmed,
      COUNT(DISTINCT CASE WHEN o."callCenterStatus"::text = 'CANCELED' THEN o.id END) AS canceled
    FROM orders o
    JOIN lines ON lines.order_id = o.id
    WHERE o."createdAt" >= ${startUtc}::timestamp AND o."createdAt" < ${endUtc}::timestamp`;
  return { created: n(row.created), confirmed: n(row.confirmed), canceled: n(row.canceled) };
}

/** Right now: Loud Styles orders whose parcel is still on its way (not period-bound). */
async function pipelineNow() {
  const [row] = await prisma.$queryRaw`
    WITH lines AS (${LS_LINES})
    SELECT COUNT(DISTINCT p."orderId") AS orders, COALESCE(SUM(lines.revenue), 0) AS value
    FROM yalidine_parcels p
    JOIN lines ON lines.order_id = p."orderId"
    WHERE p."deletedAt" IS NULL AND p."lastStatus" = ANY(${PENDING})`;
  return { orders: n(row.orders), value: round(row.value) };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

async function getOverview(query) {
  const period = resolvePeriod(query);
  const prev = resolvePeriod({ from: period.previous.from, to: period.previous.to, groupBy: period.unit });
  const range = [period.startUtc, period.endUtc];

  const [totals, previous, created, pipeline, seriesRows, products, categories, wilayas] = await Promise.all([
    totalsFor(...range),
    totalsFor(prev.startUtc, prev.endUtc),
    ordersCreated(...range),
    pipelineNow(),
    prisma.$queryRaw`
      WITH outc AS (${OUTCOMES}), lines AS (${LS_LINES})
      SELECT to_char(date_trunc(${period.unit}, (outc.at AT TIME ZONE 'UTC') AT TIME ZONE ${TZ}), 'YYYY-MM-DD') AS bucket,
             COALESCE(SUM(CASE WHEN outc.outcome = 'delivered' THEN lines.revenue END), 0) AS revenue,
             COALESCE(SUM(CASE WHEN outc.outcome = 'delivered' THEN lines.cost END), 0) AS cost,
             COUNT(DISTINCT CASE WHEN outc.outcome = 'delivered' THEN outc.order_id END) AS delivered,
             COUNT(DISTINCT CASE WHEN outc.outcome = 'returned' THEN outc.order_id END) AS returned
      FROM outc JOIN lines ON lines.order_id = outc.order_id
      WHERE outc.outcome IS NOT NULL AND outc.at >= ${range[0]}::timestamp AND outc.at < ${range[1]}::timestamp
      GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw`
      WITH outc AS (${OUTCOMES}), lines AS (${LS_LINES})
      SELECT lines.product_id, MAX(lines.product_name) AS name, SUM(lines.qty) AS qty,
             SUM(lines.revenue) AS revenue, SUM(lines.cost) AS cost, BOOL_OR(lines.cost_missing) AS cost_missing
      FROM outc JOIN lines ON lines.order_id = outc.order_id
      WHERE outc.outcome = 'delivered' AND outc.at >= ${range[0]}::timestamp AND outc.at < ${range[1]}::timestamp
      GROUP BY lines.product_id ORDER BY SUM(lines.revenue) DESC LIMIT 10`,
    prisma.$queryRaw`
      WITH outc AS (${OUTCOMES}), lines AS (${LS_LINES})
      SELECT COALESCE(lines.category_name, 'Sans catégorie') AS name, SUM(lines.qty) AS qty,
             SUM(lines.revenue) AS revenue, SUM(lines.cost) AS cost
      FROM outc JOIN lines ON lines.order_id = outc.order_id
      WHERE outc.outcome = 'delivered' AND outc.at >= ${range[0]}::timestamp AND outc.at < ${range[1]}::timestamp
      GROUP BY 1 ORDER BY SUM(lines.revenue) DESC`,
    prisma.$queryRaw`
      WITH outc AS (${OUTCOMES}), lines AS (${LS_LINES})
      SELECT COALESCE(outc.wilaya, 'Inconnue') AS name,
             COUNT(DISTINCT CASE WHEN outc.outcome = 'delivered' THEN outc.order_id END) AS delivered,
             COUNT(DISTINCT CASE WHEN outc.outcome = 'returned' THEN outc.order_id END) AS returned,
             COALESCE(SUM(CASE WHEN outc.outcome = 'delivered' THEN lines.revenue END), 0) AS revenue
      FROM outc JOIN lines ON lines.order_id = outc.order_id
      WHERE outc.outcome IS NOT NULL AND outc.at >= ${range[0]}::timestamp AND outc.at < ${range[1]}::timestamp
      GROUP BY 1 ORDER BY 4 DESC LIMIT 15`,
  ]);

  // Fill empty buckets so the chart has a continuous axis.
  const byBucket = new Map(seriesRows.map((r) => [r.bucket, r]));
  const series = bucketsBetween(period.from, period.to, period.unit).map((bucket) => {
    const r = byBucket.get(bucket);
    const revenue = r ? n(r.revenue) : 0;
    const cost = r ? n(r.cost) : 0;
    return {
      bucket,
      revenue: round(revenue),
      cost: round(cost),
      profit: round(revenue - cost),
      delivered: r ? n(r.delivered) : 0,
      returned: r ? n(r.returned) : 0,
    };
  });

  const withProfit = (r) => ({
    revenue: round(r.revenue),
    cost: round(r.cost),
    profit: round(n(r.revenue) - n(r.cost)),
    margin: n(r.revenue) > 0 ? ((n(r.revenue) - n(r.cost)) / n(r.revenue)) * 100 : 0,
  });

  return {
    period: { from: period.from, to: period.to, days: period.days, groupBy: period.unit, previous: period.previous },
    totals,
    previous,
    orders: created,
    pipeline,
    series,
    topProducts: products.map((r) => ({ id: r.product_id, name: r.name, qty: n(r.qty), costMissing: !!r.cost_missing, ...withProfit(r) })),
    categories: categories.map((r) => ({ name: r.name, qty: n(r.qty), ...withProfit(r) })),
    wilayas: wilayas.map((r) => {
      const d = n(r.delivered);
      const ret = n(r.returned);
      return { name: r.name, delivered: d, returned: ret, revenue: round(r.revenue), deliveryRate: d + ret > 0 ? (d / (d + ret)) * 100 : null };
    }),
  };
}

/** Per-product profit for Loud Styles over the period, plus stock valuation. */
async function getProfit(query) {
  const period = resolvePeriod(query);
  const [sold, products, totals] = await Promise.all([
    prisma.$queryRaw`
      WITH outc AS (${OUTCOMES}), lines AS (${LS_LINES})
      SELECT lines.product_id, SUM(lines.qty) AS qty, SUM(lines.revenue) AS revenue, SUM(lines.cost) AS cost
      FROM outc JOIN lines ON lines.order_id = outc.order_id
      WHERE outc.outcome = 'delivered' AND outc.at >= ${period.startUtc}::timestamp AND outc.at < ${period.endUtc}::timestamp
      GROUP BY lines.product_id`,
    prisma.product.findMany({
      where: { brand: { slug: BRAND_SLUG }, isDeleted: false },
      select: {
        id: true, name: true, nameAr: true, reference: true, price: true, costPrice: true, stock: true,
        category: { select: { name: true } },
        sizes: { select: { stock: true } },
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    }),
    totalsFor(period.startUtc, period.endUtc),
  ]);

  const soldBy = new Map(sold.map((r) => [r.product_id, r]));
  const rows = products.map((p) => {
    const s = soldBy.get(p.id);
    const stock = p.sizes.length > 0 ? p.sizes.reduce((sum, sz) => sum + (sz.stock || 0), 0) : p.stock || 0;
    const revenue = s ? n(s.revenue) : 0;
    const cost = s ? n(s.cost) : 0;
    return {
      id: p.id,
      name: p.name,
      reference: p.reference,
      category: p.category ? p.category.name : 'Sans catégorie',
      image: p.images[0] ? p.images[0].url : null,
      price: round(p.price),
      costPrice: round(p.costPrice),
      unitProfit: round(p.price - p.costPrice),
      unitMargin: p.price > 0 && p.costPrice > 0 ? ((p.price - p.costPrice) / p.price) * 100 : null,
      costMissing: !(p.costPrice > 0),
      stock,
      stockCostValue: round((p.costPrice || 0) * stock),
      stockRetailValue: round((p.price || 0) * stock),
      sold: s ? n(s.qty) : 0,
      revenue: round(revenue),
      cost: round(cost),
      profit: round(revenue - cost),
      margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : null,
    };
  });

  const categoryMap = new Map();
  for (const r of rows) {
    const c = categoryMap.get(r.category) || { name: r.category, products: 0, sold: 0, revenue: 0, cost: 0, profit: 0 };
    c.products++;
    c.sold += r.sold;
    c.revenue += r.revenue;
    c.cost += r.cost;
    c.profit += r.profit;
    categoryMap.set(r.category, c);
  }
  const categories = [...categoryMap.values()]
    .map((c) => ({ ...c, margin: c.revenue > 0 ? (c.profit / c.revenue) * 100 : null }))
    .sort((a, b) => b.profit - a.profit);

  return {
    period: { from: period.from, to: period.to, days: period.days },
    totals,
    stock: {
      units: rows.reduce((s, r) => s + r.stock, 0),
      costValue: rows.reduce((s, r) => s + r.stockCostValue, 0),
      retailValue: rows.reduce((s, r) => s + r.stockRetailValue, 0),
    },
    productsWithoutCost: rows.filter((r) => r.costMissing).length,
    categories,
    products: rows.sort((a, b) => b.profit - a.profit || b.sold - a.sold),
  };
}

/** Bucket keys (YYYY-MM-DD of the bucket start) between two days, matching Postgres date_trunc. */
function bucketsBetween(from, to, unit) {
  const out = [];
  const start = new Date(`${from}T12:00:00Z`);
  const end = new Date(`${to}T12:00:00Z`);
  const d = new Date(start);
  if (unit === 'week') {
    const dow = (d.getUTCDay() + 6) % 7; // Monday = 0, like date_trunc('week')
    d.setUTCDate(d.getUTCDate() - dow);
  } else if (unit === 'month') d.setUTCDate(1);
  else if (unit === 'year') d.setUTCMonth(0, 1);
  while (d <= end && out.length < 5000) {
    out.push(d.toISOString().slice(0, 10));
    if (unit === 'day') d.setUTCDate(d.getUTCDate() + 1);
    else if (unit === 'week') d.setUTCDate(d.getUTCDate() + 7);
    else if (unit === 'month') d.setUTCMonth(d.getUTCMonth() + 1);
    else d.setUTCFullYear(d.getUTCFullYear() + 1);
  }
  return out;
}

module.exports = { getOverview, getProfit, resolvePeriod, BRAND_SLUG };
