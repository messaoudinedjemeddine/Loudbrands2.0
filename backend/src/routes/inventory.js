const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireStockManager } = require('../middleware/auth');
const prisma = new PrismaClient();
const router = express.Router();

// All inventory routes require authentication and stock manager or admin role
router.use(authenticateToken);
router.use(requireStockManager);

// Schema for creating a reception (atelierId required; backend computes totalCost from product costPrice)
const receptionSchema = z.object({
    atelierId: z.string().min(1, 'Atelier is required'),
    date: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
        productName: z.string().min(1),
        reference: z.string().optional(),
        size: z.string().nullable().optional(),
        quantity: z.number().int().positive(),
        barcode: z.string().optional()
    })).min(1, 'At least one item is required')
});

// Create a new stock reception (backend computes unitCost from Product.costPrice and totalCost)
router.post('/receptions', async (req, res) => {
    try {
        const data = receptionSchema.parse(req.body);

        // Ensure atelier exists (avoids FK error and gives clear message)
        const atelier = await prisma.atelier.findUnique({
            where: { id: data.atelierId }
        });
        if (!atelier) {
            return res.status(400).json({ error: 'Atelier not found. Create it first in Admin → Ateliers.' });
        }

        // Resolve unitCost for each item from Product.costPrice (snapshot at reception time)
        const itemsWithUnitCost = await Promise.all(data.items.map(async (item) => {
            let unitCost = 0;
            if (item.reference) {
                const product = await prisma.product.findUnique({
                    where: { reference: item.reference },
                    select: { costPrice: true }
                });
                unitCost = product?.costPrice ?? 0;
            }
            return {
                productName: item.productName,
                reference: item.reference,
                size: item.size,
                quantity: item.quantity,
                unitCost,
                barcode: item.barcode
            };
        }));

        const totalCost = itemsWithUnitCost.reduce((sum, i) => sum + i.unitCost * i.quantity, 0);

        const reception = await prisma.stockReception.create({
            data: {
                atelierId: data.atelierId,
                atelierLegacy: atelier.name, // Keep legacy column populated (DB may still have NOT NULL on "atelier")
                date: data.date ? new Date(data.date) : new Date(),
                notes: data.notes,
                totalCost,
                amountPaid: 0,
                status: 'COMPLETED',
                paymentStatus: 'PENDING',
                items: {
                    create: itemsWithUnitCost
                }
            },
            include: {
                items: true,
                atelier: true
            }
        });

        // 2. Update stock for each item
        const results = [];
        for (const item of data.items) {
            if (!item.reference) {
                results.push({ item, status: 'skipped', reason: 'No reference' });
                continue;
            }

            // Find product by reference
            const product = await prisma.product.findUnique({
                where: { reference: item.reference },
                include: { 
                    sizes: true,
                    category: true // Include category to check if it's an accessory
                }
            });

            if (!product) {
                console.log(`[StockIn] Product not found: ${item.reference}`);
                results.push({ item, status: 'failed', reason: 'Product not found' });
                continue;
            }

            // Check if product is an accessory
            const categorySlug = product.category?.slug?.toLowerCase() || '';
            const isAccessoire = categorySlug.includes('accessoire') || 
                                categorySlug.includes('accessories') ||
                                !product.sizes || 
                                product.sizes.length === 0;

            if (isAccessoire) {
                // For accessories, update product stock directly (no size-based stock)
                const oldStock = product.stock || 0;
                const newStock = oldStock + item.quantity;

                console.log(`[StockIn] Updating accessory ${item.reference}: ${oldStock} -> ${newStock}`);

                await prisma.product.update({
                    where: { id: product.id },
                    data: { stock: newStock }
                });

                results.push({ item, status: 'success' });
            } else {
                // For regular products, require size
                if (!item.size || item.size.trim() === '') {
                    console.log(`[StockIn] Size required for product: ${item.reference}`);
                    results.push({ item, status: 'failed', reason: `Size is required for product "${product.name}". Format: ${product.reference}-TAILLE` });
                    continue;
                }

                // Find size (insensitive and trimmed)
                const targetSize = item.size.trim().toLowerCase();
                const sizeObj = product.sizes.find(s => s.size.trim().toLowerCase() === targetSize);

                if (!sizeObj) {
                    console.log(`[StockIn] Size not found: ${item.size} for ${item.reference}. Available: ${product.sizes.map(s => s.size).join(', ')}`);
                    results.push({ item, status: 'failed', reason: `Size "${item.size}" not found. Available: ${product.sizes.map(s => s.size).join(', ')}` });
                    continue;
                }

                // Update stock
                const oldStock = sizeObj.stock;
                const newStock = oldStock + item.quantity;

                console.log(`[StockIn] Updating ${item.reference} [${sizeObj.size}]: ${oldStock} -> ${newStock}`);

                await prisma.productSize.update({
                    where: { id: sizeObj.id },
                    data: { stock: newStock }
                });

                // Update total product stock
                const totalStock = await prisma.productSize.aggregate({
                    where: { productId: product.id },
                    _sum: { stock: true }
                });

                await prisma.product.update({
                    where: { id: product.id },
                    data: { stock: totalStock._sum.stock || 0 }
                });

                results.push({ item, status: 'success' });
            }
        }

        res.json({
            success: true,
            reception,
            stockUpdates: results
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Create reception error:', error);
        let message = error.meta?.cause || error.message || 'Failed to create reception';
        if (error.code === 'P2003') {
            message = 'Atelier introuvable. Créez d\'abord un atelier dans Admin → Ateliers.';
        }
        if (error.code === 'P2010' || (error.message && error.message.includes('does not exist'))) {
            message = 'Base de données non à jour. Exécutez les migrations sur le backend (Heroku).';
        }
        res.status(500).json({ error: message });
    }
});

// Update reception (payment: amountPaid + derived paymentStatus; or notes)
router.patch('/receptions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus, totalCost, amountPaid, notes } = req.body;

        const updates = {};
        if (notes !== undefined) updates.notes = notes;
        if (totalCost !== undefined) updates.totalCost = totalCost;
        if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;

        if (amountPaid !== undefined) {
            updates.amountPaid = amountPaid;
            const reception = await prisma.stockReception.findUnique({ where: { id }, select: { totalCost: true } });
            const total = reception?.totalCost ?? 0;
            if (amountPaid >= total) updates.paymentStatus = 'PAID';
            else if (amountPaid > 0) updates.paymentStatus = 'PARTIAL';
            else updates.paymentStatus = 'PENDING';
        }

        const reception = await prisma.stockReception.update({
            where: { id },
            data: updates,
            include: { atelier: true, items: true }
        });

        res.json(reception);
    } catch (error) {
        console.error('Update reception error:', error);
        res.status(500).json({ error: 'Failed to update reception' });
    }
});

