const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteKaftansProduct() {
  try {
    console.log('Searching for kaftans products...');
    
    // Search for products with "kaftans" in the name (case insensitive)
    const kaftansProducts = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'kaftans', mode: 'insensitive' } },
          { nameAr: { contains: 'kaftans', mode: 'insensitive' } },
          { slug: { contains: 'kaftans', mode: 'insensitive' } }
        ]
      },
      include: {
        category: true,
        brand: true,
        images: true,
        sizes: true
      }
    });

    if (kaftansProducts.length === 0) {
      console.log('No kaftans products found.');
      return;
    }

    console.log(`Found ${kaftansProducts.length} kaftans product(s):`);
    kaftansProducts.forEach((product, index) => {
      console.log(`${index + 1}. ID: ${product.id}`);
      console.log(`   Name: ${product.name}`);
      console.log(`   Name (Ar): ${product.nameAr}`);
      console.log(`   Slug: ${product.slug}`);
      console.log(`   Brand: ${product.brand?.name || 'N/A'}`);
      console.log(`   Category: ${product.category?.name || 'N/A'}`);
      console.log(`   Images: ${product.images.length}`);
      console.log(`   Sizes: ${product.sizes.length}`);
      console.log('---');
    });

    // Delete each kaftans product
    for (const product of kaftansProducts) {
      console.log(`Deleting product: ${product.name} (ID: ${product.id})`);
      
      // Delete related records first (due to foreign key constraints)
      console.log('Deleting order items...');
      await prisma.orderItem.deleteMany({
        where: { productId: product.id }
      });
      
      console.log('Deleting product images...');
      await prisma.productImage.deleteMany({
        where: { productId: product.id }
      });
      
      console.log('Deleting product sizes...');
      await prisma.productSize.deleteMany({
        where: { productId: product.id }
      });
      
      // Delete the product
      console.log('Deleting product...');
      await prisma.product.delete({
        where: { id: product.id }
      });
      
      console.log(`✅ Successfully deleted: ${product.name}`);
    }

    console.log(`\n🎉 Successfully deleted ${kaftansProducts.length} kaftans product(s) from the database.`);

  } catch (error) {
    console.error('Error deleting kaftans products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteKaftansProduct();
