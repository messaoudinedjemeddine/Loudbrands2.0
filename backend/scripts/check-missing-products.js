const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProducts() {
    try {
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: 'Sultana', mode: 'insensitive' } },
                    { name: { contains: 'Djawhara', mode: 'insensitive' } },
                    { name: { contains: 'Caftan', mode: 'insensitive' } }
                ]
            },
            include: {
                brand: true,
                category: true
            }
        });

        console.log('Found products:', JSON.stringify(products, null, 2));

        // Also count total products per brand to see if pagination is hiding them
        const loudimCount = await prisma.product.count({ where: { brand: { slug: 'loudim' } } });
        const loudStylesCount = await prisma.product.count({ where: { brand: { slug: 'loud-styles' } } });

        console.log('Total Loudim products:', loudimCount);
        console.log('Total Loud Styles products:', loudStylesCount);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkProducts();
