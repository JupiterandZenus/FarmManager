const fetch = require('node-fetch');

// Both API keys
const API_KEY = 'RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5';
const AGENT_KEY = 'P52FE7-I2G19W-C2S4R8-BQZZFP-1FADWV-V3';
const ETERNAL_API_URL = 'https://api.eternalfarm.net';

async function testEndpoint(key, keyName, endpoint) {
    try {
        const url = `${ETERNAL_API_URL}${endpoint}`;
        console.log(`\n🧪 Testing ${keyName} on ${endpoint}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            const count = data.data ? data.data.length : 'unknown';
            console.log(`   ✅ SUCCESS! Found ${count} items`);
            
            if (data.data && data.data.length > 0) {
                const keys = Object.keys(data.data[0]);
                console.log(`   📋 Sample fields: ${keys.slice(0, 5).join(', ')}...`);
            }
            return { success: true, count: count };
        } else {
            const errorText = await response.text();
            console.log(`   ❌ FAILED: ${errorText}`);
            return { success: false, error: response.status };
        }
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function comprehensiveTest() {
    console.log('🔍 Comprehensive EternalFarm API Key Test');
    console.log('==========================================');
    console.log(`🔑 API Key (Account): ${API_KEY.substring(0, 10)}...`);
    console.log(`🤖 Agent Key: ${AGENT_KEY.substring(0, 10)}...`);
    console.log(`🌐 Base URL: ${ETERNAL_API_URL}`);

    const endpoints = [
        '/v1/accounts',
        '/v1/agents',
        '/v1/instances',
        '/api/v1/accounts',
        '/api/v1/agents',
        '/accounts',
        '/agents'
    ];

    const results = {
        apiKey: {},
        agentKey: {}
    };

    console.log('\n🔑 Testing API Key (Account Access):');
    console.log('===================================');
    for (const endpoint of endpoints) {
        const result = await testEndpoint(API_KEY, 'API_KEY', endpoint);
        results.apiKey[endpoint] = result;
    }

    console.log('\n🤖 Testing Agent Key:');
    console.log('=====================');
    for (const endpoint of endpoints) {
        const result = await testEndpoint(AGENT_KEY, 'AGENT_KEY', endpoint);
        results.agentKey[endpoint] = result;
    }

    console.log('\n📊 SUMMARY:');
    console.log('===========');
    
    console.log('\n✅ API Key (Account) - Working endpoints:');
    Object.entries(results.apiKey).forEach(([endpoint, result]) => {
        if (result.success) {
            console.log(`   ${endpoint} - ${result.count} items`);
        }
    });

    console.log('\n✅ Agent Key - Working endpoints:');
    const agentWorking = Object.entries(results.agentKey).filter(([_, result]) => result.success);
    if (agentWorking.length === 0) {
        console.log('   ❌ No working endpoints found for agent key');
    } else {
        agentWorking.forEach(([endpoint, result]) => {
            console.log(`   ${endpoint} - ${result.count} items`);
        });
    }

    console.log('\n🎯 RECOMMENDATION:');
    console.log('==================');
    
    const accountWorking = Object.entries(results.apiKey).some(([_, result]) => result.success);
    const agentKeyWorking = Object.entries(results.agentKey).some(([_, result]) => result.success);
    
    if (accountWorking && !agentKeyWorking) {
        console.log('✅ Use API_KEY for ALL operations (accounts AND agents)');
        console.log('📝 Your config should be:');
        console.log(`   API_KEY=${API_KEY}`);
        console.log(`   ETERNALFARM_AGENT_KEY=${API_KEY}`);
    } else if (accountWorking && agentKeyWorking) {
        console.log('✅ Use different keys for different operations');
        console.log('📝 Your config should be:');
        console.log(`   API_KEY=${API_KEY} (for accounts)`);
        console.log(`   ETERNALFARM_AGENT_KEY=${AGENT_KEY} (for agents)`);
    } else {
        console.log('❌ Configuration issue detected');
    }

    return results;
}

// Run the comprehensive test
comprehensiveTest().catch(console.error); 