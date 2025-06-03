const fetch = require('node-fetch');

// Test with your exact configuration
const ETERNAL_API_URL = 'https://api.eternalfarm.net';
const API_KEY = 'RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5';

async function verifySuccessfulEndpoint() {
    console.log('🔍 Re-testing the endpoints that worked in our hotpot test');
    console.log('========================================================');
    
    const authHeaders = {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    
    // Test the endpoints from our successful hotpot test
    const endpoints = [
        '/api/v1/accounts',
        '/api/v1/accounts?page=1&per_page=10',
        '/api/v1/agents',
        '/api/v1/agents?page=1&per_page=10'
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
                    
                    // Check if this looks like agents data
                    if (data.data.length > 0) {
                        const firstItem = data.data[0];
                        console.log(`   First item keys: ${Object.keys(firstItem).join(', ')}`);
                        
                        // Check if it has agent-like properties
                        if (firstItem.name && firstItem.status && firstItem.last_seen_at) {
                            console.log(`   🤖 This looks like AGENTS data!`);
                        } else if (firstItem.username && firstItem.display_name) {
                            console.log(`   👤 This looks like ACCOUNTS data!`);
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
verifySuccessfulEndpoint().catch(console.error); 