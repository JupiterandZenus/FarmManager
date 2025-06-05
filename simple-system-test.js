const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

console.log('🎯 FarmBoy v0.2 - System Test');
console.log('==============================\n');

// Check if files exist
function checkFiles() {
    console.log('📋 Checking required files...');
    const requiredFiles = [
        'test-simple-server.js',
        'index.html',
        'app.js',
        'style.css'
    ];
    
    let allFound = true;
    requiredFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file}`);
        } else {
            console.log(`❌ ${file} - NOT FOUND`);
            allFound = false;
        }
    });
    
    return allFound;
}

// Test HTTP endpoint
function testEndpoint(path, name) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3007,
            path: path,
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const success = res.statusCode === 200;
                console.log(`${success ? '✅' : '❌'} ${name} - ${res.statusCode} ${success ? 'SUCCESS' : 'FAILED'}`);
                resolve(success);
            });
        });

        req.on('error', () => {
            console.log(`❌ ${name} - CONNECTION FAILED`);
            resolve(false);
        });

        req.on('timeout', () => {
            console.log(`❌ ${name} - TIMEOUT`);
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

// Start server and test
async function runTest() {
    // Step 1: Check files
    console.log('Step 1: File Check');
    console.log('==================');
    if (!checkFiles()) {
        console.log('\n❌ Missing required files. Test cannot continue.');
        return;
    }
    
    console.log('\n✅ All required files found.\n');
    
    // Step 2: Start server
    console.log('Step 2: Starting Server');
    console.log('=======================');
    console.log('🚀 Starting test-simple-server.js...');
    
    const server = spawn('node', ['test-simple-server.js'], {
        stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // Wait for server to start
    console.log('⏳ Waiting 3 seconds for server startup...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Test endpoints
    console.log('\nStep 3: Testing Critical API Endpoints');
    console.log('======================================');
    
    const endpoints = [
        ['/health', 'Health Check'],
        ['/', 'Main Interface'],
        ['/api/v1/tasks', 'Tasks API (Main Fix)'],
        ['/api/v1/agents', 'Agents API'],
        ['/api/v1/accounts', 'Accounts API'],
        ['/api/v1/bots', 'Bots API'],
        ['/api/v1/proxies', 'Proxies API'],
        ['/api/config', 'Configuration API'],
        ['/api/discord/messages', 'Discord Messages']
    ];
    
    let passed = 0;
    for (const [path, name] of endpoints) {
        const success = await testEndpoint(path, name);
        if (success) passed++;
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Results
    console.log('\n🎯 Test Results Summary');
    console.log('=======================');
    console.log(`✅ Passed: ${passed}/${endpoints.length}`);
    console.log(`❌ Failed: ${endpoints.length - passed}/${endpoints.length}`);
    console.log(`📈 Success Rate: ${Math.round((passed / endpoints.length) * 100)}%`);
    
    if (passed === endpoints.length) {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('===================');
        console.log('✅ FarmBoy v0.2 is fully operational');
        console.log('✅ Tasks API issue is RESOLVED');
        console.log('✅ All critical endpoints working');
        console.log('\n🌐 Ready for testing: http://localhost:3007');
        console.log('📋 Manual testing steps:');
        console.log('   1. Open http://localhost:3007 in browser');
        console.log('   2. Navigate between all tabs');
        console.log('   3. Test Discord quick actions');
        console.log('   4. Verify no 404 errors');
    } else {
        console.log('\n⚠️  Some tests failed');
        console.log('====================');
        console.log('The server may not be fully ready or there are missing endpoints.');
    }
    
    console.log('\n📝 Server Status: Running in background');
    console.log('🛑 Press Ctrl+C to stop this test (server will continue running)');
    console.log('💡 Or manually kill Node processes to stop the server');
    
    // Keep the test running
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Test stopped. Server may still be running.');
        console.log('🔧 Use Task Manager or kill Node processes to stop server.');
        process.exit(0);
    });
    
    // Keep alive
    setInterval(() => {
        process.stdout.write('.');
    }, 5000);
}

runTest().catch(console.error); 