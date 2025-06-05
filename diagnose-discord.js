const https = require('https');
const { URL } = require('url');

// Your working webhook URL
const webhookUrl = 'https://discord.com/api/webhooks/1379651760661991475/lcgRwEj3Y0Hl4bW7DLjm7lfvQ3VnMJzGbstNVYWoDa--xUmzsSCl-NMlNAkC3fJTCqBE';

console.log('🔧 Discord Webhook Diagnostic Tool');
console.log('=================================');
console.log('');

// Test 1: Validate URL format
console.log('📋 Test 1: Webhook URL Format');
console.log('URL:', webhookUrl);
console.log('Length:', webhookUrl.length);
console.log('Contains discord.com:', webhookUrl.includes('discord.com'));
console.log('Contains webhooks:', webhookUrl.includes('/webhooks/'));
console.log('');

// Test 2: Parse URL
console.log('📋 Test 2: URL Parsing');
try {
    const url = new URL(webhookUrl);
    console.log('✅ URL parsed successfully');
    console.log('Host:', url.hostname);
    console.log('Path:', url.pathname);
    console.log('');
} catch (error) {
    console.log('❌ URL parsing failed:', error.message);
    process.exit(1);
}

// Test 3: Test webhook with simple message
console.log('📋 Test 3: Simple Webhook Test');
const testMessage = {
    content: "🧪 **Simple Test Message**\n\nThis is a basic webhook test from the diagnostic tool."
};

const data = JSON.stringify(testMessage);
const url = new URL(webhookUrl);

const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'Discord-Diagnostic-Tool/1.0'
    }
};

console.log('📡 Sending request...');
console.log('Host:', options.hostname);
console.log('Path:', options.path);
console.log('');

const req = https.request(options, (res) => {
    console.log('📊 Response Details:');
    console.log('Status Code:', res.statusCode);
    console.log('Status Message:', res.statusMessage);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    console.log('');
    
    let responseData = '';
    res.on('data', (chunk) => {
        responseData += chunk;
    });
    
    res.on('end', () => {
        console.log('📄 Response Body:', responseData || '(empty)');
        console.log('');
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ SUCCESS! Webhook is working correctly!');
            console.log('🎉 Check your Discord channel for the test message.');
        } else {
            console.log('❌ FAILED! HTTP Error:', res.statusCode, res.statusMessage);
            
            // Common error explanations
            switch (res.statusCode) {
                case 404:
                    console.log('💡 404 means: Webhook not found or URL is incorrect');
                    console.log('   - Check if webhook still exists in Discord');
                    console.log('   - Verify the complete URL was copied');
                    break;
                case 401:
                    console.log('💡 401 means: Unauthorized - invalid token');
                    break;
                case 403:
                    console.log('💡 403 means: Forbidden - missing permissions');
                    break;
                case 429:
                    console.log('💡 429 means: Rate limited - too many requests');
                    break;
                default:
                    console.log('💡 Unexpected error occurred');
            }
        }
        
        console.log('');
        console.log('🔧 Diagnostic complete!');
    });
});

req.on('error', (error) => {
    console.log('❌ Network Error:', error.message);
    console.log('💡 This could be a connection issue');
    console.log('');
    console.log('🔧 Diagnostic complete!');
});

req.on('timeout', () => {
    console.log('⏰ Request Timeout');
    console.log('💡 The request took too long to complete');
    req.destroy();
    console.log('');
    console.log('🔧 Diagnostic complete!');
});

req.setTimeout(15000); // 15 second timeout
req.write(data);
req.end(); 