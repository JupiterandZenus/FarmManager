const http = require('http');
const fs = require('fs');

console.log('🔍 FarmBoy v0.2 - Quick Status Check');
console.log('====================================\n');

// Check if server is already running
function checkServer() {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3007,
            path: '/health',
            method: 'GET',
            timeout: 2000
        }, (res) => {
            resolve(res.statusCode === 200);
        });
        
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
        
        req.end();
    });
}

// Test specific endpoint
function testQuick(path, name) {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3007,
            path: path,
            method: 'GET',
            timeout: 1000
        }, (res) => {
            console.log(`${res.statusCode === 200 ? '✅' : '❌'} ${name}`);
            resolve(res.statusCode === 200);
        });
        
        req.on('error', () => {
            console.log(`❌ ${name} - Not available`);
            resolve(false);
        });
        
        req.on('timeout', () => {
            console.log(`❌ ${name} - Timeout`);
            req.destroy();
            resolve(false);
        });
        
        req.end();
    });
}

async function quickCheck() {
    // Check files
    console.log('📁 File Status:');
    const files = ['test-simple-server.js', 'index.html', 'app.js', 'style.css'];
    files.forEach(file => {
        console.log(`${fs.existsSync(file) ? '✅' : '❌'} ${file}`);
    });
    
    console.log('\n🌐 Server Status:');
    const serverRunning = await checkServer();
    
    if (serverRunning) {
        console.log('✅ Server is running on port 3007\n');
        
        console.log('🔗 API Endpoints:');
        const endpoints = [
            ['/api/v1/tasks', 'Tasks API (MAIN FIX)'],
            ['/api/v1/agents', 'Agents API'],
            ['/api/v1/accounts', 'Accounts API'],
            ['/api/discord/messages', 'Discord API']
        ];
        
        let working = 0;
        for (const [path, name] of endpoints) {
            const success = await testQuick(path, name);
            if (success) working++;
        }
        
        console.log(`\n📊 Status: ${working}/${endpoints.length} endpoints working`);
        
        if (working === endpoints.length) {
            console.log('\n🎉 SYSTEM OPERATIONAL!');
            console.log('✅ Tasks API issue is RESOLVED');
            console.log('✅ Ready for browser testing: http://localhost:3007');
        } else {
            console.log('\n⚠️  Some endpoints not working properly');
        }
        
    } else {
        console.log('❌ Server is not running');
        console.log('\n🚀 To start the server, run:');
        console.log('   node test-simple-server.js');
        console.log('\n📋 Or use the batch file:');
        console.log('   start-farmboy-v2.bat');
    }
    
    console.log('\n📋 Quick Testing Guide:');
    console.log('1. Ensure server is running (should see ✅ above)');
    console.log('2. Open: http://localhost:3007');
    console.log('3. Test navigation between tabs');
    console.log('4. Try Discord quick actions');
    console.log('5. Check browser console for any 404 errors');
}

quickCheck().catch(console.error); 