const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addBrands() {
  try {
    console.log('🏷️ Adding Loud Styles and Loudim brands...');

    // Add Loud Styles brand
    const loudStyles = await prisma.brand.upsert({
      where: { slug: 'loud-styles' },
      update: {},
      create: {
        name: 'Loud Styles',
        nameAr: 'أصوات الأزياء',
        description: 'Elegant Algerian traditional fashion for the modern woman',
        descriptionAr: 'أزياء تقليدية جزائرية أنيقة للمرأة العصرية',
        slug: 'loud-styles',
        isActive: true,
        logo: '/logos/loud-styles-logo.png'
      }
    });

    console.log('✅ Loud Styles brand created:', loudStyles.name);

    // Add Loudim brand
    const loudim = await prisma.brand.upsert({
      where: { slug: 'loudim' },
      update: {},
      create: {
        name: 'Loudim',
        nameAr: 'لوديم',
        description: 'Premium men\'s fashion and lifestyle brand',
        descriptionAr: 'علامة أزياء ونمط حياة رجالية فاخرة',
        slug: 'loudim',
        isActive: true,
        logo: '/logos/loudim-logo.png'
      }
    });

    console.log('✅ Loudim brand created:', loudim.name);

    console.log('\n🎉 Brands added successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Loud Styles: ${loudStyles.slug} (${loudStyles.name})`);
    console.log(`- Loudim: ${loudim.slug} (${loudim.name})`);

    console.log('\n🌐 Your brands are now available at:');
    console.log(`- https://loudbrandss.com/loud-styles`);
    console.log(`- https://loudbrandss.com/loudim`);

  } catch (error) {
    console.error('❌ Error adding brands:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the brand addition
if (require.main === module) {
  addBrands();
}

module.exports = addBrands;
