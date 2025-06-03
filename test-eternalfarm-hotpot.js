const fetch = require('node-fetch');

// Configuration from your environment
const API_URL = 'https://api.eternalfarm.net';
const API_KEY = 'RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5';
const AGENT_KEY = 'P52FE7-I2G19W-C2S4R8-BQZZFP-1FADWV-V3';

console.log('🔥 EternalFarm API Hotpot Testing 🔥');
console.log('=====================================');
console.log(`API URL: ${API_URL}`);
console.log(`Agent Key: ${AGENT_KEY}`);
console.log('');

// Function to make test requests
async function testEndpoint(method, path, headers = {}, data = null) {
    try {
        console.log(`\n🚀 Testing ${method.toUpperCase()} ${API_URL}${path}`);
        console.log('Headers:', JSON.stringify(headers, null, 2));
        
        const config = {
            method: method.toUpperCase(),
            headers: headers,
            timeout: 10000
        };
        
        if (data) {
            config.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${API_URL}${path}`, config);
        
        console.log(`✅ Status: ${response.status} ${response.statusText}`);
        
        // Log response headers
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });
        console.log('Response Headers:', JSON.stringify(responseHeaders, null, 2));
        
        // Try to get response body
        const contentType = response.headers.get('content-type');
        let responseData;
        
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }
        
        console.log('Response Data:', typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2));
        
        return response;
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return null;
    }
}

async function runTests() {
    console.log('Starting comprehensive API tests...\n');
    
    // Test 1: Root endpoint
    await testEndpoint('GET', '/');
    
    // Test 2: API info/version
    await testEndpoint('GET', '/api');
    await testEndpoint('GET', '/version');
    await testEndpoint('GET', '/info');
    
    // Test 3: Different agent endpoints
    await testEndpoint('GET', '/agents');
    await testEndpoint('GET', '/api/agents');
    await testEndpoint('GET', '/api/v1/agents');
    await testEndpoint('GET', '/v1/agents');
    
    // Test 4: With API key in header
    await testEndpoint('GET', '/agents', {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
    });
    
    // Test 5: With API key in different formats
    await testEndpoint('GET', '/agents', {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
    });
    
    await testEndpoint('GET', '/agents', {
        'apikey': API_KEY,
        'Content-Type': 'application/json'
    });
    
    // Test 6: With Agent key in header
    await testEndpoint('GET', '/agents', {
        'Authorization': `Bearer ${AGENT_KEY}`,
        'Content-Type': 'application/json'
    });
    
    await testEndpoint('GET', '/agents', {
        'X-Agent-Key': AGENT_KEY,
        'Content-Type': 'application/json'
    });
    
    // Test 7: POST requests
    await testEndpoint('POST', '/agents', {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
    });
    
    // Test 8: Try some common API patterns
    await testEndpoint('GET', '/farm/agents');
    await testEndpoint('GET', '/user/agents');
    await testEndpoint('GET', '/client/agents');
    
    // Test 9: Try with query parameters
    await testEndpoint('GET', `/agents?apikey=${API_KEY}`);
    await testEndpoint('GET', `/agents?agentkey=${AGENT_KEY}`);
    
    // Test 10: Health check endpoints
    await testEndpoint('GET', '/health');
    await testEndpoint('GET', '/status');
    await testEndpoint('GET', '/ping');
    
    console.log('\n🏁 Testing complete!');
}

runTests().catch(console.error); 