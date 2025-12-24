const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserRoles() {
  try {
    console.log('Updating user roles...');

    // Get all users and update them to ADMIN role
    const users = await prisma.user.findMany();
    
    if (users.length > 0) {
      const updates = await prisma.user.updateMany({
        data: {
          role: 'ADMIN'
        }
      });

      console.log(`Updated ${updates.count} users to ADMIN role`);
    } else {
      console.log('No users found to update');
    }

    // You can manually update specific users to other roles as needed
    // Example:
    // await prisma.user.updateMany({
    //   where: { email: 'confirmatrice@example.com' },
    //   data: { role: 'CONFIRMATRICE' }
    // });

    // await prisma.user.updateMany({
    //   where: { email: 'delivery@example.com' },
    //   data: { role: 'AGENT_LIVRAISON' }
    // });

    console.log('Role update completed successfully!');
  } catch (error) {
    console.error('Error updating roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserRoles();
