// Zakat calculator (Admin only). Mounted at /api/zakat.
//
//   GET    /auto?from=YYYY-MM-DD&to=YYYY-MM-DD   automatic values (Loud Styles):
//                                               stock at cost (now) + delivered sales over the period
//   GET    /                                      saved calculations (newest first)
//   POST   /                                      save a calculation (the server recomputes the result)
//   PATCH  /:id                                   mark paid / edit notes
//   DELETE /:id
//
// base = stock + sales − ateliers − salaries − other charges
// zakat = base × 2.5 % when base ≥ nisab (85 g of gold × gold price per gram), otherwise 0.

const express = require('express');
const { z } = require('zod');
const prisma = require('../config/database');
const analytics = require('../services/analytics');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken, requireRole(['ADMIN']));

const NISAB_GOLD_GRAMS = 85;
const RATE = 0.025;

function compute({ stockValue, salesValue, ateliers, salaries, otherCharges, goldPricePerGram }) {
  const base = stockValue + salesValue - ateliers - salaries - otherCharges;
  const nisab = NISAB_GOLD_GRAMS * goldPricePerGram;
  const zakatDue = base >= nisab && base > 0 ? base * RATE : 0;
  return { base, nisab, rate: RATE, zakatDue };
}

router.get('/auto', async (req, res) => {
  try {
    const report = await analytics.getProfit({ from: req.query.from, to: req.query.to });
    res.json({
      period: report.period,
      stockValue: report.stock.costValue,
      stockUnits: report.stock.units,
      productsWithoutCost: report.productsWithoutCost,
      salesValue: report.totals.revenue,
      deliveredOrders: report.totals.deliveredOrders,
      itemsSold: report.totals.itemsSold,
    });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ error: error.message });
    console.error('Zakat auto values error:', error);
    res.status(500).json({ error: 'Failed to compute values' });
  }
});

router.get('/', async (req, res) => {
  try {
    const calculations = await prisma.zakatCalculation.findMany({ orderBy: [{ periodTo: 'desc' }, { createdAt: 'desc' }] });
    res.json({ calculations });
  } catch (error) {
    console.error('Zakat list error:', error);
    res.status(500).json({ error: 'Failed to load calculations' });
  }
});

const amount = z.number({ invalid_type_error: 'Montant invalide' }).finite().min(0, 'Les montants ne peuvent pas être négatifs').max(1e12);
const saveSchema = z.object({
  periodFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  stockValue: amount,
  salesValue: amount,
  ateliers: amount.default(0),
  salaries: amount.default(0),
  otherCharges: amount.default(0),
  goldPricePerGram: z.number({ required_error: 'Le prix de l’or est obligatoire', invalid_type_error: 'Le prix de l’or est obligatoire' }).finite().positive('Le prix de l’or est obligatoire').max(1e7),
  notes: z.string().max(2000).optional(),
});

router.post('/', async (req, res) => {
  const parsed = saveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
  const d = parsed.data;
  if (d.periodFrom > d.periodTo) return res.status(400).json({ error: 'La date de début est après la date de fin' });
  try {
    const result = compute(d);
    const saved = await prisma.zakatCalculation.create({
      data: {
        periodFrom: new Date(`${d.periodFrom}T00:00:00+01:00`),
        periodTo: new Date(`${d.periodTo}T00:00:00+01:00`),
        stockValue: d.stockValue,
        salesValue: d.salesValue,
        ateliers: d.ateliers,
        salaries: d.salaries,
        otherCharges: d.otherCharges,
        goldPricePerGram: d.goldPricePerGram,
        notes: d.notes || null,
        ...result,
      },
    });
    res.status(201).json(saved);
  } catch (error) {
    console.error('Zakat save error:', error);
    res.status(500).json({ error: 'Failed to save calculation' });
  }
});

router.patch('/:id', async (req, res) => {
  const parsed = z.object({ isPaid: z.boolean().optional(), notes: z.string().max(2000).nullable().optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
  try {
    const data = { ...parsed.data };
    if (data.isPaid !== undefined) data.paidAt = data.isPaid ? new Date() : null;
    const updated = await prisma.zakatCalculation.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Calculation not found' });
    console.error('Zakat update error:', error);
    res.status(500).json({ error: 'Failed to update calculation' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.zakatCalculation.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Calculation not found' });
    console.error('Zakat delete error:', error);
    res.status(500).json({ error: 'Failed to delete calculation' });
  }
});

module.exports = router;
