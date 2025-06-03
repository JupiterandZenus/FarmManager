const fetch = require('node-fetch');

// Configuration from docker-compose.yml
const config = {
    API_URL: 'https://api.eternalfarm.net',
    API_KEY: 'RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5',
    AGENT_KEY: 'RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5',
    DISCORD_WEBHOOK: 'https://discord.com/api/webhooks/1358933950210379816/Pdfyxcilip-xI3-q5ILOl9eRCl0nhEICZHZuvbyQm9aARgzI7GuHQExqBj1NNfkScPvV'
};

async function testAPIConnection() {
    console.log('🔍 Testing EternalFarm API Connection');
    console.log('=====================================');
    
    try {
        // Test agents endpoint
        console.log('\n📡 Testing /v1/agents endpoint...');
        const agentsResponse = await fetch(`${config.API_URL}/v1/agents`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.AGENT_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Status: ${agentsResponse.status} ${agentsResponse.statusText}`);
        if (agentsResponse.ok) {
            const data = await agentsResponse.json();
            console.log('✅ Successfully connected to agents endpoint');
            console.log(`Found ${data.data?.length || 0} agents`);
        } else {
            console.log('❌ Failed to connect to agents endpoint');
            console.log(await agentsResponse.text());
        }

        // Test accounts endpoint
        console.log('\n📡 Testing /v1/accounts endpoint...');
        const accountsResponse = await fetch(`${config.API_URL}/v1/accounts`, {
            headers: {
                'Authorization': `Bearer ${config.API_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${accountsResponse.status} ${accountsResponse.statusText}`);
        if (accountsResponse.ok) {
            const data = await accountsResponse.json();
            console.log('✅ Successfully connected to accounts endpoint');
            console.log(`Found ${data.data?.length || 0} accounts`);
        } else {
            console.log('❌ Failed to connect to accounts endpoint');
            console.log(await accountsResponse.text());
        }

    } catch (error) {
        console.error('❌ API Connection Error:', error.message);
    }
}

async function testDiscordWebhook() {
    console.log('\n🔍 Testing Discord Webhook');
    console.log('=========================');
    
    try {
        const testMessage = {
            content: null,
            embeds: [{
                title: "🧪 Farm Manager Test Message",
                description: "This is a test message from Farm Manager configuration test.",
                color: 3447003,
                timestamp: new Date().toISOString()
            }]
        };

        const response = await fetch(config.DISCORD_WEBHOOK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testMessage)
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        if (response.status === 204) {
            console.log('✅ Successfully sent Discord test message');
        } else {
            console.log('❌ Failed to send Discord message');
            console.log(await response.text());
        }

    } catch (error) {
        console.error('❌ Discord Webhook Error:', error.message);
    }
}

// Run tests
console.log('🚀 Starting Farm Manager Configuration Test');
console.log('=========================================\n');

Promise.all([
    testAPIConnection(),
    testDiscordWebhook()
]).then(() => {
    console.log('\n✨ Configuration test complete!');
}); 