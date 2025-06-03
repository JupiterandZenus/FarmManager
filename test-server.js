const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load environment variables from test.env
const envFile = fs.readFileSync('test.env', 'utf8');
envFile.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/"/g, '');
        }
    }
});

// API Configuration
const API_KEY = process.env.API_KEY || "rBoolrmakSG77Ol5CidsnWvmdyvjpzXfppuR0J4e-LYtn2zZLABzIyJVn5TeHpuv";
const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

console.log('🧪 Starting Farm Manager in TEST MODE');
console.log('📝 Environment:', process.env.NODE_ENV);
console.log('🔑 API Key:', API_KEY.substring(0, 10) + '...');

// Discord notification function
async function sendDiscordNotification(title, message, color = 0x00ff00) {
    if (!DISCORD_WEBHOOK_URL) {
        console.log('⚠️ Discord webhook URL not configured');
        return;
    }

    const embed = {
        title: title,
        description: message,
        color: color,
        timestamp: new Date().toISOString(),
        footer: {
            text: "Farm Manager Test Notification"
        },
        fields: [
            {
                name: "Server",
                value: `http://localhost:${PORT}`,
                inline: true
            },
            {
                name: "Mode",
                value: "🧪 Test Mode",
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

// Function to validate API key
function validateApiKey(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }
    const providedKey = authHeader.split(' ')[1];
    return providedKey === API_KEY;
}

// Mock data for testing
const mockAccounts = [
    {
        id: 1,
        username: "test_account_1",
        email: "test1@example.com",
        type: "p2p",
        status: "idle",
        created_at: new Date().toISOString(),
        category: { id: 1, name: "Tutorial" },
        proxy: null,
        agent: null
    },
    {
        id: 2,
        username: "test_account_2", 
        email: "test2@example.com",
        type: "p2p",
        status: "running",
        created_at: new Date().toISOString(),
        category: { id: 2, name: "Production" },
        proxy: null,
        agent: null
    }
];

const mockTasks = [
    {
        id: 1,
        name: "P2P Master AI Timer",
        status: "running",
        account_id: 1,
        created_at: new Date().toISOString(),
        account: mockAccounts[0],
        agent: null,
        bot: null
    }
];

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Handle API routes with mock data
    if (pathname.startsWith('/api/v1/')) {
        res.setHeader('Content-Type', 'application/json');

        // Validate API key
        const authHeader = req.headers.authorization;
        if (!validateApiKey(authHeader)) {
            res.writeHead(401);
            res.end(JSON.stringify({ error: "Invalid API key" }));
            return;
        }

        // Mock API responses
        if (pathname === '/api/v1/accounts' && req.method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify({
                data: mockAccounts,
                page: 1,
                per_page: 10,
                total_items: mockAccounts.length
            }));
            return;
        }

        if (pathname === '/api/v1/tasks' && req.method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify({
                data: mockTasks,
                page: 1,
                per_page: 10,
                total_items: mockTasks.length
            }));
            return;
        }

        if (pathname === '/api/v1/agents' && req.method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify({ 
                data: [
                    { id: 1, name: "Test Agent", status: "online", accounts: [], bots: [], tasks: [] }
                ] 
            }));
            return;
        }

        if (pathname === '/api/v1/account-categories' && req.method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify({ 
                data: [
                    { id: 1, name: "Tutorial", accounts: [] },
                    { id: 2, name: "Production", accounts: [] }
                ] 
            }));
            return;
        }

        if (pathname === '/api/v1/proxies' && req.method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify({ data: [] }));
            return;
        }

        if (pathname === '/api/v1/bots' && req.method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify({ data: [] }));
            return;
        }

        if (pathname === '/api/v1/prime-link-requests' && req.method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify({ data: [] }));
            return;
        }

        // Handle task start/stop for Client Launcher testing
        const taskStartMatch = pathname.match(/^\/api\/v1\/tasks\/(\d+)\/start$/);
        if (taskStartMatch && req.method === 'POST') {
            const taskId = parseInt(taskStartMatch[1]);
            console.log(`🚀 Mock: Starting task ${taskId}`);
            res.writeHead(200);
            res.end(JSON.stringify({ 
                message: "Task started successfully (mock)",
                data: { ...mockTasks[0], status: "running" }
            }));
            return;
        }

        const taskStopMatch = pathname.match(/^\/api\/v1\/tasks\/(\d+)\/stop$/);
        if (taskStopMatch && req.method === 'POST') {
            const taskId = parseInt(taskStopMatch[1]);
            console.log(`🛑 Mock: Stopping task ${taskId}`);
            res.writeHead(200);
            res.end(JSON.stringify({ 
                message: "Task stopped successfully (mock)",
                data: { ...mockTasks[0], status: "stopped" }
            }));
            return;
        }

        // Default API response
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Endpoint not found (test mode)" }));
        return;
    }

    // Health check endpoint
    if (pathname === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ 
            status: "healthy", 
            mode: "test",
            timestamp: new Date().toISOString(),
            database: "mock"
        }));
        return;
    }

    // Handle static files (for web interface)
    if (pathname === '/' || pathname === '/index.html') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            res.setHeader('Content-Type', 'text/html');
            res.writeHead(200);
            res.end(data);
        });
        return;
    }

    if (pathname === '/app.js') {
        fs.readFile(path.join(__dirname, 'app.js'), (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            res.setHeader('Content-Type', 'application/javascript');
            res.writeHead(200);
            res.end(data);
        });
        return;
    }

    if (pathname === '/style.css') {
        fs.readFile(path.join(__dirname, 'style.css'), (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            res.setHeader('Content-Type', 'text/css');
            res.writeHead(200);
            res.end(data);
        });
        return;
    }

    // Default 404
    res.writeHead(404);
    res.end('Page not found');
});

// Start server
server.listen(PORT, async () => {
    console.log(`✅ Farm Manager TEST SERVER running at http://localhost:${PORT}/`);
    console.log(`🧪 Mode: Test (using mock data)`);
    console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
    console.log(`📊 Database: Mock data (no real database connection)`);
    console.log(`🌐 Web Interface: http://localhost:${PORT}/`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
    
    // Send Discord notification if configured
    await sendDiscordNotification(
        "🧪 Farm Manager Test Server",
        `Farm Manager test server is now running!\n\n` +
        `🌐 **Server URL:** http://localhost:${PORT}/\n` +
        `🧪 **Mode:** Test (Mock Data)\n` +
        `🔧 **Features:** Client Launcher, Account Management (Mock)\n` +
        `⏰ **Started:** ${new Date().toLocaleString()}`,
        0x00ff00 // Green color
    );
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down test server...');
    
    // Send Discord shutdown notification
    await sendDiscordNotification(
        "🛑 Farm Manager Test Server",
        `Farm Manager test server is shutting down...\n\n` +
        `⏰ **Shutdown Time:** ${new Date().toLocaleString()}\n` +
        `🧪 **Mode:** Test completed`,
        0xff0000 // Red color
    );
    
    server.close(() => {
        console.log('✅ Test server closed');
        process.exit(0);
    });
});

console.log('🚀 Starting Farm Manager Test Server...'); 