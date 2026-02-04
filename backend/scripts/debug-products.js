const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Searching for products...');
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: 'caftan', mode: 'insensitive' } },
                    { name: { contains: 'djawhara', mode: 'insensitive' } },
                    { name: { contains: 'djebba', mode: 'insensitive' } }
                ]
            },
            include: {
                brand: true,
                category: true,
                images: true
            }
        });

        console.log(`Found ${products.length} products:`);
        products.forEach(p => {
            console.log('-----------------------------------');
            console.log(`Name: ${p.name}`);
            console.log(`Slug: ${p.slug}`);
            console.log(`Active: ${p.isActive}`);
            console.log(`On Sale: ${p.isOnSale}`);
            console.log(`Stock: ${p.stock}`);
            console.log(`Brand: ${p.brand ? p.brand.slug : 'N/A'}`);
            console.log(`Category: ${p.category ? p.category.slug : 'N/A'}`);
            console.log(`Launch Info: isLaunch=${p.isLaunch}, launchAt=${p.launchAt}`);
            console.log(`Created At: ${p.createdAt}`);
            console.log(`Images: ${p.images.length}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
