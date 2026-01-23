const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireStockManager } = require('../middleware/auth');
const prisma = new PrismaClient();
const router = express.Router();

// All inventory routes require authentication and stock manager or admin role
router.use(authenticateToken);
router.use(requireStockManager);

// Schema for creating a reception
const receptionSchema = z.object({
    atelier: z.string().min(1, 'Atelier name is required'),
    date: z.string().optional(),
    notes: z.string().optional(),
    totalCost: z.number().optional().default(0), // New field
    items: z.array(z.object({
        productName: z.string().min(1),
        reference: z.string().optional(),
        size: z.string().nullable().optional(), // Allow null for accessories
        quantity: z.number().int().positive(),
        barcode: z.string().optional()
    })).min(1, 'At least one item is required')
});

// Create a new stock reception
router.post('/receptions', async (req, res) => {
    try {
        const data = receptionSchema.parse(req.body);

        // 1. Create the reception record
        const reception = await prisma.stockReception.create({
            data: {
                atelier: data.atelier,
                date: data.date ? new Date(data.date) : new Date(),
                notes: data.notes,
                totalCost: data.totalCost,
                status: 'COMPLETED',
                paymentStatus: 'PENDING',
                items: {
                    create: data.items.map(item => ({
                        productName: item.productName,
                        reference: item.reference,
                        size: item.size,
                        quantity: item.quantity,
                        barcode: item.barcode
                    }))
                }
            },
            include: {
                items: true
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
        res.status(500).json({ error: 'Failed to create reception' });
    }
});

// Update reception status/payment
router.patch('/receptions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus, totalCost, notes } = req.body;

        const reception = await prisma.stockReception.update({
            where: { id },
            data: {
                paymentStatus,
                totalCost,
                notes
            }
        });

        res.json(reception);
    } catch (error) {
        console.error('Update reception error:', error);
        res.status(500).json({ error: 'Failed to update reception' });
    }
});

// Get all receptions
router.get('/receptions', async (req, res) => {
    try {
        const receptions = await prisma.stockReception.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                items: true
            },
            take: 50
        });

        res.json({ receptions });
    } catch (error) {
        console.error('Fetch receptions error:', error);
        res.status(500).json({ error: 'Failed to fetch receptions' });
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

// Create a stock movement
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

// Get stock movements
router.get('/movements', async (req, res) => {
    try {
        const { type, operationType, limit = 1000 } = req.query;

        const where = {};
        if (type) where.type = type;
        if (operationType) where.operationType = operationType;

        const movements = await prisma.stockMovement.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit)
        });

        res.json({ movements });
    } catch (error) {
        console.error('Fetch stock movements error:', error);
        res.status(500).json({ error: 'Failed to fetch stock movements' });
    }
});

module.exports = router;
