const WebSocket = require('ws');

console.log('🧪 Testing WebSocket Connection to Farm Manager...');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', function open() {
    console.log('✅ Connected to WebSocket server');
    
    // Subscribe to updates
    ws.send(JSON.stringify({
        type: 'subscribe',
        data: { types: ['task_started', 'task_stopped', 'server_status', 'account_created'] }
    }));
    
    // Send a ping every 10 seconds
    setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            console.log('🏓 Sending ping...');
            ws.send(JSON.stringify({ type: 'ping' }));
        }
    }, 10000);
});

ws.on('message', function message(data) {
    try {
        const message = JSON.parse(data);
        console.log('📨 Received message:', {
            type: message.type,
            timestamp: message.timestamp,
            data: message.data
        });
        
        switch (message.type) {
            case 'connection':
                console.log('🎉 Welcome message received');
                break;
            case 'pong':
                console.log('🏓 Pong received');
                break;
            case 'server_status':
                console.log(`📊 Server Status - Uptime: ${Math.floor(message.data.uptime)}s, Connections: ${message.data.connections}`);
                break;
            case 'task_started':
                console.log(`🚀 Task ${message.data.task.id} started!`);
                break;
            case 'task_stopped':
                console.log(`🛑 Task ${message.data.task.id} stopped!`);
                break;
            case 'account_created':
                console.log(`👤 Account ${message.data.account.username} created!`);
                break;
        }
    } catch (error) {
        console.error('❌ Error parsing message:', error);
    }
});

ws.on('close', function close() {
    console.log('🔌 WebSocket connection closed');
});

ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err);
});

console.log('🔄 Connecting to ws://localhost:3000...');
console.log('Press Ctrl+C to exit');

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Closing WebSocket connection...');
    ws.close();
    process.exit(0);
}); 