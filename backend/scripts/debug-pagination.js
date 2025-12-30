const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Listing all active products for loud-styles...');
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                brand: {
                    slug: 'loud-styles'
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                name: true,
                createdAt: true
            }
        });

        console.log(`Found ${products.length} products:`);
        products.forEach((p, index) => {
            console.log(`${index + 1}. ${p.name} (${p.createdAt})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
