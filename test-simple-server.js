const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = 3000; // Use port 3000 for main interface

// Middleware
app.use(express.json());
// Serve static files but exclude HTML files to avoid conflicts
app.use(express.static(__dirname, {
    index: false  // Disable automatic index.html serving
}));

// Basic routes with cache-busting headers
app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve original EternalFarm Command Center assets with cache-busting
app.get('/style.css', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/app.js', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'app.js'));
});

app.get('/test', (req, res) => {
    res.json({ 
        message: 'FarmBoy v0.2 Server is working!', 
        timestamp: new Date().toISOString() 
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        mode: 'farmboy-v2-test',
        websocket: 'enabled'
    });
});

// Discord API endpoints
app.post('/api/discord/test', (req, res) => {
    const { webhookUrl, message, color, title, username } = req.body;
    
    // Simulate Discord webhook test
    console.log('🔗 Discord webhook test requested:', { webhookUrl: webhookUrl?.substring(0, 50) + '...', message });
    
    setTimeout(() => {
        res.json({
            success: true,
            message: 'Discord webhook test successful!',
            status: 200,
            timestamp: new Date().toISOString()
        });
        
        // Broadcast to WebSocket clients
        broadcastToClients('discord-message', {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            content: message || 'Test message',
            color: color || '#00ff00',
            title: title || 'Test Message',
            username: username || 'Farm Manager'
        });
    }, 1000);
});

app.post('/api/discord/send', (req, res) => {
    const { webhookUrl, message, color, title, username } = req.body;
    
    console.log('📤 Discord message send requested:', { message, title });
    
    // Simulate sending message
    setTimeout(() => {
        res.json({
            success: true,
            message: 'Discord message sent successfully!',
            status: 200,
            messageId: Date.now()
        });
        
        // Add to message log and broadcast
        broadcastToClients('discord-message', {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            content: message,
            color: color || '#0099ff',
            title: title || 'Custom Message',
            username: username || 'Farm Manager'
        });
    }, 500);
});

app.get('/api/discord/messages', (req, res) => {
    // Return mock recent messages
    res.json([
        {
            id: Date.now() - 1000,
            timestamp: new Date(Date.now() - 60000).toISOString(),
            content: 'System health check completed ✅',
            color: '#00ff00',
            title: 'Health Check',
            username: 'Farm Manager'
        },
        {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            content: 'FarmBoy v0.2 test server started successfully! 🚀',
            color: '#0099ff',
            title: 'Server Status',
            username: 'Farm Manager'
        }
    ]);
});

app.post('/api/discord/screenshot', (req, res) => {
    const { type = 'desktop' } = req.body;
    
    console.log('📸 Screenshot requested:', type);
    
    // Simulate screenshot functionality
    setTimeout(() => {
        const mockScreenshot = {
            success: true,
            filename: `screenshot_${type}_${Date.now()}.png`,
            path: `/screenshots/screenshot_${type}_${Date.now()}.png`,
            size: '1920x1080',
            type: type
        };
        
        res.json(mockScreenshot);
        
        // Broadcast screenshot taken
        broadcastToClients('discord-message', {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            content: `📸 Screenshot captured: ${mockScreenshot.filename}`,
            color: '#00ff00',
            title: 'Screenshot Captured',
            username: 'Farm Manager'
        });
    }, 1000);
});

app.post('/api/discord/quick-action', (req, res) => {
    const { action } = req.body;
    
    console.log('⚡ Quick action requested:', action);
    
    // Define quick action responses
    const quickActions = {
        'Send Status Update': {
            title: 'System Status Update',
            content: '✅ Farm Manager is running smoothly!\n🤖 2 agents active\n💻 System healthy\n📊 All services operational',
            color: '#00ff00'
        },
        'Send System Stats': {
            title: 'System Statistics',
            content: '💾 Memory: 65% used (2.1GB/3.2GB)\n🔥 CPU: 23% load\n📡 Network: 45 MB/s\n⏱️ Uptime: 4h 23m',
            color: '#0099ff'
        },
        'Send Agent Summary': {
            title: 'Agent Summary Report',
            content: '🤖 TestAgent1: ✅ Active (Running P2P AI Master)\n🤖 TestAgent2: ⚫ Inactive\n📋 Total Tasks: 3 running, 2 completed',
            color: '#ff6600'
        },
        'Screenshot + Stats': {
            title: 'Screenshot with Stats',
            content: '📸 Current screenshot captured\n📊 System performance: Normal\n🔄 Last update: ' + new Date().toLocaleTimeString(),
            color: '#9f39ff'
        },
        'Send Task Update': {
            title: 'Task Status Update',
            content: '📋 Active Tasks:\n• Task #1: P2P AI Master (2h 15m)\n• Task #2: Woodcutting Script (45m)\n• Task #3: Mining Bot (1h 30m)',
            color: '#ffff00'
        },
        'Send Alert': {
            title: '🚨 Farm Manager Alert',
            content: '⚠️ This is a test alert from Farm Manager\n🔔 All systems are functioning normally\n📱 Alert system is operational',
            color: '#ff0000'
        }
    };
    
    const actionData = quickActions[action];
    
    if (!actionData) {
        return res.status(400).json({
            success: false,
            error: `Unknown quick action: ${action}`
        });
    }
    
    // Simulate sending the action
    setTimeout(() => {
        res.json({
            success: true,
            message: `${action} sent successfully!`,
            data: actionData
        });
        
        // Broadcast to WebSocket clients
        broadcastToClients('discord-message', {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            content: actionData.content,
            color: actionData.color,
            title: actionData.title,
            username: 'Farm Manager'
        });
        
        console.log(`✅ Quick action completed: ${action}`);
    }, 500);
});

