const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixOrderTotals() {
  try {
    console.log('🔍 Starting to fix order totals...');
    
    // Get all orders
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${orders.length} orders to check`);
    
    let fixedCount = 0;
    
    for (const order of orders) {
      // Calculate what the total should be
      const calculatedSubtotal = order.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
      
      const correctTotal = calculatedSubtotal + order.deliveryFee;
      
      // Check if the total is incorrect
      if (Math.abs(order.total - correctTotal) > 0.01) { // Allow for small floating point differences
        console.log(`🔧 Fixing order ${order.orderNumber}:`);
        console.log(`   Current total: ${order.total}`);
        console.log(`   Correct total: ${correctTotal}`);
        console.log(`   Subtotal: ${calculatedSubtotal}`);
        console.log(`   Delivery fee: ${order.deliveryFee}`);
        
        // Update the order
        await prisma.order.update({
          where: { id: order.id },
          data: {
            subtotal: calculatedSubtotal,
            total: correctTotal
          }
        });
        
        fixedCount++;
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} orders`);
    
  } catch (error) {
    console.error('❌ Error fixing order totals:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrderTotals();

