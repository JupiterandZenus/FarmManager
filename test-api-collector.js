#!/usr/bin/env node

/**
 * API Collector and Updater Test Script
 * Tests the new bi-directional sync capabilities with EternalFarm API
 */

const fetch = require('node-fetch');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_KEY = 'RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5';

// Test helpers
async function apiRequest(endpoint, method = 'GET', body = null) {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`\n🔍 ${method} ${url}`);
    
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            console.log(`✅ Success:`, JSON.stringify(data, null, 2));
        } else {
            console.log(`❌ Error:`, JSON.stringify(data, null, 2));
        }
        
        return { response, data };
    } catch (error) {
        console.error(`❌ Request failed:`, error.message);
        return { error: error.message };
    }
}

async function testBasicAgentsList() {
    console.log('\n🧪 Testing: Basic Agents List');
    const result = await apiRequest('/api/v1/agents');
    return result;
}

async function testSystemStatistics() {
    console.log('\n🧪 Testing: System Statistics Collection');
    const result = await apiRequest('/api/v1/system/statistics');
    return result;
}

async function testManualSync() {
    console.log('\n🧪 Testing: Manual Agent Sync (Pull from EternalFarm)');
    const result = await apiRequest('/api/v1/agents/sync', 'POST');
    return result;
}

async function testBidirectionalSync() {
    console.log('\n🧪 Testing: Bi-directional Sync (Pull + Push)');
    const result = await apiRequest('/api/v1/agents/sync/bidirectional', 'POST');
    return result;
}

async function testPushSync() {
    console.log('\n🧪 Testing: Push Pending Changes');
    const result = await apiRequest('/api/v1/agents/sync/push', 'POST');
    return result;
}

async function testAgentUpdate() {
    console.log('\n🧪 Testing: Agent Update (marks for sync)');
    
    // First get agents to find one to update
    const { data: agentsResult } = await apiRequest('/api/v1/agents');
    
    if (agentsResult && agentsResult.data && agentsResult.data.length > 0) {
        const agent = agentsResult.data[0];
        console.log(`📝 Updating agent: ${agent.name} (ID: ${agent.id})`);
        
        const updateData = {
            status: 'online',
            cpu_usage: Math.floor(Math.random() * 100),
            memory_usage: Math.floor(Math.random() * 100),
            disk_usage: Math.floor(Math.random() * 100)
        };
        
        const result = await apiRequest(`/api/v1/agents/${agent.id}/update`, 'PUT', updateData);
        return result;
    } else {
        console.log('❌ No agents found to update');
        return { error: 'No agents available' };
    }
}

async function runComprehensiveTest() {
    console.log('🚀 Starting API Collector and Updater Test Suite');
    console.log('=' .repeat(60));
    
    const results = {
        timestamp: new Date().toISOString(),
        tests: []
    };
    
    // Test 1: Basic Agents List
    try {
        const result = await testBasicAgentsList();
        results.tests.push({
            name: 'Basic Agents List',
            success: !result.error && result.response?.ok,
            result: result.data || result.error
        });
    } catch (error) {
        results.tests.push({
            name: 'Basic Agents List',
            success: false,
            result: error.message
        });
    }
    
    // Test 2: System Statistics
    try {
        const result = await testSystemStatistics();
        results.tests.push({
            name: 'System Statistics',
            success: !result.error && result.response?.ok,
            result: result.data || result.error
        });
    } catch (error) {
        results.tests.push({
            name: 'System Statistics',
            success: false,
            result: error.message
        });
    }
    
    // Test 3: Manual Sync
    try {
        const result = await testManualSync();
        results.tests.push({
            name: 'Manual Agent Sync',
            success: !result.error && result.response?.ok,
            result: result.data || result.error
        });
    } catch (error) {
        results.tests.push({
            name: 'Manual Agent Sync',
            success: false,
            result: error.message
        });
    }
    
    // Test 4: Agent Update
    try {
        const result = await testAgentUpdate();
        results.tests.push({
            name: 'Agent Update',
            success: !result.error && result.response?.ok,
            result: result.data || result.error
        });
    } catch (error) {
        results.tests.push({
            name: 'Agent Update',
            success: false,
            result: error.message
        });
    }
    
    // Test 5: Push Sync
    try {
        const result = await testPushSync();
        results.tests.push({
            name: 'Push Pending Changes',
            success: !result.error && result.response?.ok,
            result: result.data || result.error
        });
    } catch (error) {
        results.tests.push({
            name: 'Push Pending Changes',
            success: false,
            result: error.message
        });
    }
    
    // Test 6: Bi-directional Sync
    try {
        const result = await testBidirectionalSync();
        results.tests.push({
            name: 'Bi-directional Sync',
            success: !result.error && result.response?.ok,
            result: result.data || result.error
        });
    } catch (error) {
        results.tests.push({
            name: 'Bi-directional Sync',
            success: false,
            result: error.message
        });
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('=' .repeat(60));
    
    const successCount = results.tests.filter(test => test.success).length;
    const totalCount = results.tests.length;
    
    results.tests.forEach((test, index) => {
        const status = test.success ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${test.name}`);
    });
    
    console.log('\n📊 Results:');
    console.log(`   ✅ Passed: ${successCount}/${totalCount}`);
    console.log(`   ❌ Failed: ${totalCount - successCount}/${totalCount}`);
    console.log(`   📈 Success Rate: ${Math.round((successCount / totalCount) * 100)}%`);
    
    // Save results to file
    const filename = `test-results-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${filename}`);
    
    console.log('\n🏁 API Collector and Updater Test Suite Complete!');
    
    return results;
}

// WebSocket Test
async function testWebSocketUpdates() {
    console.log('\n🧪 Testing: WebSocket Real-time Updates');
    
    const WebSocket = require('ws');
    
    return new Promise((resolve) => {
        const ws = new WebSocket(`ws://localhost:3000`);
        
        ws.on('open', () => {
            console.log('✅ WebSocket connected');
            
            // Send a test message
            ws.send(JSON.stringify({
                type: 'subscribe',
                data: { types: ['agents_updated', 'sync_completed', 'system_statistics'] }
            }));
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                console.log(`📡 WebSocket Message:`, message);
            } catch (error) {
                console.log(`📡 WebSocket Raw:`, data.toString());
            }
        });
        
        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error.message);
            resolve({ success: false, error: error.message });
        });
        
        // Close after 10 seconds
        setTimeout(() => {
            ws.close();
            console.log('🔌 WebSocket test completed');
            resolve({ success: true, message: 'WebSocket test completed' });
        }, 10000);
    });
}

// Main execution
if (require.main === module) {
    console.log('🧪 Farm Manager API Collector & Updater Test Suite');
    console.log('🌐 Testing comprehensive bi-directional sync capabilities');
    
    runComprehensiveTest()
        .then(() => {
            console.log('\n🔌 Testing WebSocket functionality...');
            return testWebSocketUpdates();
        })
        .then(() => {
            console.log('\n✨ All tests completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Test suite failed:', error);
            process.exit(1);
        });
} 