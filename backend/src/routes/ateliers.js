const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireStockManager } = require('../middleware/auth');
const prisma = new PrismaClient();
const router = express.Router();

router.use(authenticateToken);
router.use(requireStockManager);

// GET all ateliers
router.get('/', async (req, res) => {
    try {
        const ateliers = await prisma.atelier.findMany({
            orderBy: { name: 'asc' }
        });
        res.json({ ateliers });
    } catch (error) {
        console.error('Fetch ateliers error:', error);
        res.status(500).json({ error: 'Failed to fetch ateliers' });
    }
});

// POST create atelier
const createAtelierSchema = z.object({
    name: z.string().min(1, 'Atelier name is required').trim()
});

router.post('/', async (req, res) => {
    try {
        const { name } = createAtelierSchema.parse(req.body);
        const atelier = await prisma.atelier.create({
            data: { name }
        });
        res.status(201).json(atelier);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'An atelier with this name already exists' });
        }
        console.error('Create atelier error:', error);
        res.status(500).json({ error: 'Failed to create atelier' });
    }
});

// DELETE atelier (only if no receptions)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const count = await prisma.stockReception.count({ where: { atelierId: id } });
        if (count > 0) {
            return res.status(400).json({ error: 'Impossible de supprimer : cet atelier a des réceptions. Supprimez d\'abord les réceptions ou réaffectez-les.' });
        }
        await prisma.atelier.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Atelier introuvable' });
        }
        console.error('Delete atelier error:', error);
        res.status(500).json({ error: 'Failed to delete atelier' });
    }
});

module.exports = router;
