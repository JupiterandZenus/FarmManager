const http = require('http');

console.log('🔍 Discord Endpoint Checker');
console.log('============================\n');

// Test Discord endpoint on different ports
async function testDiscordEndpoint(port, name) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/api/discord/test',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 2000
        };

        const req = http.request(options, (res) => {
            console.log(`✅ ${name} (port ${port}): Discord endpoint found - Status ${res.statusCode}`);
            resolve(true);
        });

        req.on('error', () => {
            console.log(`❌ ${name} (port ${port}): No Discord endpoint or server not running`);
            resolve(false);
        });

        req.on('timeout', () => {
            console.log(`⏱️ ${name} (port ${port}): Timeout`);
            req.destroy();
            resolve(false);
        });

        // Send test data
        req.write(JSON.stringify({
            webhookUrl: 'https://discord.com/api/webhooks/test',
            message: 'Test message'
        }));
        
        req.end();
    });
}

async function checkServers() {
    console.log('🔍 Checking for Discord endpoints on common ports...\n');
    
    const servers = [
        [3007, 'Test Server (FarmBoy v0.2)'],
        [3000, 'Main Server'],
        [3001, 'Alternative Server'],
        [3002, 'Local Test Server'],
        [8080, 'Production Server'],
        [80, 'HTTP Server'],
        [443, 'HTTPS Server']
    ];
    
    let foundServers = [];
    
    for (const [port, name] of servers) {
        const hasDiscord = await testDiscordEndpoint(port, name);
        if (hasDiscord) {
            foundServers.push({ port, name });
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n📊 Results:');
    console.log('============');
    
    if (foundServers.length > 0) {
        console.log('✅ Servers with Discord endpoints:');
        foundServers.forEach(server => {
            console.log(`   🌐 ${server.name}: http://localhost:${server.port}`);
        });
        
        console.log('\n🎯 Recommended Actions:');
        console.log('1. Use our test server (port 3007) for testing:');
        console.log('   node test-simple-server.js');
        console.log('   Then open: http://localhost:3007');
        console.log('');
        console.log('2. Or use the server with working Discord endpoints above');
        
    } else {
        console.log('❌ No servers found with Discord endpoints');
        console.log('');
        console.log('🚀 Start the FarmBoy v0.2 test server:');
        console.log('   node test-simple-server.js');
        console.log('   Then open: http://localhost:3007');
    }
    
    console.log('\n💡 The Discord test should work on our test server!');
}

checkServers().catch(console.error); 