// Delete reception (and its items by cascade)
router.delete('/receptions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.stockReception.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Réception introuvable' });
        }
        console.error('Delete reception error:', error);
        res.status(500).json({ error: 'Failed to delete reception' });
    }
});

// Get all receptions (with atelier relation)
router.get('/receptions', async (req, res) => {
    try {
        const receptions = await prisma.stockReception.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                items: true,
                atelier: true
            },
            take: 200
        });

        res.json({ receptions });
    } catch (error) {
        console.error('Fetch receptions error:', error);
        res.status(500).json({ error: 'Failed to fetch receptions' });
    }
});

// ---------------------------------------------------------------------------
// Tracking validation: scoped per operationType (SORTIE, ECHANGE, RETOUR)
// ---------------------------------------------------------------------------

/**
 * Reusable helper: returns true if trackingNumber has NOT been used yet for this operationType.
 * Uniqueness is (trackingNumber + operationType), not global.
 * @param {string} trackingNumber
 * @param {string} operationType - 'sortie' | 'echange' | 'retour'
 * @returns {Promise<boolean>} true = valid (can use), false = already used
 */
async function validateTracking(trackingNumber, operationType) {
    if (!trackingNumber || !operationType) return true;
    const normalized = String(trackingNumber).trim().toUpperCase();
    const op = String(operationType).toLowerCase();
    const existing = await prisma.stockMovement.findFirst({
        where: {
            trackingNumber: { equals: normalized, mode: 'insensitive' },
            operationType: op
        }
    });
    return !existing;
}

