
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const dotenv = require('dotenv');
const yalidineService = require('../src/services/yalidine');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

// Helper to sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log('🔄 Starting Yalidine Historical Sync...');

    try {
        // 1. Fetch all shipments from Yalidine
        // Increase page_size to get as many as possible
        console.log('📦 Fetching shipments from Yalidine...');

        let allShipments = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            console.log(`Reading page ${page}...`);
            try {
                // Fetch data with generous timeout/retry logic internally handled by service
                // Note: getAllParcels uses throttling to respect quota
                const response = await yalidineService.getAllParcels({ page: page });

                if (response.data && response.data.length > 0) {
                    allShipments = [...allShipments, ...response.data];
                    console.log(`   + Got ${response.data.length} shipments (Total so far: ${allShipments.length})`);
                }

                hasMore = response.has_more;
                page++;

                // Safety break to avoid infinite loops if API misbehaves
                if (page > 50) {
                    console.warn('⚠️ Reached 50 pages limit, stopping fetch safely.');
                    hasMore = false;
                }

                // Small pause between pages
                await sleep(1000);

            } catch (err) {
                console.error(`❌ Error fetching page ${page}:`, err.message);
                hasMore = false; // Stop on error
            }
        }

        console.log(`✅ Fetched total ${allShipments.length} shipments from Yalidine.`);

        // 2. Update Database
        console.log('💾 Updating database orders...');
        let updatedCount = 0;
        let notFoundCount = 0;
        let errorCount = 0;

        for (const shipment of allShipments) {
            const tracking = shipment.tracking;
            const status = shipment.last_status;

            if (!tracking) continue;

            try {
                // Find order by tracking
                const order = await prisma.order.findFirst({
                    where: { trackingNumber: tracking }
                });

                if (order) {
                    // Only update if status is different or missing
                    if (order.deliveryStatus !== status) {
                        await prisma.order.update({
                            where: { id: order.id },
                            data: {
                                deliveryStatus: status,
                                updatedAt: new Date() // Mark as updated now
                            }
                        });
                        process.stdout.write('.'); // Progress dot
                        updatedCount++;
                    }
                } else {
                    notFoundCount++;
                }
            } catch (err) {
                errorCount++;
                console.error(`\n❌ Error updating order ${tracking}: ${err.message}`);
            }
        }

        console.log('\n\n🎉 Sync Complete!');
        console.log(`-----------------------------------`);
        console.log(`✅ Updated: ${updatedCount} orders`);
        console.log(`⚠️ Skipped/Not Found: ${notFoundCount} tracking numbers`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`-----------------------------------`);

    } catch (error) {
        console.error('❌ Fatal Error during sync:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
