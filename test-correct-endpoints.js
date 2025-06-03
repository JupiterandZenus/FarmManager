const fetch = require('node-fetch');

// Test with your exact configuration  
const ETERNAL_API_URL = 'https://api.eternalfarm.net';
const API_KEY = 'RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5';

async function testCorrectEndpoints() {
    console.log('🎯 Testing Corrected EternalFarm API Endpoints');
    console.log('===============================================');
    
    const authHeaders = {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    
    // Test the correct endpoints (without /api prefix)
    const endpoints = [
        '/v1/accounts',
        '/v1/agents',
        '/v1/accounts?page=1&per_page=5',
        '/v1/agents?page=1&per_page=10'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const url = `${ETERNAL_API_URL}${endpoint}`;
            console.log(`\n🚀 Testing: ${url}`);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: authHeaders,
                timeout: 10000
            });
            
            console.log(`Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ SUCCESS!`);
                
                if (data.data && Array.isArray(data.data)) {
                    console.log(`   Found ${data.data.length} items`);
                    
                    if (data.data.length > 0) {
                        const firstItem = data.data[0];
                        const keys = Object.keys(firstItem);
                        console.log(`   Sample keys: ${keys.slice(0, 5).join(', ')}...`);
                        
                        // Check if it's agents or accounts
                        if (keys.includes('name') && keys.includes('status') && keys.includes('last_seen_at')) {
                            console.log(`   🤖 This is AGENTS data!`);
                            console.log(`      Agent: ${firstItem.name} (${firstItem.status})`);
                        } else if (keys.includes('username') && keys.includes('display_name')) {
                            console.log(`   👤 This is ACCOUNTS data!`);
                            console.log(`      Account: ${firstItem.username} - ${firstItem.display_name}`);
                        }
                    }
                } else {
                    console.log(`   Response: ${JSON.stringify(data).substring(0, 200)}...`);
                }
                
            } else {
                const errorText = await response.text();
                console.log(`❌ Error: ${errorText}`);
            }
            
        } catch (error) {
            console.error(`❌ Network error: ${error.message}`);
        }
    }
}

// Run the test
testCorrectEndpoints().catch(console.error); 