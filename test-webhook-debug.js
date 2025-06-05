#!/usr/bin/env node

// Discord Webhook Debug Tool
// This script helps test Discord webhooks independently

const https = require('https');
const { URL } = require('url');

async function testDiscordWebhook(webhookUrl, testMessage = "🧪 Test from Farm Manager") {
    return new Promise((resolve, reject) => {
        try {
            const url = new URL(webhookUrl);
            
            // Validate webhook URL format
            if (!webhookUrl.includes('discord.com/api/webhooks/')) {
                return reject(new Error('Invalid webhook URL format. Must contain "discord.com/api/webhooks/"'));
            }
            
            const payload = JSON.stringify({
                content: testMessage,
                username: "Farm Manager",
                embeds: [{
                    title: "🧪 Webhook Test",
                    description: "Testing Discord webhook integration",
                    color: 0x00ff00,
                    timestamp: new Date().toISOString(),
                    fields: [
                        {
                            name: "Status",
                            value: "✅ Connected",
                            inline: true
                        },
                        {
                            name: "Server",
                            value: "http://localhost:3002",
                            inline: true
                        }
                    ]
                }]
            });
            
            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                    'User-Agent': 'Farm-Manager/1.0'
                }
            };
            
            console.log('🔍 Testing webhook:', webhookUrl.substring(0, 50) + '...');
            console.log('📡 Sending request to:', url.hostname + url.pathname);
            
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    console.log('📊 Response Status:', res.statusCode);
                    console.log('📋 Response Headers:', res.headers);
                    
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log('✅ Webhook test SUCCESSFUL!');
                        resolve({
                            success: true,
                            statusCode: res.statusCode,
                            response: data
                        });
                    } else {
                        console.log('❌ Webhook test FAILED!');
                        console.log('📄 Response body:', data);
                        reject(new Error(`HTTP ${res.statusCode}: ${data || 'Unknown error'}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                console.log('❌ Request error:', error.message);
                reject(error);
            });
            
            req.on('timeout', () => {
                console.log('⏰ Request timeout');
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.setTimeout(10000); // 10 second timeout
            req.write(payload);
            req.end();
            
        } catch (error) {
            reject(error);
        }
    });
}

// Function to validate webhook URL format
function validateWebhookUrl(url) {
    const issues = [];
    
    if (!url) {
        issues.push('Webhook URL is empty');
        return issues;
    }
    
    if (!url.startsWith('https://')) {
        issues.push('Webhook URL must start with "https://"');
    }
    
    if (!url.includes('discord.com/api/webhooks/')) {
        issues.push('Webhook URL must contain "discord.com/api/webhooks/"');
    }
    
    const parts = url.split('/');
    if (parts.length < 7) {
        issues.push('Webhook URL appears incomplete (missing webhook ID or token)');
    }
    
    if (url.length < 100) {
        issues.push('Webhook URL appears too short (missing token?)');
    }
    
    return issues;
}

// Main test function
async function main() {
    const webhookUrl = process.argv[2];
    
    if (!webhookUrl) {
        console.log('❌ Usage: node test-webhook-debug.js <webhook-url>');
        console.log('');
        console.log('Example:');
        console.log('node test-webhook-debug.js "https://discord.com/api/webhooks/123456789/abcdef..."');
        process.exit(1);
    }
    
    console.log('🔧 Discord Webhook Debug Tool');
    console.log('=====================================');
    
    // Validate URL format
    console.log('🔍 Validating webhook URL...');
    const validationIssues = validateWebhookUrl(webhookUrl);
    
    if (validationIssues.length > 0) {
        console.log('❌ Webhook URL validation failed:');
        validationIssues.forEach(issue => console.log('   • ' + issue));
        console.log('');
        console.log('📝 How to get a valid webhook URL:');
        console.log('   1. Go to your Discord server');
        console.log('   2. Right-click on the channel → Edit Channel');
        console.log('   3. Go to Integrations → Webhooks');
        console.log('   4. Create Webhook or edit existing one');
        console.log('   5. Copy the webhook URL (should be 100+ characters)');
        process.exit(1);
    }
    
    console.log('✅ Webhook URL format looks valid');
    console.log('');
    
    // Test the webhook
    try {
        await testDiscordWebhook(webhookUrl);
        console.log('');
        console.log('🎉 SUCCESS! Your Discord webhook is working correctly.');
        console.log('You can now use this webhook URL in your Farm Manager.');
    } catch (error) {
        console.log('');
        console.log('❌ FAILED! Webhook test unsuccessful.');
        console.log('Error:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting tips:');
        console.log('   • Check if the webhook still exists in Discord');
        console.log('   • Verify you copied the complete webhook URL');
        console.log('   • Make sure the bot has permissions in the channel');
        console.log('   • Try creating a new webhook');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testDiscordWebhook, validateWebhookUrl }; 