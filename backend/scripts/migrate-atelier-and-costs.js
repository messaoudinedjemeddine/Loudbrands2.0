/**
 * Legacy data migration: Atelier + Cost backfill
 *
 * 1. Extract distinct atelier names from stock_receptions.atelier (atelierLegacy).
 * 2. Create Atelier records for each name.
 * 3. Update StockReception rows to set atelierId.
 * 4. For receptions with totalCost 0: backfill StockReceptionItem.unitCost from Product.costPrice
 *    and recalculate StockReception.totalCost.
 *
 * Run after applying the Prisma migration 20260202000000_atelier_and_reception_refactor.
 * Usage: node scripts/migrate-atelier-and-costs.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting Atelier + Cost migration...');

    // 1. Get all receptions that still have legacy atelier string (atelierLegacy)
    const receptions = await prisma.stockReception.findMany({
        where: { atelierLegacy: { not: null } },
        include: { items: true }
    });

    const distinctNames = [...new Set(receptions.map(r => r.atelierLegacy?.trim()).filter(Boolean))];
    console.log(`Found ${distinctNames.length} distinct atelier names:`, distinctNames);

    // 2. Create Atelier records (skip if name already exists)
    const nameToId = {};
    for (const name of distinctNames) {
        const existing = await prisma.atelier.findUnique({ where: { name } });
        if (existing) {
            nameToId[name] = existing.id;
        } else {
            const created = await prisma.atelier.create({ data: { name } });
            nameToId[name] = created.id;
            console.log(`  Created Atelier: ${name}`);
        }
    }

    // 3. Update StockReception atelierId
    let updatedReceptions = 0;
    for (const r of receptions) {
        const name = r.atelierLegacy?.trim();
        if (!name || !nameToId[name]) continue;
        await prisma.stockReception.update({
            where: { id: r.id },
            data: { atelierId: nameToId[name] }
        });
        updatedReceptions++;
    }
    console.log(`Updated atelierId on ${updatedReceptions} receptions.`);

    // 4. Recalculate costs for receptions with totalCost 0: backfill unitCost and totalCost
    const zeroCostReceptions = await prisma.stockReception.findMany({
        where: { totalCost: 0 },
        include: { items: true }
    });
    console.log(`Found ${zeroCostReceptions.length} receptions with totalCost 0 to backfill.`);

    for (const reception of zeroCostReceptions) {
        let totalCost = 0;
        for (const item of reception.items) {
            let unitCost = 0;
            if (item.reference) {
                const product = await prisma.product.findUnique({
                    where: { reference: item.reference },
                    select: { costPrice: true }
                });
                unitCost = product?.costPrice ?? 0;
            }
            totalCost += unitCost * item.quantity;
            await prisma.stockReceptionItem.update({
                where: { id: item.id },
                data: { unitCost }
            });
        }
        await prisma.stockReception.update({
            where: { id: reception.id },
            data: { totalCost }
        });
    }
    console.log(`Backfilled unitCost and totalCost for ${zeroCostReceptions.length} receptions.`);
    console.log('Migration completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
