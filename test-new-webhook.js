const https = require('https');

const webhookUrl = 'https://discord.com/api/webhooks/1379651760661991475/lcgRwEj3Y0Hl4bW7DLjm7lfvQ3VnMJzGbstNVYWoDa--xUmzsSCl-NMlNAkC3fJTCqBE';

const message = {
    content: "🎉 **Farm Manager Connected Successfully!**",
    username: "Farm Manager",
    embeds: [{
        title: "✅ Discord Integration Test",
        description: "Your Farm Manager is now connected to Discord!",
        color: 0x00ff00,
        timestamp: new Date().toISOString(),
        fields: [
            {
                name: "🌐 Server",
                value: "http://localhost:3002",
                inline: true
            },
            {
                name: "🔌 WebSocket",
                value: "Connected",
                inline: true
            },
            {
                name: "📅 Time",
                value: new Date().toLocaleString(),
                inline: true
            }
        ],
        footer: {
            text: "Farm Manager • Discord Integration Test"
        }
    }]
};

const data = JSON.stringify(message);

const url = new URL(webhookUrl);
const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

console.log('🧪 Testing Discord webhook...');
console.log('📡 Webhook: Captain Hook');
console.log('🔗 URL: ' + webhookUrl.substring(0, 50) + '...');

const req = https.request(options, (res) => {
    console.log('📊 Status Code:', res.statusCode);
    
    let responseData = '';
    res.on('data', (chunk) => {
        responseData += chunk;
    });
    
    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ SUCCESS! Discord webhook is working!');
            console.log('🎉 Check your Discord channel for the test message.');
        } else {
            console.log('❌ FAILED! Status:', res.statusCode);
            console.log('📄 Response:', responseData);
        }
    });
});

req.on('error', (error) => {
    console.log('❌ Error:', error.message);
});

req.write(data);
req.end(); 