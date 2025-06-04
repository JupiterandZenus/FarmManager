const http = require('http');

console.log('🔍 Testing Tasks API Endpoint...\n');

function testEndpoint(path, expectedData) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3007,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📍 Testing: ${path}`);
                console.log(`📊 Status: ${res.statusCode}`);
                
                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        console.log(`✅ SUCCESS!`);
                        console.log(`📝 Data type: ${typeof response.data}`);
                        console.log(`📋 Items: ${Array.isArray(response.data) ? response.data.length : 'object'}`);
                        
                        if (Array.isArray(response.data) && response.data.length > 0) {
                            console.log(`🔍 First item: ${JSON.stringify(response.data[0], null, 2)}`);
                        }
                        
                        resolve(true);
                    } catch (e) {
                        console.log(`❌ JSON Parse Error: ${e.message}`);
                        console.log(`📝 Raw response: ${data.substring(0, 200)}...`);
                        resolve(false);
                    }
                } else {
                    console.log(`❌ FAILED with status ${res.statusCode}`);
                    console.log(`📝 Response: ${data}`);
                    resolve(false);
                }
                console.log(''); // Empty line for spacing
            });
        });

        req.on('error', (err) => {
            console.log(`❌ Request Error: ${err.message}`);
            console.log(`🔧 Make sure server is running on port 3007`);
            resolve(false);
        });

        req.end();
    });
}

async function runTests() {
    console.log('📋 Testing all critical endpoints that were missing...\n');
    
    const endpoints = [
        '/api/v1/tasks',
        '/api/v1/tasks?page=1&per_page=3',
        '/api/v1/tasks?agent_id=1',
        '/api/v1/agents',
        '/api/v1/accounts',
        '/api/v1/bots',
        '/api/v1/proxies',
        '/health'
    ];
    
    let passCount = 0;
    
    for (const endpoint of endpoints) {
        const success = await testEndpoint(endpoint);
        if (success) passCount++;
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('🎯 TEST SUMMARY');
    console.log('===============');
    console.log(`✅ Passed: ${passCount}/${endpoints.length}`);
    console.log(`❌ Failed: ${endpoints.length - passCount}/${endpoints.length}`);
    
    if (passCount === endpoints.length) {
        console.log('\n🎉 ALL ENDPOINTS WORKING!');
        console.log('🌐 FarmBoy v0.2 is ready: http://localhost:3007');
        console.log('📋 The "Error loading tasks" issue should be fixed!');
    } else {
        console.log('\n⚠️  Some endpoints are not working properly.');
    }
}

// Run the tests
runTests().catch(console.error); 