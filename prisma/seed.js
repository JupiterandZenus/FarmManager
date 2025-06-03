const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log(`--- Start Extended Seeding ---`);

  // Upsert Account Categories
  const accountCategoriesData = [
    { name: 'P2P Accounts' },
    { name: 'Main Accounts' },
    { name: 'Mule Accounts' },
    { name: 'Bot Farm Accounts' },
    { name: 'Trial Accounts' },
    { name: 'Verified Accounts' },
    { name: 'Unverified Accounts' },
    { name: 'Banned Accounts' },
    { name: 'Locked Accounts' },
    { name: 'Unknown Status Accounts' },
  ];

  const accountCategories = {};
  for (const catData of accountCategoriesData) {
    const category = await prisma.accountCategory.upsert({
      where: { name: catData.name },
      update: {},
      create: catData,
    });
    accountCategories[catData.name] = category;
    console.log(`Upserted AccountCategory: ID=${category.id}, Name=${category.name}`);
  }

  // Upsert Agents - Fixed to match schema
  const agentsData = [
    { name: 'TestAgent001', status: 'Active' },
    { name: 'TestAgent002', status: 'Idle' },
  ];
  const agents = {};
  for (const agentData of agentsData) {
    const agent = await prisma.agent.upsert({
      where: { name: agentData.name },
      update: { status: agentData.status },
      create: {
        name: agentData.name,
        status: agentData.status,
      },
    });
    agents[agentData.name] = agent;
    console.log(`Upserted Agent: ID=${agent.id}, Name=${agent.name}, Status=${agent.status}`);
  }

  // Upsert Proxy Category
  const proxyCategoryData = { name: 'Residential Proxies' };
  const proxyCategory = await prisma.proxyCategory.upsert({
    where: { name: proxyCategoryData.name },
    update: {},
    create: proxyCategoryData,
  });
  console.log(`Upserted ProxyCategory: ID=${proxyCategory.id}, Name=${proxyCategory.name}`);

  // Upsert Proxy - Fixed to work with schema
  const proxyData = {
    host: 'proxy.example.com',
    port: 8080,
    username: 'proxyuser',
    password: 'proxypassword',
    category_id: proxyCategory.id,
  };
  
  // First try to find an existing proxy
  const existingProxy = await prisma.proxy.findFirst({
    where: {
      AND: [
        { host: proxyData.host },
        { port: proxyData.port }
      ]
    }
  });

  // Then either update or create
  const proxy = existingProxy 
    ? await prisma.proxy.update({
        where: { id: existingProxy.id },
        data: {
          username: proxyData.username,
          password: proxyData.password,
          category_id: proxyData.category_id,
        }
      })
    : await prisma.proxy.create({
        data: proxyData
      });

  console.log(`${existingProxy ? 'Updated' : 'Created'} Proxy: ID=${proxy.id}, Host=${proxy.host}:${proxy.port}`);

  // Upsert Accounts - one for each category
  const accountsToCreate = [
    { username: 'test_p2p_user_01', categoryName: 'P2P Accounts', agentName: 'TestAgent001', notes: 'P2P test account' },
    { username: 'test_main_user_01', categoryName: 'Main Accounts', agentName: 'TestAgent001', notes: 'Main test account' },
    { username: 'test_mule_user_01', categoryName: 'Mule Accounts', agentName: 'TestAgent002', notes: 'Mule test account' },
    { username: 'test_botfarm_user_01', categoryName: 'Bot Farm Accounts', agentName: 'TestAgent001', notes: 'Bot farm test account' },
    { username: 'test_trial_user_01', categoryName: 'Trial Accounts', agentName: 'TestAgent002', notes: 'Trial test account' },
    { username: 'test_verified_user_01', categoryName: 'Verified Accounts', agentName: 'TestAgent001', notes: 'Verified test account' },
    { username: 'test_unverified_user_01', categoryName: 'Unverified Accounts', agentName: 'TestAgent002', notes: 'Unverified test account' },
    { username: 'test_banned_user_01', categoryName: 'Banned Accounts', agentName: 'TestAgent001', notes: 'Banned test account', status: 'Banned' },
    { username: 'test_locked_user_01', categoryName: 'Locked Accounts', agentName: 'TestAgent002', notes: 'Locked test account', status: 'Locked' },
    { username: 'test_unknown_user_01', categoryName: 'Unknown Status Accounts', agentName: 'TestAgent001', notes: 'Unknown status test account', status: 'Unknown' },
  ];

  for (const accData of accountsToCreate) {
    const category = accountCategories[accData.categoryName];
    const agent = agents[accData.agentName];

    if (!category) {
      console.error(`Error: AccountCategory "${accData.categoryName}" not found for account "${accData.username}". Skipping.`);
      continue;
    }
    if (!agent) {
      console.error(`Error: Agent "${accData.agentName}" not found for account "${accData.username}". Skipping.`);
      continue;
    }

    const account = await prisma.account.upsert({
      where: { username: accData.username },
      update: {
        category_id: category.id,
        agent_id: agent.id,
        proxy_id: proxy.id,
        status: accData.status || 'idle',
      },
      create: {
        username: accData.username,
        password: 'password123',
        email: `${accData.username}@example.com`,
        category_id: category.id,
        agent_id: agent.id,
        proxy_id: proxy.id,
        status: accData.status || 'idle',
      },
    });
    console.log(`Upserted Account: ID=${account.id}, Username=${account.username}, CategoryID=${account.category_id}, AgentID=${account.agent_id}, ProxyID=${account.proxy_id}`);
  }

  console.log(`--- Extended Seeding Finished ---`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Disconnecting Prisma Client from extended seed.');
    await prisma.$disconnect();
  });