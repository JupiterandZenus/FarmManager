const fetch = require('node-fetch');

// Test with your exact configuration
const ETERNAL_API_URL = 'https://api.eternalfarm.net';
const ETERNALFARM_AGENT_KEY = 'RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5';

async function testFixedEndpoint() {
    console.log('🧪 Testing Fixed EternalFarm Agent Endpoint');
    console.log('==========================================');
    
    try {
        console.log(`🕵️ DEBUG: ETERNAL_API_URL value: "${ETERNAL_API_URL}"`);
        const url = `${ETERNAL_API_URL}/api/v1/agents`;
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
        console.log(`✅ Success! Fetched ${data.data ? data.data.length : 0} agents from EternalFarm API`);
        
        if (data.data && data.data.length > 0) {
            console.log('\n📋 Agent Details:');
            data.data.forEach((agent, index) => {
                console.log(`${index + 1}. ${agent.name} - Status: ${agent.status || 'Unknown'}`);
                if (agent.last_seen_at) {
                    console.log(`   Last Seen: ${agent.last_seen_at}`);
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
testFixedEndpoint()
    .then((agents) => {
        console.log(`\n🎉 Test complete! Found ${agents.length} agents.`);
        if (agents.length > 0) {
            console.log('✅ Your server.js should now work correctly with EternalFarm API!');
        } else {
            console.log('⚠️ No agents found - check your account on EternalFarm.');
        }
    })
    .catch(console.error); 