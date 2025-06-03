const fetch = require('node-fetch');

// Test with your exact configuration
const ETERNAL_API_URL = 'https://api.eternalfarm.net';
const ETERNALFARM_AGENT_KEY = 'RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5';

async function testAgentsWithPagination() {
    console.log('🧪 Testing EternalFarm Agents Endpoint with Pagination');
    console.log('====================================================');
    
    // Test different variations based on Java client
    const endpoints = [
        '/api/v1/agents',
        '/api/v1/agents?page=1&per_page=10',
        '/api/v1/agents?page=1&per_page=100',
        '/agents?page=1&per_page=10'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const url = `${ETERNAL_API_URL}${endpoint}`;
            console.log(`\n🔍 Testing: ${url}`);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${ETERNALFARM_AGENT_KEY}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            console.log(`Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Success! Response:`, JSON.stringify(data, null, 2));
                return data;
            } else {
                const errorText = await response.text();
                console.log(`❌ Error response: ${errorText}`);
            }
            
        } catch (error) {
            console.error(`❌ Network error: ${error.message}`);
        }
    }
    
    return null;
}

// Run the test
testAgentsWithPagination()
    .then((result) => {
        if (result) {
            console.log('\n🎉 Found working endpoint!');
        } else {
            console.log('\n😞 No working agent endpoints found.');
        }
    })
    .catch(console.error); 