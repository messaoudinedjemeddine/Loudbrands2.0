
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('1. All orders with tracking:');
        const count = await prisma.order.count({
            where: { trackingNumber: { not: null } }
        });
        console.log(`   -> ${count}`);

        console.log('2. Orders with tracking AND CONFIRMED status:');
        const confirmedCount = await prisma.order.count({
            where: {
                trackingNumber: { not: null },
                callCenterStatus: 'CONFIRMED'
            }
        });
        console.log(`   -> ${confirmedCount}`);

        console.log('3. Sample of 5 orders with tracking:');
        const samples = await prisma.order.findMany({
            where: { trackingNumber: { not: null } },
            take: 5,
            select: { id: true, trackingNumber: true, callCenterStatus: true, deliveryStatus: true }
        });
        console.log(JSON.stringify(samples, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
