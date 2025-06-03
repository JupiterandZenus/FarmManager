const fetch = require('node-fetch');

// Test with your exact configuration
const ETERNAL_API_URL = 'https://api.eternalfarm.net';
const API_KEY = 'RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5';

async function basicApiCheck() {
    console.log('🔍 Basic EternalFarm API Connectivity Check');
    console.log('==========================================');
    
    // Test 1: Root endpoint (this worked in our earlier hotpot test)
    try {
        console.log('\n1. Testing root endpoint...');
        const response = await fetch(`${ETERNAL_API_URL}/`, {
            method: 'GET',
            headers: {},
            timeout: 10000
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ Root endpoint working: ${JSON.stringify(data)}`);
        } else {
            console.log(`   ❌ Root endpoint failed`);
        }
        
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
    }
    
    // Test 2: Authenticated API endpoint (like our earlier hotpot test)
    try {
        console.log('\n2. Testing authenticated API endpoint...');
        const response = await fetch(`${ETERNAL_API_URL}/api`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ API endpoint working: ${JSON.stringify(data)}`);
        } else {
            const errorData = await response.text();
            console.log(`   ❌ API endpoint error: ${errorData}`);
        }
        
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
    }
    
    // Test 3: Check if API structure changed
    console.log('\n3. Checking possible API structure changes...');
    const testEndpoints = [
        '/v1/accounts',
        '/accounts',
        '/v1/agents', 
        '/agents',
        '/api/accounts',
        '/api/agents'
    ];
    
    for (const endpoint of testEndpoints) {
        try {
            const response = await fetch(`${ETERNAL_API_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Accept': 'application/json'
                },
                timeout: 5000
            });
            
            if (response.ok) {
                console.log(`   ✅ FOUND WORKING ENDPOINT: ${endpoint}`);
                const data = await response.json();
                console.log(`      Response preview: ${JSON.stringify(data).substring(0, 100)}...`);
                break;
            } else if (response.status !== 404) {
                console.log(`   🤔 ${endpoint}: ${response.status} ${response.statusText}`);
            }
            
        } catch (error) {
            // Ignore timeout/network errors for this scan
        }
    }
}

// Run the test
basicApiCheck().catch(console.error); 