// GET /inventory/validate-tracking?trackingNumber=XXX&operationType=sortie
router.get('/validate-tracking', async (req, res) => {
    try {
        const { trackingNumber, operationType } = req.query;
        if (!trackingNumber || !operationType) {
            return res.status(400).json({ error: 'trackingNumber and operationType are required' });
        }
        const valid = await validateTracking(trackingNumber, operationType);
        const op = String(operationType).toLowerCase();
        const message = valid ? null : `Tracking number already used in ${op === 'sortie' ? 'Stock Out' : op === 'echange' ? 'Exchange' : 'Return'}.`;
        res.json({ valid, message });
    } catch (error) {
        console.error('Validate tracking error:', error);
        res.status(500).json({ error: 'Failed to validate tracking' });
    }
});

// GET /inventory/lookup-sortie-by-tracking?trackingNumber=XXX
// Returns products from the most recent SORTIE movement(s) with this tracking (for Retour auto-lookup).
router.get('/lookup-sortie-by-tracking', async (req, res) => {
    try {
        const { trackingNumber } = req.query;
        if (!trackingNumber) {
            return res.status(400).json({ error: 'trackingNumber is required' });
        }
        const normalized = String(trackingNumber).trim();
        const movements = await prisma.stockMovement.findMany({
            where: {
                trackingNumber: { equals: normalized, mode: 'insensitive' },
                operationType: 'sortie'
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        const items = movements.map(m => ({
            productName: m.productName,
            productReference: m.productReference,
            size: m.size || '',
            quantity: m.quantity,
            barcode: m.barcode || (m.productReference && m.size ? `${m.productReference}-${m.size}` : m.productReference)
        }));
        res.json({ items, count: items.length });
    } catch (error) {
        console.error('Lookup sortie by tracking error:', error);
        res.status(500).json({ error: 'Failed to lookup' });
    }
});

// Schema for creating a stock movement
const stockMovementSchema = z.object({
    type: z.enum(['in', 'out']),
    barcode: z.string().optional().nullable(),
    productName: z.string(),
    productReference: z.string().optional().nullable(),
    size: z.string().optional().nullable(),
    quantity: z.number().int().positive(),
    oldStock: z.number().int().optional().nullable(),
    newStock: z.number().int().optional().nullable(),
    orderNumber: z.string().optional().nullable(),
    trackingNumber: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    operationType: z.enum(['entree', 'sortie', 'echange', 'retour']).optional().nullable()
});

// Create a stock movement (no per-request tracking validation here; caller must validate once before creating multiple movements for same tracking)
router.post('/movements', async (req, res) => {
    try {
        const data = stockMovementSchema.parse(req.body);

        const movement = await prisma.stockMovement.create({
            data: {
                type: data.type,
                barcode: data.barcode,
                productName: data.productName,
                productReference: data.productReference,
                size: data.size,
                quantity: data.quantity,
                oldStock: data.oldStock,
                newStock: data.newStock,
                orderNumber: data.orderNumber,
                trackingNumber: data.trackingNumber,
                notes: data.notes,
                operationType: data.operationType
            }
        });

        res.json({ success: true, movement });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Create stock movement error:', error);
        res.status(500).json({ error: 'Failed to create stock movement' });
    }
});

// Get stock movements (max 10000 to return all sortie/entree operations for admin)
const STOCK_MOVEMENTS_MAX_LIMIT = 10000;
router.get('/movements', async (req, res) => {
    try {
        const { type, operationType, limit = 5000 } = req.query;

        const where = {};
        if (type) where.type = type;
        if (operationType) where.operationType = operationType;

        let take = parseInt(limit, 10);
        if (isNaN(take) || take < 1) take = 5000;
        if (take > STOCK_MOVEMENTS_MAX_LIMIT) take = STOCK_MOVEMENTS_MAX_LIMIT;

        const movements = await prisma.stockMovement.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take
        });

        res.json({ movements });
    } catch (error) {
        console.error('Fetch stock movements error:', error);
        res.status(500).json({ error: 'Failed to fetch stock movements' });
    }
});

module.exports = router;
