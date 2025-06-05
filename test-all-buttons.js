#!/usr/bin/env node
/**
 * FarmBoy v0.2 - Comprehensive Button Functionality Test
 * Tests ALL buttons and interactions to ensure they work properly
 */

const https = require('https');
const http = require('http');

const SERVER_URL = 'http://localhost:3007';

// Test results tracking
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

// Utility function to make HTTP requests
function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, SERVER_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FarmBoy-Test/2.0'
            }
        };

        if (data && method !== 'GET') {
            const postData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try {
                    const parsed = responseData ? JSON.parse(responseData) : {};
                    resolve({ status: res.statusCode, data: parsed, raw: responseData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: null, raw: responseData });
                }
            });
        });

        req.on('error', (error) => reject(error));

        if (data && method !== 'GET') {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Test logging
function logTest(name, success, details = '') {
    testResults.total++;
    const status = success ? '✅' : '❌';
    const result = success ? 'PASS' : 'FAIL';
    
    if (success) {
        testResults.passed++;
    } else {
        testResults.failed++;
    }
    
    console.log(`${status} ${name.padEnd(35)} ${result} ${details}`);
    testResults.details.push({ name, success, details });
}

// Test sections
async function testHealthCheck() {
    console.log('\n🔍 HEALTH & BASIC CONNECTIVITY');
    console.log('================================');
    
    try {
        const response = await makeRequest('/health');
        logTest('Server Health Check', response.status === 200, `Status: ${response.status}`);
        
        const indexResponse = await makeRequest('/');
        logTest('Main Page Load', indexResponse.status === 200 && indexResponse.raw.includes('FarmBoy'), 
               `Status: ${indexResponse.status}`);
    } catch (error) {
        logTest('Server Health Check', false, `Error: ${error.message}`);
    }
}

async function testDiscordButtons() {
    console.log('\n🔗 DISCORD BUTTON FUNCTIONALITY');
    console.log('=================================');
    
    // Test webhook configuration
    try {
        const testData = {
            webhookUrl: 'https://discord.com/api/webhooks/1379651760661991475/lcgRwEj3Y0Hl4bW7DLjm7lfvQ3VnMJzGbstNVYWoDa--xUmzsSCl-NMlNAkC3fJTCqBE',
            message: 'Test message from button validation',
            color: 0x00ff00,
            title: 'Button Test',
            username: 'Farm Manager'
        };
        
        const testResponse = await makeRequest('/api/discord/test', 'POST', testData);
        logTest('Discord Webhook Test Button', testResponse.data?.success === true, 
               `Status: ${testResponse.status}`);
    } catch (error) {
        logTest('Discord Webhook Test Button', false, `Error: ${error.message}`);
    }
    
    // Test custom message sending
    try {
        const messageData = {
            webhookUrl: 'https://discord.com/api/webhooks/1379651760661991475/lcgRwEj3Y0Hl4bW7DLjm7lfvQ3VnMJzGbstNVYWoDa--xUmzsSCl-NMlNAkC3fJTCqBE',
            message: 'Custom message test from validation',
            color: 0x0099ff,
            title: 'Custom Message Test',
            username: 'Farm Manager'
        };
        
        const sendResponse = await makeRequest('/api/discord/send', 'POST', messageData);
        logTest('Discord Send Custom Message', sendResponse.data?.success === true, 
               `Status: ${sendResponse.status}`);
    } catch (error) {
        logTest('Discord Send Custom Message', false, `Error: ${error.message}`);
    }
    
    // Test quick actions
    const quickActions = [
        'Send Status Update',
        'Send System Stats', 
        'Send Agent Summary',
        'Screenshot + Stats',
        'Send Task Update',
        'Send Alert'
    ];
    
    for (const action of quickActions) {
        try {
            const actionResponse = await makeRequest('/api/discord/quick-action', 'POST', { action });
            logTest(`Quick Action: ${action}`, actionResponse.data?.success === true,
                   `Status: ${actionResponse.status}`);
        } catch (error) {
            logTest(`Quick Action: ${action}`, false, `Error: ${error.message}`);
        }
    }
    
    // Test screenshot functionality
    const screenshotTypes = ['desktop', 'full', 'vnc', 'web'];
    for (const type of screenshotTypes) {
        try {
            const screenshotResponse = await makeRequest('/api/discord/screenshot', 'POST', { type });
            logTest(`Screenshot Button (${type})`, screenshotResponse.data?.success === true,
                   `Status: ${screenshotResponse.status}`);
        } catch (error) {
            logTest(`Screenshot Button (${type})`, false, `Error: ${error.message}`);
        }
    }
    
    // Test message log retrieval
    try {
        const messagesResponse = await makeRequest('/api/discord/messages');
        logTest('Discord Messages Log', Array.isArray(messagesResponse.data), 
               `Count: ${messagesResponse.data?.length || 0}`);
    } catch (error) {
        logTest('Discord Messages Log', false, `Error: ${error.message}`);
    }
}

async function testProxyButtons() {
    console.log('\n🔍 PROXY CHECKER BUTTONS');
    console.log('==========================');
    
    // Test single proxy check
    try {
        const proxyData = {
            proxy: {
                host: '127.0.0.1',
                port: 8080,
                type: 'http'
            }
        };
        
        const proxyResponse = await makeRequest('/api/proxy-checker/test', 'POST', proxyData);
        logTest('Single Proxy Test Button', proxyResponse.data?.success === true,
               `Status: ${proxyResponse.status}`);
    } catch (error) {
        logTest('Single Proxy Test Button', false, `Error: ${error.message}`);
    }
    
    // Test batch proxy check
    try {
        const batchResponse = await makeRequest('/api/proxy-checker/test-all', 'POST', {});
        logTest('Batch Proxy Test Button', batchResponse.data?.success === true,
               `Status: ${batchResponse.status}`);
    } catch (error) {
        logTest('Batch Proxy Test Button', false, `Error: ${error.message}`);
    }
    
    // Test proxy statistics
    try {
        const statsResponse = await makeRequest('/api/proxy-checker/stats');
        logTest('Proxy Statistics Button', statsResponse.data?.success === true,
               `Status: ${statsResponse.status}`);
    } catch (error) {
        logTest('Proxy Statistics Button', false, `Error: ${error.message}`);
    }
}

async function testTaskManagementButtons() {
    console.log('\n📋 TASK MANAGEMENT BUTTONS');
    console.log('============================');
    
    // Test task creation
    try {
        const taskData = {
            name: 'Test Button Task',
            script: 'test_script.bot',
            agent_id: 1
        };
        
        const createResponse = await makeRequest('/api/v1/tasks', 'POST', taskData);
        logTest('Create Task Button', createResponse.data?.success === true,
               `Status: ${createResponse.status}`);
    } catch (error) {
        logTest('Create Task Button', false, `Error: ${error.message}`);
    }
    
    // Test task start/stop
    const taskId = '12345';
    try {
        const startResponse = await makeRequest(`/api/v1/tasks/${taskId}/start`, 'POST', {});
        logTest('Start Task Button', startResponse.data?.success === true,
               `Status: ${startResponse.status}`);
    } catch (error) {
        logTest('Start Task Button', false, `Error: ${error.message}`);
    }
    
    try {
        const stopResponse = await makeRequest(`/api/v1/tasks/${taskId}/stop`, 'POST', {});
        logTest('Stop Task Button', stopResponse.data?.success === true,
               `Status: ${stopResponse.status}`);
    } catch (error) {
        logTest('Stop Task Button', false, `Error: ${error.message}`);
    }
    
    // Test agent sync
    try {
        const syncResponse = await makeRequest('/api/v1/agents/sync', 'POST', {});
        logTest('Sync Agents Button', syncResponse.data?.success === true,
               `Status: ${syncResponse.status}`);
    } catch (error) {
        logTest('Sync Agents Button', false, `Error: ${error.message}`);
    }
}

async function testConfigurationButtons() {
    console.log('\n⚙️ CONFIGURATION BUTTONS');
    console.log('==========================');
    
    // Test API key validation
    try {
        const configData = {
            service: 'EternalFarm',
            apiKey: 'test_key_12345',
            apiUrl: 'https://api.eternalfarm.net'
        };
        
        const testResponse = await makeRequest('/api/test-connection', 'POST', configData);
        logTest('Test API Key Button', testResponse.status === 200 || testResponse.status === 401,
               `Status: ${testResponse.status}`);
    } catch (error) {
        logTest('Test API Key Button', false, `Error: ${error.message}`);
    }
    
    // Test Discord configuration
    try {
        const discordData = {
            service: 'Discord',
            apiKey: 'discord_webhook_test',
            apiUrl: 'https://discord.com/api/webhooks/test'
        };
        
        const discordTestResponse = await makeRequest('/api/test-connection', 'POST', discordData);
        logTest('Test Discord Config Button', discordTestResponse.status === 200 || discordTestResponse.status === 401,
               `Status: ${discordTestResponse.status}`);
    } catch (error) {
        logTest('Test Discord Config Button', false, `Error: ${error.message}`);
    }
}

async function testDataRetrieval() {
    console.log('\n📊 DATA RETRIEVAL BUTTONS');
    console.log('===========================');
    
    const endpoints = [
        { path: '/api/v1/tasks', name: 'Load Tasks Button' },
        { path: '/api/v1/agents', name: 'Load Agents Button' },
        { path: '/api/v1/accounts', name: 'Load Accounts Button' },
        { path: '/api/v1/proxies', name: 'Load Proxies Button' },
        { path: '/api/v1/bots', name: 'Load Bots Button' },
        { path: '/api/config', name: 'Load Config Button' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await makeRequest(endpoint.path);
            logTest(endpoint.name, response.status === 200 && response.data?.success !== false,
                   `Status: ${response.status}, Items: ${response.data?.data?.length || 'N/A'}`);
        } catch (error) {
            logTest(endpoint.name, false, `Error: ${error.message}`);
        }
    }
}

// Main test execution
async function runAllTests() {
    console.log('🎯 FarmBoy v0.2 - Comprehensive Button Functionality Test');
    console.log('===========================================================');
    console.log(`🌐 Testing server: ${SERVER_URL}`);
    console.log('⏰ Starting test suite...\n');
    
    await testHealthCheck();
    await testDiscordButtons();
    await testProxyButtons();
    await testTaskManagementButtons();
    await testConfigurationButtons();
    await testDataRetrieval();
    
    // Print summary
    console.log('\n🎯 COMPREHENSIVE TEST SUMMARY');
    console.log('===============================');
    console.log(`📊 Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
    
    if (testResults.failed === 0) {
        console.log('\n🎉 ALL BUTTON FUNCTIONALITY TESTS PASSED!');
        console.log('==========================================');
        console.log('✅ Every button in FarmBoy v0.2 is functional');
        console.log('✅ All API endpoints are responding correctly');
        console.log('✅ Discord integration is working perfectly');
        console.log('✅ Proxy checking functionality is operational');
        console.log('✅ Task management buttons are functional');
        console.log('✅ Configuration testing is working');
        console.log('\n🌐 The dashboard is ready for use!');
        console.log(`🔗 Access it at: ${SERVER_URL}`);
    } else {
        console.log('\n⚠️ SOME TESTS FAILED');
        console.log('=====================');
        console.log('❌ Please check the failed tests above');
        console.log('🔧 Fix any issues before using the dashboard');
    }
    
    console.log('\n📝 Test completed at:', new Date().toISOString());
}

// Execute tests
runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
}); 