const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Searching for categories for loud-styles...');
        const brand = await prisma.brand.findUnique({
            where: { slug: 'loud-styles' },
            include: {
                categories: true
            }
        });

        if (!brand) {
            console.log('Brand loud-styles not found!');
            return;
        }

        console.log(`Brand: ${brand.name} (${brand.slug})`);
        console.log(`Categories (${brand.categories.length}):`);
        brand.categories.forEach(c => {
            console.log(`- ${c.name} (${c.slug})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