// Mock API routes
app.get('/api/v1/agents', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, name: 'TestAgent1', status: 'active' },
            { id: 2, name: 'TestAgent2', status: 'inactive' }
        ]
    });
});

app.post('/api/v1/agents/sync', (req, res) => {
    res.json({
        success: true,
        message: 'Agents synced successfully',
        agents_count: 2
    });
});

// Tasks API endpoints
app.get('/api/v1/tasks', (req, res) => {
    const { page = 1, per_page = 10, agent_id } = req.query;
    
    // Mock tasks data
    const allTasks = [
        {
            id: 1,
            name: 'P2P AI Master',
            status: 'running',
            agent_id: 1,
            agent_name: 'TestAgent1',
            script: 'p2p_ai_master.bot',
            runtime: '2h 15m',
            created_at: new Date(Date.now() - 8100000).toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 2,
            name: 'Woodcutting Script',
            status: 'running',
            agent_id: 1,
            agent_name: 'TestAgent1',
            script: 'woodcutting.bot',
            runtime: '45m',
            created_at: new Date(Date.now() - 2700000).toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 3,
            name: 'Mining Bot',
            status: 'running',
            agent_id: 2,
            agent_name: 'TestAgent2',
            script: 'mining.bot',
            runtime: '1h 30m',
            created_at: new Date(Date.now() - 5400000).toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 4,
            name: 'Combat Training',
            status: 'stopped',
            agent_id: 1,
            agent_name: 'TestAgent1',
            script: 'combat_training.bot',
            runtime: '0m',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            updated_at: new Date(Date.now() - 1800000).toISOString()
        },
        {
            id: 5,
            name: 'Fishing Script',
            status: 'completed',
            agent_id: 2,
            agent_name: 'TestAgent2',
            script: 'fishing.bot',
            runtime: '3h 22m',
            created_at: new Date(Date.now() - 14400000).toISOString(),
            updated_at: new Date(Date.now() - 3600000).toISOString()
        }
    ];
    
    // Filter by agent_id if provided
    let tasks = agent_id ? allTasks.filter(task => task.agent_id == agent_id) : allTasks;
    
    // Pagination
    const startIndex = (page - 1) * per_page;
    const paginatedTasks = tasks.slice(startIndex, startIndex + parseInt(per_page));
    
    console.log(`📋 Tasks requested: page=${page}, per_page=${per_page}, agent_id=${agent_id || 'all'}`);
    
    res.json({
        success: true,
        data: paginatedTasks,
        pagination: {
            current_page: parseInt(page),
            per_page: parseInt(per_page),
            total_items: tasks.length,
            total_pages: Math.ceil(tasks.length / per_page)
        }
    });
});

app.post('/api/v1/tasks', (req, res) => {
    const { name, script, agent_id } = req.body;
    
    console.log('🆕 Creating new task:', { name, script, agent_id });
    
    // Simulate task creation
    setTimeout(() => {
        const newTask = {
            id: Date.now(),
            name: name || 'New Task',
            status: 'created',
            agent_id: agent_id || 1,
            agent_name: agent_id === 2 ? 'TestAgent2' : 'TestAgent1',
            script: script || 'default.bot',
            runtime: '0m',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: newTask,
            message: 'Task created successfully'
        });
        
        // Broadcast task creation
        broadcastToClients('task-created', newTask);
    }, 500);
});

app.post('/api/v1/tasks/:taskId/start', (req, res) => {
    const { taskId } = req.params;
    
    console.log(`▶️ Starting task: ${taskId}`);
    
    // Simulate task start
    setTimeout(() => {
        res.json({
            success: true,
            message: `Task ${taskId} started successfully`,
            task_id: taskId,
            status: 'running',
            started_at: new Date().toISOString()
        });
        
        // Broadcast task start
        broadcastToClients('task-started', {
            taskId: taskId,
            status: 'running',
            timestamp: new Date().toISOString()
        });
    }, 500);
});

