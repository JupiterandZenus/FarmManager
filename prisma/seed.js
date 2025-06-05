const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function seed() {
  console.log('Starting database seed...');
  
  try {
    // Create default account categories
    const categories = [
      { name: 'Main', description: 'Main accounts' },
      { name: 'Mule', description: 'Mule accounts' },
      { name: 'Farm', description: 'Farming accounts' },
      { name: 'Tutorial', description: 'Accounts in tutorial island' }
    ];
    
    console.log('Creating account categories...');
    for (const category of categories) {
      await prisma.accountCategory.upsert({
        where: { name: category.name },
        update: {},
        create: category
      });
    }
    
    // Create default proxy categories
    const proxyCategories = [
      { name: 'Residential', description: 'Residential proxies' },
      { name: 'Datacenter', description: 'Datacenter proxies' },
      { name: 'Mobile', description: 'Mobile proxies' }
    ];
    
    console.log('Creating proxy categories...');
    for (const category of proxyCategories) {
      await prisma.proxyCategory.upsert({
        where: { name: category.name },
        update: {},
        create: category
      });
    }
    
    // Create sample agent if none exists
    const agentCount = await prisma.agent.count();
    if (agentCount === 0) {
      console.log('Creating sample agent...');
      await prisma.agent.create({
        data: {
          name: 'Local Agent',
          status: 'online',
          ip_address: '127.0.0.1',
          last_seen: new Date(),
          auth_key: 'sample_key_123',
          eternal_farm_id: 'local-agent-1',
          cpu_usage: 0,
          memory_usage: 0,
          disk_usage: 0
        }
      });
    }
    
    console.log('Database seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();