#!/usr/bin/env node

/**
 * EternalFarm API Test Script
 * 
 * This script helps you test your EternalFarm API connection
 * before configuring it in the Farm Manager.
 */

const https = require('https');
const http = require('http');
require('dotenv').config({ path: './config.env' });

// Get configuration from environment
const ETERNALFARM_AGENT_KEY = process.env.ETERNALFARM_AGENT_KEY;
const ETERNAL_API_URL = process.env.ETERNAL_API_URL || 'https://api.eternalfarm.com';

console.log('🧪 EternalFarm API Connection Test');
console.log('=====================================');

// Check if API key is configured
if (!ETERNALFARM_AGENT_KEY || 
    ETERNALFARM_AGENT_KEY === 'YOUR_ACTUAL_ETERNALFARM_API_KEY_HERE' || 
    ETERNALFARM_AGENT_KEY === 'YOUR_ETERNALFARM_AGENT_KEY_HERE') {
    console.log('❌ EternalFarm API key not configured!');
    console.log('');
    console.log('📋 To fix this:');
    console.log('   1. Open config.env file');
    console.log('   2. Replace ETERNALFARM_AGENT_KEY=YOUR_ACTUAL_ETERNALFARM_API_KEY_HERE');
    console.log('   3. With your actual EternalFarm API key');
    console.log('   4. Run this test again');
    console.log('');
    console.log('💡 Example: ETERNALFARM_AGENT_KEY=ef_1234567890abcdef1234567890abcdef');
    process.exit(1);
}

console.log(`🔑 API Key: ${ETERNALFARM_AGENT_KEY.substring(0, 10)}...`);
console.log(`🌐 API URL: ${ETERNAL_API_URL}`);
console.log('');

// Test the API connection
async function testEternalFarmAPI() {
    return new Promise((resolve, reject) => {
        const url = new URL(`${ETERNAL_API_URL}/agents`);
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ETERNALFARM_AGENT_KEY}`,
                'Content-Type': 'application/json',
                'User-Agent': 'FarmManager-Test/1.0'
            }
        };

        console.log('🔍 Testing connection to EternalFarm API...');
        console.log(`   URL: ${url.toString()}`);
        console.log(`   Method: GET`);
        console.log(`   Headers: Authorization: Bearer ${ETERNALFARM_AGENT_KEY.substring(0, 10)}...`);
        console.log('');

        const req = client.request(options, (res) => {
            let data = '';
            
            console.log(`📡 Response Status: ${res.statusCode} ${res.statusMessage}`);
            console.log(`📋 Response Headers:`, res.headers);
            console.log('');

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const agents = JSON.parse(data);
                        console.log('✅ SUCCESS! Connected to EternalFarm API');
                        console.log(`📊 Found ${Array.isArray(agents) ? agents.length : 'unknown'} agents`);
                        
                        if (Array.isArray(agents) && agents.length > 0) {
                            console.log('');
                            console.log('🤖 Agent Details:');
                            agents.forEach((agent, index) => {
                                console.log(`   ${index + 1}. Name: ${agent.name || 'N/A'}`);
                                console.log(`      Status: ${agent.status || 'N/A'}`);
                                console.log(`      IP: ${agent.ip_address || 'N/A'}`);
                                console.log(`      Last Seen: ${agent.last_seen || 'N/A'}`);
                                console.log('');
                            });
                        } else {
                            console.log('⚠️ No agents found in your EternalFarm account');
                        }
                        
                        console.log('🎉 Your Farm Manager should now work correctly!');
                        console.log('   Start your server with: node server.js');
                        
                        resolve(agents);
                    } else if (res.statusCode === 401) {
                        console.log('❌ AUTHENTICATION FAILED');
                        console.log('   Your API key is invalid or expired');
                        console.log('   Please check your EternalFarm account settings');
                        reject(new Error('Invalid API key'));
                    } else if (res.statusCode === 403) {
                        console.log('❌ ACCESS DENIED');
                        console.log('   Your API key does not have permission to access agents');
                        console.log('   Please check your EternalFarm account permissions');
                        reject(new Error('Access denied'));
                    } else if (res.statusCode === 429) {
                        console.log('❌ RATE LIMITED');
                        console.log('   Too many requests to the API');
                        console.log('   Please wait a moment and try again');
                        reject(new Error('Rate limited'));
                    } else {
                        console.log(`❌ API ERROR: ${res.statusCode} ${res.statusMessage}`);
                        console.log(`   Response: ${data}`);
                        reject(new Error(`API error: ${res.statusCode}`));
                    }
                } catch (parseError) {
                    console.log('❌ RESPONSE PARSE ERROR');
                    console.log(`   Could not parse API response as JSON`);
                    console.log(`   Raw response: ${data}`);
                    reject(parseError);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ CONNECTION ERROR');
            console.log(`   Could not connect to EternalFarm API`);
            console.log(`   Error: ${error.message}`);
            console.log('');
            console.log('🔧 Possible solutions:');
            console.log('   1. Check your internet connection');
            console.log('   2. Verify the API URL is correct');
            console.log('   3. Check if there are firewall restrictions');
            console.log('   4. Try again in a few minutes');
            reject(error);
        });

        req.on('timeout', () => {
            console.log('❌ CONNECTION TIMEOUT');
            console.log('   The API request took too long to respond');
            req.destroy();
            reject(new Error('Connection timeout'));
        });

        req.setTimeout(10000); // 10 second timeout
        req.end();
    });
}

// Run the test
testEternalFarmAPI()
    .then(() => {
        console.log('');
        console.log('✅ Test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.log('');
        console.log('❌ Test failed!');
        console.log(`   Error: ${error.message}`);
        console.log('');
        console.log('📚 For more help, check:');
        console.log('   - ETERNALFARM-SETUP.md');
        console.log('   - https://github.com/LostVirt/EFClient');
        process.exit(1);
    }); 