app.post('/api/v1/tasks/:taskId/stop', (req, res) => {
    const { taskId } = req.params;
    
    console.log(`⏹️ Stopping task: ${taskId}`);
    
    // Simulate task stop
    setTimeout(() => {
        res.json({
            success: true,
            message: `Task ${taskId} stopped successfully`,
            task_id: taskId,
            status: 'stopped',
            stopped_at: new Date().toISOString()
        });
        
        // Broadcast task stop
        broadcastToClients('task-stopped', {
            taskId: taskId,
            status: 'stopped',
            timestamp: new Date().toISOString()
        });
    }, 500);
});

// Additional API endpoints that may be called
app.get('/api/v1/accounts', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, username: 'test_account_1', status: 'active', email: 'test1@example.com' },
            { id: 2, username: 'test_account_2', status: 'inactive', email: 'test2@example.com' }
        ]
    });
});

app.get('/api/v1/proxies', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, host: '127.0.0.1', port: 8080, status: 'active', type: 'http' },
            { id: 2, host: '127.0.0.1', port: 8081, status: 'inactive', type: 'socks5' }
        ]
    });
});

app.get('/api/v1/bots', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, name: 'P2P AI Master', script: 'p2p_ai_master.bot', status: 'active' },
            { id: 2, name: 'Woodcutting Bot', script: 'woodcutting.bot', status: 'active' },
            { id: 3, name: 'Mining Bot', script: 'mining.bot', status: 'inactive' }
        ]
    });
});

app.get('/api/config', (req, res) => {
    res.json({
        success: true,
        data: {
            eternalfarm_api_key: 'test_key_123',
            discord_webhook_url: 'https://discord.com/api/webhooks/test',
            environment: 'test'
        }
    });
});

// Proxy Checker API endpoints
app.post('/api/proxy-checker/test', (req, res) => {
    const { proxy } = req.body;
    
    console.log('🔍 Single proxy test requested:', proxy);
    
    // Simulate proxy testing
    setTimeout(() => {
        const working = Math.random() > 0.3; // 70% success rate
        const result = {
            working,
            proxy: `${proxy.host}:${proxy.port}`,
            responseTime: working ? Math.floor(Math.random() * 2000) + 100 : null,
            location: working ? { 
                country: 'United States', 
                city: 'New York',
                isp: 'Test ISP'
            } : null,
            ip: working ? '192.168.1.' + Math.floor(Math.random() * 255) : null,
            error: working ? null : 'Connection timeout',
            testedAt: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: result
        });
    }, 1000);
});

// Batch proxy test endpoint (for custom proxy lists)
app.post('/api/proxy-checker/test-batch', (req, res) => {
    const { proxies = [], options = {} } = req.body;
    
    console.log('🔍 Custom batch proxy test requested:', proxies?.length || 0, 'proxies');
    
    // Simulate batch proxy testing with provided list
    setTimeout(() => {
        const total = proxies.length || 5;
        const results = [];
        let working = 0;
        let totalResponseTime = 0;
        
        for (let i = 0; i < total; i++) {
            const isWorking = Math.random() > 0.35; // 65% success rate
            const responseTime = isWorking ? Math.floor(Math.random() * 2000) + 150 : null;
            const proxy = proxies[i] || `test-proxy-${i + 1}:8080`;
            
            if (isWorking) {
                working++;
                totalResponseTime += responseTime;
            }
            
            results.push({
                working: isWorking,
                proxy: typeof proxy === 'string' ? proxy : `${proxy.host || 'unknown'}:${proxy.port || '8080'}`,
                responseTime,
                location: isWorking ? { 
                    country: `Country ${i + 1}`,
                    city: `City ${i + 1}`,
                    isp: 'Test ISP'
                } : null,
                ip: isWorking ? `192.168.1.${i + 100}` : null,
                error: isWorking ? null : 'Connection timeout',
                testedAt: new Date().toISOString()
            });
        }
        
        const summary = {
            total,
            working,
            failed: total - working,
            averageResponseTime: working > 0 ? Math.round(totalResponseTime / working) : 0,
            successRate: working > 0 ? Math.round((working / total) * 100) : 0
        };
        
        res.json({
            success: true,
            data: {
                results,
                summary
            }
        });
    }, 1500);
});

