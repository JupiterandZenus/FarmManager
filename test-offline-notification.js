// Test script for offline notification functionality
require('dotenv').config();

const https = require('https');

// Test Discord webhook configuration
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN";
const PORT = process.env.PORT || 3000;

// Discord notification function (copied from server.js)
async function sendDiscordNotification(title, message, color = 0x00ff00) {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes('YOUR_WEBHOOK')) {
        console.log('⚠️ Discord webhook URL not configured - notification would be sent here:');
        console.log(`📢 ${title}`);
        console.log(`📝 ${message}`);
        console.log(`🎨 Color: #${color.toString(16)}`);
        return;
    }

    const embed = {
        title: title,
        description: message,
        color: color,
        timestamp: new Date().toISOString(),
        footer: {
            text: "Farm Manager Notification"
        },
        fields: [
            {
                name: "Server",
                value: `http://localhost:${PORT}`,
                inline: true
            },
            {
                name: "Status",
                value: "🔴 Offline",
                inline: true
            }
        ]
    };

    const payload = {
        embeds: [embed]
    };

    try {
        const webhookUrl = new URL(DISCORD_WEBHOOK_URL);
        const postData = JSON.stringify(payload);

        const options = {
            hostname: webhookUrl.hostname,
            port: 443,
            path: webhookUrl.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            if (res.statusCode === 204) {
                console.log('✅ Discord notification sent successfully');
            } else {
                console.log(`⚠️ Discord notification failed with status: ${res.statusCode}`);
            }
        });

        req.on('error', (error) => {
            console.error('❌ Discord notification error:', error.message);
        });

        req.write(postData);
        req.end();
    } catch (error) {
        console.error('❌ Discord webhook error:', error.message);
    }
}

// Test offline notification function
async function sendOfflineNotification(reason = 'Unknown', error = null) {
    const errorDetails = error ? `\n🔍 **Error:** ${error.message}` : '';
    
    await sendDiscordNotification(
        "🔴 Farm Manager 0.1 - OFFLINE",
        `Farm Manager has gone offline!\n\n` +
        `⏰ **Offline Time:** ${new Date().toLocaleString()}\n` +
        `📊 **Reason:** ${reason}\n` +
        `🔧 **Uptime:** ${Math.floor(process.uptime())} seconds\n` +
        `🌐 **Last URL:** http://localhost:${PORT}/` +
        errorDetails,
        0xff0000 // Red color
    );
}

// Test different offline scenarios
async function testOfflineNotifications() {
    console.log('🧪 Testing Farm Manager Offline Notifications\n');
    
    console.log('📋 Current Configuration:');
    console.log(`🔑 Discord Webhook: ${DISCORD_WEBHOOK_URL.includes('YOUR_WEBHOOK') ? 'Not configured' : 'Configured'}`);
    console.log(`🌐 Server Port: ${PORT}`);
    console.log('');
    
    console.log('🔴 Test 1: Manual shutdown notification');
    await sendOfflineNotification('Manual shutdown (SIGINT)');
    
    console.log('\n🔴 Test 2: Server error notification');
    await sendOfflineNotification('Server error', { message: 'EADDRINUSE: address already in use' });
    
    console.log('\n🔴 Test 3: Database connection lost notification');
    await sendOfflineNotification('Database connection lost', { message: 'Connection timeout' });
    
    console.log('\n🔴 Test 4: Uncaught exception notification');
    await sendOfflineNotification('Uncaught exception', { message: 'TypeError: Cannot read property of undefined' });
    
    console.log('\n✅ Offline notification tests completed!');
    console.log('\n📝 To enable real Discord notifications:');
    console.log('1. Create a Discord webhook in your server');
    console.log('2. Copy the webhook URL');
    console.log('3. Add it to your .env file as DISCORD_WEBHOOK_URL=your_webhook_url');
    console.log('4. Restart the Farm Manager server');
}

// Run the tests
testOfflineNotifications().catch(console.error); 