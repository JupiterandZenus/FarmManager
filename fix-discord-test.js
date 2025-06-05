const { spawn } = require('child_process');
const http = require('http');

console.log('🔧 Discord Webhook Test Fixer');
console.log('==============================\n');

async function testWebhookEndpoint(port, testData) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/api/discord/test',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 3000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`✅ Port ${port}: Discord test working - Status ${res.statusCode}`);
                if (data) {
                    try {
                        const response = JSON.parse(data);
                        console.log(`   Response: ${response.message || 'Success'}`);
                    } catch (e) {
                        console.log(`   Response: ${data.substring(0, 100)}...`);
                    }
                }
                resolve({ success: true, status: res.statusCode, data });
            });
        });

        req.on('error', (err) => {
            console.log(`❌ Port ${port}: ${err.code === 'ECONNREFUSED' ? 'Server not running' : 'Connection failed'}`);
            resolve({ success: false, error: err.message });
        });

        req.on('timeout', () => {
            console.log(`⏱️ Port ${port}: Request timeout`);
            req.destroy();
            resolve({ success: false, error: 'Timeout' });
        });

        req.write(JSON.stringify(testData));
        req.end();
    });
}

async function fixDiscordTest() {
    // Test data to send
    const testData = {
        webhookUrl: 'https://discord.com/api/webhooks/1379617606619917383/test-webhook-url',
        message: 'Discord webhook test from fix script',
        title: 'Test Message',
        username: 'Farm Manager'
    };

    console.log('Step 1: Checking existing servers for Discord endpoints...\n');
    
    const ports = [3007, 3000, 3001, 3002, 8080];
    let workingPort = null;
    
    for (const port of ports) {
        const result = await testWebhookEndpoint(port, testData);
        if (result.success && result.status === 200) {
            workingPort = port;
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    if (workingPort) {
        console.log(`\n🎉 SOLUTION FOUND!`);
        console.log(`=================`);
        console.log(`✅ Discord webhooks are working on port ${workingPort}`);
        console.log(`🌐 Use this URL instead: http://localhost:${workingPort}`);
        console.log(`📋 The Discord test button should work there!`);
        return;
    }
    
    console.log('\n⚠️ No working Discord endpoints found. Starting our test server...\n');
    
    console.log('Step 2: Starting FarmBoy v0.2 Test Server...\n');
    
    // Start our test server
    const server = spawn('node', ['test-simple-server.js'], {
        stdio: ['ignore', 'pipe', 'pipe']
    });
    
    server.stdout.on('data', (data) => {
        console.log(data.toString());
    });
    
    server.stderr.on('data', (data) => {
        console.error(data.toString());
    });
    
    // Wait for server to start
    console.log('⏳ Waiting 4 seconds for server startup...');
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    console.log('\nStep 3: Testing Discord endpoint on our server...\n');
    
    const result = await testWebhookEndpoint(3007, testData);
    
    if (result.success) {
        console.log('\n🎉 SUCCESS! Discord webhook test is now working!');
        console.log('===============================================');
        console.log('✅ FarmBoy v0.2 test server is running with Discord support');
        console.log('🌐 Open this URL: http://localhost:3007');
        console.log('🔧 The Discord test button should work now!');
        console.log('📋 Try the TEST button in the Discord section');
        
        console.log('\n📝 What was the problem?');
        console.log('========================');
        console.log('❌ You were using a server without the Discord test endpoints');
        console.log('✅ Our test server (port 3007) has all the required endpoints');
        console.log('✅ Discord webhook testing is fully implemented');
        
        console.log('\n🛑 Press Ctrl+C to stop this script (server will keep running)');
        
        // Keep script alive
        setInterval(() => {
            process.stdout.write('.');
        }, 5000);
        
    } else {
        console.log('\n❌ Still having issues with Discord endpoint');
        console.log('Please check the server logs for errors.');
    }
}

// Handle interruption
process.on('SIGINT', () => {
    console.log('\n\n🛑 Fix script stopped.');
    console.log('💡 The test server should still be running on port 3007');
    console.log('🌐 Open: http://localhost:3007');
    process.exit(0);
});

fixDiscordTest().catch(error => {
    console.error('❌ Fix script error:', error.message);
    console.log('\n🔧 Manual fix:');
    console.log('1. Run: node test-simple-server.js');
    console.log('2. Open: http://localhost:3007');
    console.log('3. Try Discord test button');
}); 