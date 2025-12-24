const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@example.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPERADMIN'
    }
  });

  console.log('✅ Admin user created:', admin.email);

  // Create categories
  const categories = [
    {
      name: 'Electronics',
      nameAr: 'إلكترونيات',
      slug: 'electronics',
      description: 'Latest electronic devices and gadgets',
      image: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Fashion',
      nameAr: 'أزياء',
      slug: 'fashion',
      description: 'Trendy clothing and accessories',
      image: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Home & Garden',
      nameAr: 'المنزل والحديقة',
      slug: 'home-garden',
      description: 'Home improvement and garden supplies',
      image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Sports',
      nameAr: 'رياضة',
      slug: 'sports',
      description: 'Sports equipment and fitness gear',
      image: 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  for (const categoryData of categories) {
    await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {},
      create: categoryData
    });
  }

  console.log('✅ Categories created');

  // Create cities
  const cities = [
    { name: 'Algiers', nameAr: 'الجزائر', code: 'ALG' },
    { name: 'Oran', nameAr: 'وهران', code: 'ORN' },
    { name: 'Constantine', nameAr: 'قسنطينة', code: 'CST' },
    { name: 'Annaba', nameAr: 'عنابة', code: 'ANB' },
    { name: 'Blida', nameAr: 'البليدة', code: 'BLD' }
  ];

  for (const cityData of cities) {
    await prisma.city.upsert({
      where: { code: cityData.code },
      update: {},
      create: cityData
    });
  }

  console.log('✅ Cities created');

  // Create delivery desks
  const algiersCity = await prisma.city.findUnique({ where: { code: 'ALG' } });
  
  if (algiersCity) {
    await prisma.deliveryDesk.upsert({
      where: { id: 'desk-1' },
      update: {},
      create: {
        id: 'desk-1',
        name: 'Algiers Central Desk',
        nameAr: 'مكتب الجزائر المركزي',
        address: 'Downtown Algiers',
        phone: '+213 21 123 456',
        cityId: algiersCity.id
      }
    });
  }

  console.log('✅ Delivery desks created');

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });