const fetch = require('node-fetch');

// Configuration matching your server.js
const ETERNAL_API_URL = 'https://api.eternalfarm.net';
const ETERNALFARM_AGENT_KEY = 'RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5';

async function testAgentSync() {
    console.log('🧪 Testing Agent Sync with Fixed Endpoint');
    console.log('=========================================');
    
    if (!ETERNALFARM_AGENT_KEY) {
        console.log('⚠️ EternalFarm agent key not configured');
        return [];
    }

    try {
        console.log(`🕵️ DEBUG: ETERNAL_API_URL value: "${ETERNAL_API_URL}"`);
        const url = `${ETERNAL_API_URL}/v1/agents`; // Fixed: Use /v1/agents for cloud API
        console.log(`🔍 Fetching agents from EternalFarm API: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ETERNALFARM_AGENT_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`EternalFarm API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Fetched ${data.data ? data.data.length : 0} agents from EternalFarm API`);
        
        if (data.data && data.data.length > 0) {
            console.log('\n📋 Agent Details:');
            data.data.forEach((agent, index) => {
                console.log(`${index + 1}. ${agent.name || 'Unnamed'} - Status: ${agent.status || 'Unknown'}`);
                if (agent.last_seen_at) {
                    console.log(`   Last Seen: ${agent.last_seen_at}`);
                }
                if (agent.ip_address) {
                    console.log(`   IP: ${agent.ip_address}`);
                }
            });
        }
        
        return data.data || [];
    } catch (error) {
        console.error('❌ Error fetching EternalFarm agents:', error.message);
        return [];
    }
}

// Run the test
testAgentSync()
    .then((agents) => {
        console.log(`\n🎉 Test complete! Found ${agents.length} agents.`);
        if (agents.length > 0) {
            console.log('✅ Your server.js should now successfully sync agents from EternalFarm!');
            console.log('🚀 You can now deploy/restart your Portainer stack to see the agents in your dashboard.');
        } else {
            console.log('⚠️ No agents found - check your EternalFarm account or agent setup.');
        }
    })
    .catch(console.error); 