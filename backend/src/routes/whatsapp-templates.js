// Predefined WhatsApp messages for delivery agents. Mounted at /api/whatsapp-templates.
// Read: admin, confirmatrice, agent. Write: admin.

const express = require('express');
const { z } = require('zod');
const prisma = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

const canRead = requireRole(['ADMIN', 'CONFIRMATRICE', 'AGENT_LIVRAISON']);
const adminOnly = requireRole(['ADMIN']);

const templateSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est obligatoire').max(100),
  body: z.string().trim().min(1, 'Le message est obligatoire').max(2000),
  statuses: z.array(z.string().trim().min(1)).max(60).default([]),
  reasons: z.array(z.string().trim().min(1)).max(60).default([]),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  isActive: z.boolean().default(true),
});

router.get('/', canRead, async (req, res) => {
  try {
    const where = req.query.all === 'true' && req.user.role === 'ADMIN' ? {} : { isActive: true };
    const templates = await prisma.whatsappTemplate.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ templates });
  } catch (error) {
    console.error('Templates list error:', error);
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

router.post('/', adminOnly, async (req, res) => {
  const parsed = templateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
  try {
    const template = await prisma.whatsappTemplate.create({ data: parsed.data });
    res.status(201).json(template);
  } catch (error) {
    console.error('Template create error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

router.put('/:id', adminOnly, async (req, res) => {
  const parsed = templateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
  try {
    const template = await prisma.whatsappTemplate.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(template);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Template not found' });
    console.error('Template update error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await prisma.whatsappTemplate.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Template not found' });
    console.error('Template delete error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

module.exports = router;
