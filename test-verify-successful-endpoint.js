const fetch = require('node-fetch');

// Configuration
const config = {
    API_URL: 'https://api.eternalfarm.net',
    AGENT_KEY: 'RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5'
};

async function verifyAutoLaunch() {
    console.log('🔍 Verifying EternalFarm Auto-Launch Configuration');
    console.log('===============================================');

    try {
        // Test agent status endpoint
        console.log('\n📡 Testing agent status...');
        const response = await fetch(`${config.API_URL}/v1/agents/status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.AGENT_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('\n📊 Agent Status:');
            
            if (data.data && data.data.length > 0) {
                data.data.forEach((agent, index) => {
                    console.log(`\n🤖 Agent ${index + 1}:`);
                    console.log(`   Name: ${agent.name || 'Unknown'}`);
                    console.log(`   Status: ${agent.status || 'Unknown'}`);
                    console.log(`   Last Seen: ${agent.last_seen_at || 'Never'}`);
                    console.log(`   Auto-Launch: ${agent.auto_launch ? '✅' : '❌'}`);
                    console.log(`   Checker Running: ${agent.checker_running ? '✅' : '❌'}`);
                    console.log(`   Launcher Running: ${agent.launcher_running ? '✅' : '❌'}`);
                    console.log(`   Automater Running: ${agent.automater_running ? '✅' : '❌'}`);
                });
            } else {
                console.log('❌ No agents found');
            }
        } else {
            console.log('❌ Failed to get agent status');
            console.log(await response.text());
        }

    } catch (error) {
        console.error('❌ Verification Error:', error.message);
    }
}

// Run verification
console.log('🚀 Starting Auto-Launch Verification');
console.log('==================================\n');

verifyAutoLaunch()
    .then(() => {
        console.log('\n✨ Verification complete!');
    })
    .catch(console.error); 