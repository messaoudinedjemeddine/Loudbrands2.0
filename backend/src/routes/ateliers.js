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

module.exports = router;
