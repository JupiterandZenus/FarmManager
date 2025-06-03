const fetch = require('node-fetch');

// Configuration from your environment
const API_URL = 'https://api.eternalfarm.net';
const API_KEY = 'RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5';

console.log('🌥️ Testing EternalFarm Cloud API with Correct Endpoints 🌥️');
console.log('=========================================================');
console.log(`API URL: ${API_URL}`);
console.log('');

// Function to make test requests
async function testEndpoint(method, path, headers = {}) {
    try {
        console.log(`\n🚀 Testing ${method.toUpperCase()} ${API_URL}${path}`);
        
        const response = await fetch(`${API_URL}${path}`, {
            method: method.toUpperCase(),
            headers: headers,
            timeout: 10000
        });
        
        console.log(`✅ Status: ${response.status} ${response.statusText}`);
        
        // Try to get response body
        const contentType = response.headers.get('content-type');
        let responseData;
        
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }
        
        console.log('Response:', typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2));
        
        return response;
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return null;
    }
}

async function runTests() {
    console.log('Testing API v1 endpoints based on Java client...\n');
    
    const authHeaders = {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    
    // Test the endpoints we found in EFClient.java
    await testEndpoint('GET', '/api/v1/agents', authHeaders);
    await testEndpoint('GET', '/api/v1/agents?page=1&per_page=10', authHeaders);
    await testEndpoint('GET', '/api/v1/accounts', authHeaders);
    await testEndpoint('GET', '/api/v1/accounts?page=1&per_page=10', authHeaders);
    
    // Test some other possible endpoints
    await testEndpoint('GET', '/v1/agents', authHeaders);
    await testEndpoint('GET', '/v1/accounts', authHeaders);
    
    console.log('\n🏁 Testing complete!');
}

runTests().catch(console.error); 