const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function renumberOrders() {
    try {
        console.log('🚀 Starting Order Renumbering...');

        // Fetch all orders sorted by creation date (oldest first)
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'asc' },
            select: { id: true, orderNumber: true, createdAt: true }
        });

        console.log(`Found ${orders.length} orders to update.`);

        if (orders.length === 0) {
            console.log('No orders found.');
            return;
        }

        // PHASE 1: Temporary Rename
        // We do this to avoid unique constraint violations (e.g. if we rename #5 to #1, but #1 already exists)
        console.log('\nPhase 1: Applying temporary IDs to avoid collisions...');
        for (let i = 0; i < orders.length; i++) {
            await prisma.order.update({
                where: { id: orders[i].id },
                data: { orderNumber: `TEMP-${orders[i].id}` }
            });
            if ((i + 1) % 10 === 0) process.stdout.write(`.`);
        }
        console.log(' Done.');

        // PHASE 2: Assign Sequential Numbers
        console.log('\nPhase 2: Assigning new sequential numbers (000001, 000002...)...');
        for (let i = 0; i < orders.length; i++) {
            // Generate 000001, 000002, etc.
            const newOrderNumber = String(i + 1).padStart(6, '0');

            await prisma.order.update({
                where: { id: orders[i].id },
                data: { orderNumber: newOrderNumber }
            });

            process.stdout.write(`\rUpdated ${i + 1}/${orders.length}: ${newOrderNumber}`);
        }

        console.log('\n\n✅ Successfully renumbered all orders!');

    } catch (error) {
        console.error('\n❌ Error renumbering orders:', error);
    } finally {
        await prisma.$disconnect();
        process.exit();
    }
}

renumberOrders();
