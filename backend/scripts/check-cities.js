const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCities() {
  try {
    console.log('🔍 Checking cities in database...');
    
    const cities = await prisma.city.findMany({
      select: { 
        id: true,
        name: true, 
        nameAr: true 
      }
    });
    
    console.log(`\n📊 Found ${cities.length} cities in database:`);
    cities.forEach(city => {
      console.log(`- ID: ${city.id}, Name: "${city.name}", NameAr: "${city.nameAr}"`);
    });
    
    // Check specifically for Oum El Bouaghi
    const oumElBouaghi = cities.find(city => 
      city.name.toLowerCase().includes('oum') || 
      city.name.toLowerCase().includes('bouaghi') ||
      city.nameAr.includes('أم') ||
      city.nameAr.includes('البواقي')
    );
    
    if (oumElBouaghi) {
      console.log('\n✅ Found Oum El Bouaghi:', oumElBouaghi);
    } else {
      console.log('\n❌ Oum El Bouaghi not found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking cities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkCities();
}

module.exports = { checkCities };
