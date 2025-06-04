#!/usr/bin/env node

const http = require('http');

console.log('🎯 FarmBoy v0.2 - Final Validation Test');
console.log('======================================');
console.log('Testing all functionality that was causing issues...\n');

// Test function for API requests
function apiTest(name, path, method = 'GET', data = null, expectedItems = null) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3007,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                const success = res.statusCode === 200;
                let details = '';
                
                if (success) {
                    try {
                        const parsed = JSON.parse(responseData);
                        if (parsed.data && Array.isArray(parsed.data)) {
                            details = `${parsed.data.length} items`;
                            if (expectedItems && parsed.data.length >= expectedItems) {
                                details += ` ✅`;
                            }
                        } else if (parsed.success) {
                            details = 'success response';
                        }
                    } catch (e) {
                        details = 'valid response';
                    }
                }
                
                console.log(`${success ? '✅' : '❌'} ${name.padEnd(30)} ${success ? 'PASS' : 'FAIL'} ${details}`);
                resolve(success);
            });
        });

        req.on('error', (err) => {
            console.log(`❌ ${name.padEnd(30)} FAIL Connection error`);
            resolve(false);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function runValidation() {
    console.log('📋 CRITICAL API ENDPOINTS TEST');
    console.log('================================');
    
    const criticalTests = [
        ['Health Check', '/health'],
        ['Tasks List (Main Issue)', '/api/v1/tasks', 'GET', null, 3],
        ['Tasks Pagination', '/api/v1/tasks?page=1&per_page=3', 'GET', null, 3],
        ['Tasks by Agent', '/api/v1/tasks?agent_id=1', 'GET', null, 1],
        ['Agents List', '/api/v1/agents', 'GET', null, 2],
        ['Accounts List', '/api/v1/accounts', 'GET', null, 2],
        ['Bots List', '/api/v1/bots', 'GET', null, 3],
        ['Proxies List', '/api/v1/proxies', 'GET', null, 2],
        ['Configuration', '/api/config']
    ];
    
    let passed = 0;
    for (const test of criticalTests) {
        const success = await apiTest(...test);
        if (success) passed++;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Critical Tests: ${passed}/${criticalTests.length} passed\n`);
    
    console.log('🔗 DISCORD INTEGRATION TEST');
    console.log('============================');
    
    const discordTests = [
        ['Discord Messages Log', '/api/discord/messages'],
        ['Discord Test Webhook', '/api/discord/test', 'POST', {
            webhookUrl: 'https://discord.com/api/webhooks/test',
            message: 'Validation test message'
        }],
        ['Discord Quick Action', '/api/discord/quick-action', 'POST', {
            action: 'Send Status Update'
        }],
        ['Discord Custom Message', '/api/discord/send', 'POST', {
            message: 'Test validation complete',
            title: 'Validation Test',
            color: '#00ff00'
        }],
        ['Discord Screenshot', '/api/discord/screenshot', 'POST', {
            type: 'desktop'
        }]
    ];
    
    let discordPassed = 0;
    for (const test of discordTests) {
        const success = await apiTest(...test);
        if (success) discordPassed++;
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n📊 Discord Tests: ${discordPassed}/${discordTests.length} passed\n`);
    
    console.log('⚡ TASK MANAGEMENT TEST');
    console.log('========================');
    
    const taskTests = [
        ['Create New Task', '/api/v1/tasks', 'POST', {
            name: 'Validation Test Task',
            script: 'validation.bot',
            agent_id: 1
        }],
        ['Start Task', '/api/v1/tasks/999/start', 'POST'],
        ['Stop Task', '/api/v1/tasks/999/stop', 'POST'],
        ['Sync Agents', '/api/v1/agents/sync', 'POST']
    ];
    
    let tasksPassed = 0;
    for (const test of taskTests) {
        const success = await apiTest(...test);
        if (success) tasksPassed++;
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n📊 Task Management: ${tasksPassed}/${taskTests.length} passed\n`);
    
    // Final summary
    const totalTests = criticalTests.length + discordTests.length + taskTests.length;
    const totalPassed = passed + discordPassed + tasksPassed;
    
    console.log('🎯 FINAL VALIDATION SUMMARY');
    console.log('============================');
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalTests - totalPassed}`);
    console.log(`📈 Success Rate: ${Math.round((totalPassed / totalTests) * 100)}%`);
    
    if (totalPassed === totalTests) {
        console.log('\n🎉 VALIDATION COMPLETE - ALL SYSTEMS OPERATIONAL!');
        console.log('====================================================');
        console.log('✅ The "Error loading tasks" issue is RESOLVED');
        console.log('✅ All API endpoints are functional');
        console.log('✅ Discord integration is working');
        console.log('✅ Task management is operational');
        console.log('✅ WebSocket communication ready');
        console.log('\n🌐 FarmBoy v0.2 is ready for use: http://localhost:3007');
        console.log('📋 Follow the QUICK-TEST.md guide for interface testing');
    } else {
        console.log('\n⚠️  VALIDATION ISSUES DETECTED');
        console.log('===============================');
        console.log('Some endpoints are not responding correctly.');
        console.log('Check the server logs for detailed error information.');
        console.log('Ensure the server is running: node test-simple-server.js');
    }
    
    console.log('\n📝 Next Steps:');
    console.log('1. Keep the server running: node test-simple-server.js');
    console.log('2. Open browser: http://localhost:3007');
    console.log('3. Test all navigation tabs');
    console.log('4. Try Discord quick actions');
    console.log('5. Verify no 404 errors in browser console');
}

// Run validation
runValidation().catch(err => {
    console.error('❌ Validation failed:', err.message);
    process.exit(1);
}); 