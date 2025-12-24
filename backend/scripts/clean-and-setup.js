const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function cleanAndSetup() {
  try {
    console.log('🧹 Starting database cleanup and setup...');

    // Delete all data in the correct order (respecting foreign key constraints)
    console.log('🗑️ Deleting all existing data...');
    
    // Delete order items first (they reference orders and products)
    await prisma.orderItem.deleteMany();
    console.log('✅ Deleted all order items');

    // Delete orders
    await prisma.order.deleteMany();
    console.log('✅ Deleted all orders');

    // Delete product sizes
    await prisma.productSize.deleteMany();
    console.log('✅ Deleted all product sizes');

    // Delete product images
    await prisma.productImage.deleteMany();
    console.log('✅ Deleted all product images');

    // Delete products
    await prisma.product.deleteMany();
    console.log('✅ Deleted all products');

    // Delete categories
    await prisma.category.deleteMany();
    console.log('✅ Deleted all categories');

    // Delete brands
    await prisma.brand.deleteMany();
    console.log('✅ Deleted all brands');

    // Delete delivery desks
    await prisma.deliveryDesk.deleteMany();
    console.log('✅ Deleted all delivery desks');

    // Delete cities
    await prisma.city.deleteMany();
    console.log('✅ Deleted all cities');

    // Delete all users
    await prisma.user.deleteMany();
    console.log('✅ Deleted all users');

    console.log('🎉 Database cleaned successfully!');

    // Create your admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'messaoudinedjemeddine@gmail.com',
        password: hashedPassword,
        firstName: 'Messaoudine',
        lastName: 'Djemeddine',
        role: 'ADMIN'
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: admin123`);
    console.log(`👤 Role: ${admin.role}`);

    console.log('\n🎉 Database setup completed!');
    console.log('You can now login with:');
    console.log('Email: messaoudinedjemeddine@gmail.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Error during cleanup and setup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup and setup
if (require.main === module) {
  cleanAndSetup();
}

module.exports = cleanAndSetup;
