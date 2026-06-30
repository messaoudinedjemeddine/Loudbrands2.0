const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🌱 Creating test users...');

    // Create Confirmatrice user
    const confirmatricePassword = await bcrypt.hash('confirmatrice123', 12);
    const confirmatrice = await prisma.user.upsert({
      where: { email: 'confirmatrice@test.com' },
      update: {},
      create: {
        email: 'confirmatrice@test.com',
        password: confirmatricePassword,
        firstName: 'Confirmatrice',
        lastName: 'User',
        role: 'CONFIRMATRICE'
      }
    });
    console.log('✅ Confirmatrice user created:', confirmatrice.email);

    // Create Agent Livraison user
    const agentPassword = await bcrypt.hash('agent123', 12);
    const agent = await prisma.user.upsert({
      where: { email: 'agent@test.com' },
      update: {},
      create: {
        email: 'agent@test.com',
        password: agentPassword,
        firstName: 'Agent',
        lastName: 'Livraison',
        role: 'AGENT_LIVRAISON'
      }
    });
    console.log('✅ Agent Livraison user created:', agent.email);

    console.log('\n🎉 Test users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('1. Confirmatrice:');
    console.log('   Email: confirmatrice@test.com');
    console.log('   Password: confirmatrice123');
    console.log('   Role: CONFIRMATRICE');
    console.log('\n2. Agent Livraison:');
    console.log('   Email: agent@test.com');
    console.log('   Password: agent123');
    console.log('   Role: AGENT_LIVRAISON');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
if (require.main === module) {
  createTestUsers();
}

module.exports = createTestUsers;