app.post('/api/proxy-checker/test-all', (req, res) => {
    console.log('🔍 Database proxy test requested');
    
    // Simulate testing all proxies from database
    setTimeout(() => {
        const total = 15;
        const results = [];
        let working = 0;
        let totalResponseTime = 0;
        
        for (let i = 0; i < total; i++) {
            const isWorking = Math.random() > 0.4;
            const responseTime = isWorking ? Math.floor(Math.random() * 2000) + 100 : null;
            
            if (isWorking) {
                working++;
                totalResponseTime += responseTime;
            }
            
            results.push({
                working: isWorking,
                proxy: `db-proxy-${i + 1}:8080`,
                responseTime,
                location: isWorking ? { 
                    country: `Country ${i + 1}`,
                    city: `City ${i + 1}`,
                    isp: 'Database ISP'
                } : null,
                ip: isWorking ? `10.0.1.${i + 1}` : null,
                error: isWorking ? null : 'Connection refused',
                testedAt: new Date().toISOString()
            });
        }
        
        const summary = {
            total,
            working,
            failed: total - working,
            averageResponseTime: working > 0 ? Math.round(totalResponseTime / working) : 0,
            successRate: working > 0 ? Math.round((working / total) * 100) : 0
        };
        
        res.json({
            success: true,
            data: {
                results,
                summary
            }
        });
    }, 2000);
});

app.get('/api/proxy-checker/stats', (req, res) => {
    console.log('📊 Proxy stats requested');
    
    // Return mock proxy statistics
    res.json({
        success: true,
        data: {
            total: 45,
            working: 32,
            failed: 10,
            untested: 3,
            active: 32,
            lastChecked: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        }
    });
});

// API Key testing endpoint
app.post('/api/test-connection', (req, res) => {
    const { service, apiKey, apiUrl } = req.body;
    
    console.log(`🔑 Testing ${service} connection with key: ${apiKey?.substring(0, 10)}...`);
    
    // Simulate API key testing
    setTimeout(() => {
        const success = Math.random() > 0.2; // 80% success rate
        
        if (success) {
            res.json({
                success: true,
                message: `${service} connection successful!`,
                data: {
                    status: 'connected',
                    version: '1.0',
                    permissions: ['read', 'write'],
                    account: 'test_account'
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: `${service} connection failed: Invalid API key`,
                error: 'Authentication failed'
            });
        }
    }, 1000);
});

// Screenshot API endpoints
app.post('/api/screenshot/capture', (req, res) => {
    const { type = 'desktop', options = {} } = req.body;
    
    console.log('📸 Screenshot capture requested:', type, options);
    
    // Simulate screenshot capture
    setTimeout(() => {
        const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        
        res.json({
            success: true,
            data: {
                filename: `screenshot_${type}_${Date.now()}.png`,
                type: type,
                size: { width: 1920, height: 1080 },
                format: 'png',
                dataUrl: mockBase64,
                path: `/tmp/screenshot_${type}_${Date.now()}.png`
            }
        });
    }, 500);
});

// WebSocket functionality
const clients = new Set();

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('🔌 WebSocket client connected');
    
    // Send initial connection message
    ws.send(JSON.stringify({
        type: 'status',
        data: {
            status: 'connected',
            timestamp: new Date().toISOString(),
            mode: 'farmboy-v2-test'
        }
    }));
    
    ws.on('close', () => {
        clients.delete(ws);
        console.log('🔌 WebSocket client disconnected');
    });
    
    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        clients.delete(ws);
    });
    
    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('📨 WebSocket message received:', data.type);
            
            // Echo back pong for ping messages
            if (data.type === 'ping') {
                ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
            }
        } catch (error) {
            console.error('❌ WebSocket message error:', error);
        }
    });
});

function broadcastToClients(type, data) {
    const message = JSON.stringify({ type, data });
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Start server
server.listen(PORT, () => {
    console.log(`🚀 FarmBoy v0.2 Test Server Started Successfully!`);
    console.log(`🌐 HTTP Server: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket Server: ws://localhost:${PORT}`);
    console.log(`📋 Available API endpoints:`);
    console.log(`   • GET  /api/v1/agents - List agents`);
    console.log(`   • POST /api/v1/agents/sync - Sync agents`);
    console.log(`   • GET  /api/v1/tasks - List tasks`);
    console.log(`   • POST /api/v1/tasks - Create task`);
    console.log(`   • POST /api/v1/tasks/:id/start - Start task`);
    console.log(`   • POST /api/v1/tasks/:id/stop - Stop task`);
    console.log(`   • GET  /api/v1/accounts - List accounts`);
    console.log(`   • GET  /api/v1/proxies - List proxies`);
    console.log(`   • GET  /api/v1/bots - List bots`);
    console.log(`   • GET  /api/config - Get configuration`);
    console.log(`   • POST /api/discord/test - Test Discord webhook`);
    console.log(`   • POST /api/discord/send - Send Discord message`);
    console.log(`   • POST /api/discord/quick-action - Quick actions`);
    console.log(`   • POST /api/discord/screenshot - Take screenshot`);
    console.log(`   • GET  /api/discord/messages - Get message log`);
    console.log(`\n🎯 Main interface: http://localhost:${PORT}/`);
    console.log(`✅ Ready for FarmBoy v0.2 testing with full API support!`);
}); 