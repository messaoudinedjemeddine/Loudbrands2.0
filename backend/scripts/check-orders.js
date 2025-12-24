const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOrders() {
  try {
    console.log('🔍 Checking orders...');
    
    // Get a few sample orders
    const orders = await prisma.order.findMany({
      take: 5,
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Found ${orders.length} recent orders`);
    
    for (const order of orders) {
      const calculatedSubtotal = order.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
      
      const correctTotal = calculatedSubtotal + order.deliveryFee;
      
      console.log(`\n📦 Order ${order.orderNumber}:`);
      console.log(`   Customer: ${order.customerName}`);
      console.log(`   Delivery Type: ${order.deliveryType}`);
      console.log(`   Items: ${order.items.length}`);
      console.log(`   Subtotal (stored): ${order.subtotal}`);
      console.log(`   Subtotal (calculated): ${calculatedSubtotal}`);
      console.log(`   Delivery Fee: ${order.deliveryFee}`);
      console.log(`   Total (stored): ${order.total}`);
      console.log(`   Total (correct): ${correctTotal}`);
      console.log(`   Difference: ${order.total - correctTotal}`);
    }
    
    // Check total revenue
    const totalRevenue = await prisma.order.aggregate({
      _sum: {
        total: true
      }
    });
    
    console.log(`\n💰 Total Revenue: ${totalRevenue._sum.total || 0}`);
    
  } catch (error) {
    console.error('❌ Error checking orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();

