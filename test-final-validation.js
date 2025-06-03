const fetch = require('node-fetch');

// Final configuration - using the working API key for everything
const API_KEY = 'RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5';
const ETERNALFARM_AGENT_KEY = 'RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5';
const ETERNAL_API_URL = 'https://api.eternalfarm.net';

async function testConfiguredSetup() {
    console.log('🔬 Final Configuration Validation Test');
    console.log('======================================');
    console.log(`🌐 EternalFarm API: ${ETERNAL_API_URL}`);
    console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
    console.log(`🤖 Agent Key: ${ETERNALFARM_AGENT_KEY.substring(0, 10)}...`);
    console.log(`✅ Keys Match: ${API_KEY === ETERNALFARM_AGENT_KEY ? 'Yes' : 'No'}`);
    
    const tests = [
        {
            name: 'Account Access (API_KEY)',
            key: API_KEY,
            endpoint: '/v1/accounts',
            description: 'Testing account data access for Farm Manager interface'
        },
        {
            name: 'Agent Access (API_KEY)', 
            key: API_KEY,
            endpoint: '/v1/agents',
            description: 'Testing agent data access for Farm Manager interface'
        },
        {
            name: 'Agent Sync (ETERNALFARM_AGENT_KEY)',
            key: ETERNALFARM_AGENT_KEY,
            endpoint: '/v1/agents', 
            description: 'Testing agent synchronization functionality'
        },
        {
            name: 'Instance Access',
            key: API_KEY,
            endpoint: '/v1/instances',
            description: 'Testing instance data access'
        }
    ];
    
    let allPassed = true;
    
    for (const test of tests) {
        try {
            console.log(`\n🧪 ${test.name}`);
            console.log(`   ${test.description}`);
            
            const response = await fetch(`${ETERNAL_API_URL}${test.endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${test.key}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const count = data.data ? data.data.length : 0;
                console.log(`   ✅ SUCCESS! Found ${count} items`);
                
                if (test.endpoint === '/v1/agents' && data.data && data.data.length > 0) {
                    console.log(`   🤖 Agents: ${data.data.map(a => a.name).join(', ')}`);
                }
                
                if (test.endpoint === '/v1/accounts' && data.data && data.data.length > 0) {
                    console.log(`   👤 Accounts: ${data.data.slice(0, 3).map(a => a.username || a.display_name).join(', ')}...`);
                }
                
            } else {
                console.log(`   ❌ FAILED: ${response.status} ${response.statusText}`);
                const errorText = await response.text();
                console.log(`   📝 Error: ${errorText}`);
                allPassed = false;
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            allPassed = false;
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL VALIDATION RESULTS');
    console.log('='.repeat(50));
    
    if (allPassed) {
        console.log('🎉 ALL TESTS PASSED! 🎉');
        console.log('');
        console.log('✅ Your Farm Manager configuration is CORRECT and READY!');
        console.log('✅ All API endpoints are accessible');
        console.log('✅ Agent synchronization will work');
        console.log('✅ Account management will work');
        console.log('');
        console.log('🚀 Next Steps:');
        console.log('   1. Update your Portainer stack');
        console.log('   2. The Farm Manager will now connect successfully');
        console.log('   3. No more 401 errors!');
        console.log('');
        console.log('📋 Configuration Summary:');
        console.log(`   API_KEY=${API_KEY}`);
        console.log(`   ETERNALFARM_AGENT_KEY=${ETERNALFARM_AGENT_KEY}`);
        console.log(`   ETERNAL_API_URL=${ETERNAL_API_URL}`);
        
    } else {
        console.log('❌ Some tests failed - please check the errors above');
    }
    
    return allPassed;
}

// Run the validation
testConfiguredSetup().catch(console.error); 