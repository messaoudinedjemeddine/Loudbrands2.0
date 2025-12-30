const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProducts() {
    try {
        // Count per brand
        const loudimCount = await prisma.product.count({ where: { brand: { slug: 'loudim' } } });
        const loudStylesCount = await prisma.product.count({ where: { brand: { slug: 'loud-styles' } } });

        console.log('Total Loudim products:', loudimCount);
        console.log('Total Loud Styles products:', loudStylesCount);

        // Check specific products
        const specificProducts = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: 'Sultana', mode: 'insensitive' } },
                    { name: { contains: 'Djawhara', mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                isActive: true,
                stock: true,
                brand: { select: { slug: true } }
            }
        });

        console.log('Specific products found:', JSON.stringify(specificProducts, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkProducts();
