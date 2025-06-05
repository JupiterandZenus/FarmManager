#!/usr/bin/env node

// Local Test Server - runs without database for testing Discord Hooks and Proxy Checker
const express = require('express');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

// Try to load node-fetch, fallback to basic implementation if not available
let fetch;
try {
  fetch = require('node-fetch');
} catch (error) {
  // Basic fetch implementation using https module
  fetch = function(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data))
          });
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  };
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3004;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Mock database for testing
const mockDatabase = {
  proxies: [
    { id: 1, host: '192.168.1.1', port: 8080, type: 'http', username: '', password: '', working: null, last_checked: null },
    { id: 2, host: '10.0.0.1', port: 3128, type: 'https', username: 'user', password: 'pass', working: null, last_checked: null },
    { id: 3, host: '192.168.1.100', port: 1080, type: 'socks5', username: '', password: '', working: null, last_checked: null }
  ],
  agents: [
    { id: 1, name: 'TestAgent1', status: 'active', lastSeen: new Date().toISOString() }
  ]
};

// WebSocket functionality
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('🔌 WebSocket client connected');
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'status',
    data: {
      status: 'connected',
      timestamp: new Date().toISOString(),
      mode: 'local-test'
    }
  }));
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('🔌 WebSocket client disconnected');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
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

// Discord messaging functionality
const discordMessages = [];

function addDiscordMessage(content, color = '#0099ff', title = null, username = 'Farm Manager', avatarUrl = null) {
  const message = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    content,
    color,
    title,
    username,
    avatarUrl
  };
  discordMessages.unshift(message);
  
  // Keep only last 50 messages
  if (discordMessages.length > 50) {
    discordMessages.splice(50);
  }
  
  // Broadcast to WebSocket clients
  broadcastToClients('discord-message', message);
  
  return message;
}

// Real Discord webhook sender
async function sendRealDiscordWebhook(webhookUrl, message, color = 0x00ff00, title = null, username = 'Farm Manager') {
  return new Promise((resolve, reject) => {
    if (!webhookUrl) {
      return reject(new Error('No webhook URL provided'));
    }

    const embed = {
      title: title || 'Farm Manager Alert',
      description: message,
      color: typeof color === 'string' ? parseInt(color.replace('#', '0x')) : color,
      timestamp: new Date().toISOString(),
      footer: {
        text: `Farm Manager Test Server | Port ${PORT}`
      }
    };

    const payload = {
      username: username,
      embeds: [embed]
    };

    try {
      const webhookUrlObj = new URL(webhookUrl);
      const postData = JSON.stringify(payload);

      const options = {
        hostname: webhookUrlObj.hostname,
        port: 443,
        path: webhookUrlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 204) {
            console.log('✅ Real Discord webhook sent successfully');
            resolve({ success: true, status: res.statusCode });
          } else {
            console.log(`⚠️ Discord webhook returned status: ${res.statusCode}`);
            console.log('Response:', responseData);
            resolve({ success: false, status: res.statusCode, response: responseData });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Discord webhook error:', error.message);
        reject(error);
      });

      req.write(postData);
      req.end();
    } catch (error) {
      console.error('❌ Discord webhook URL error:', error.message);
      reject(error);
    }
  });
}

// Basic Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/discord', (req, res) => {
  res.sendFile(path.join(__dirname, 'index-discord.html'));
});

app.get('/production', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard-production.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), mode: 'local-test' });
});

// API Routes
app.get('/api/agents', (req, res) => {
  res.json(mockDatabase.agents);
});

// V1 API Routes for compatibility
app.get('/api/v1/agents', (req, res) => {
  res.json({
    success: true,
    data: mockDatabase.agents,
    pagination: {
      current_page: 1,
      total_pages: 1,
      total_items: mockDatabase.agents.length
    }
  });
});

app.post('/api/v1/agents/sync', (req, res) => {
  res.json({
    success: true,
    message: 'Agents synced successfully',
    agents_count: mockDatabase.agents.length
  });
});

app.get('/api/v1/tasks', (req, res) => {
  const agentId = req.query.agent_id;
  const mockTasks = [
    { 
      id: 1, 
      agent_id: agentId, 
      type: 'script', 
      script_name: 'Test Script', 
      status: 'stopped',
      created_at: new Date().toISOString()
    },
    { 
      id: 2, 
      agent_id: agentId, 
      type: 'script', 
      script_name: 'AI Master', 
      status: 'running',
      created_at: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: mockTasks,
    pagination: {
      current_page: 1,
      total_pages: 1,
      total_items: mockTasks.length
    }
  });
});

app.post('/api/v1/tasks/:taskId/start', (req, res) => {
  const taskId = req.params.taskId;
  res.json({
    success: true,
    message: `Task ${taskId} started successfully`,
    task: {
      id: taskId,
      status: 'running'
    }
  });
});

app.post('/api/v1/tasks/:taskId/stop', (req, res) => {
  const taskId = req.params.taskId;
  res.json({
    success: true,
    message: `Task ${taskId} stopped successfully`,
    task: {
      id: taskId,
      status: 'stopped'
    }
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    mode: 'local-test',
    features: ['discord-hooks', 'proxy-checker'],
    database: 'mock'
  });
});

// Discord API Routes
app.post('/api/discord/test', async (req, res) => {
  const { webhookUrl, message, color, title, username } = req.body;
  
  if (!webhookUrl || !message) {
    return res.status(400).json({ error: 'Webhook URL and message are required' });
  }
  
  try {
    // Send REAL Discord webhook
    const result = await sendRealDiscordWebhook(webhookUrl, message, color, title, username);
    
    // Also add to local log for UI
    addDiscordMessage(message, color, title, username);
    
    res.json({ 
      success: result.success, 
      message: result.success ? 'Real Discord message sent successfully!' : 'Discord webhook failed',
      status: result.status,
      messageId: Date.now()
    });
  } catch (error) {
    console.error('Discord test error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Failed to send Discord webhook'
    });
  }
});

app.post('/api/discord/send', async (req, res) => {
  const { message, color = '#0099ff', title, username = 'Farm Manager', webhookUrl } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  // Use provided webhook URL or default Captain Hook webhook
  const targetWebhook = webhookUrl || 'https://discord.com/api/webhooks/1379651760661991475/lcgRwEj3Y0Hl4bW7DLjm7lfvQ3VnMJzGbstNVYWoDa--xUmzsSCl-NMlNAkC3fJTCqBE';
  
  try {
    // Send REAL Discord webhook
    const result = await sendRealDiscordWebhook(targetWebhook, message, color, title, username);
    
    // Also add to local log for UI
    const discordMessage = addDiscordMessage(message, color, title, username);
    
    res.json({ 
      success: result.success,
      message: result.success ? 'Real Discord message sent successfully!' : 'Discord webhook failed',
      status: result.status,
      messageId: discordMessage.id
    });
  } catch (error) {
    console.error('Discord send error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Failed to send Discord webhook'
    });
  }
});

app.get('/api/discord/messages', (req, res) => {
  res.json(discordMessages);
});

app.post('/api/discord/screenshot', (req, res) => {
  const { type = 'desktop' } = req.body;
  
  // Mock screenshot functionality
  setTimeout(() => {
    const mockScreenshot = {
      success: true,
      filename: `screenshot_${type}_${Date.now()}.png`,
      path: `/screenshots/screenshot_${type}_${Date.now()}.png`,
      size: '1920x1080',
      type: type
    };
    
    addDiscordMessage(
      `📸 Screenshot captured: ${mockScreenshot.filename}`,
      '#00ff00',
      'Screenshot Captured',
      'Farm Manager'
    );
    
    res.json(mockScreenshot);
  }, 1000);
});

// Proxy Checker API Routes
app.post('/api/proxy-checker/test', async (req, res) => {
  const { proxy } = req.body;
  
  if (!proxy || !proxy.host || !proxy.port) {
    return res.status(400).json({ error: 'Valid proxy object with host and port is required' });
  }
  
  // Mock proxy test with random results
  const isWorking = Math.random() > 0.3; // 70% success rate
  const responseTime = Math.floor(Math.random() * 2000) + 100;
  
  const result = {
    proxy: proxy,
    working: isWorking,
    responseTime: isWorking ? responseTime : null,
    error: isWorking ? null : 'Connection timeout',
    location: isWorking ? 'US' : null,
    testedAt: new Date().toISOString()
  };
  
  res.json(result);
});

app.post('/api/proxy-checker/test-batch', async (req, res) => {
  const { proxies } = req.body;
  
  if (!Array.isArray(proxies)) {
    return res.status(400).json({ error: 'Proxies array is required' });
  }
  
  // Mock batch testing
  const results = proxies.map(proxy => {
    const isWorking = Math.random() > 0.3;
    const responseTime = Math.floor(Math.random() * 2000) + 100;
    
    return {
      proxy: proxy,
      working: isWorking,
      responseTime: isWorking ? responseTime : null,
      error: isWorking ? null : 'Connection timeout',
      location: isWorking ? ['US', 'UK', 'DE', 'FR', 'CA'][Math.floor(Math.random() * 5)] : null,
      testedAt: new Date().toISOString()
    };
  });
  
  const summary = {
    total: results.length,
    working: results.filter(r => r.working).length,
    failed: results.filter(r => !r.working).length,
    averageResponseTime: results
      .filter(r => r.working)
      .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.working).length || 0
  };
  
  res.json({ results, summary });
});

app.post('/api/proxy-checker/test-all', async (req, res) => {
  // Test all mock database proxies
  const results = mockDatabase.proxies.map(proxy => {
    const isWorking = Math.random() > 0.3;
    const responseTime = Math.floor(Math.random() * 2000) + 100;
    
    // Update mock database
    proxy.working = isWorking;
    proxy.last_checked = new Date().toISOString();
    
    return {
      proxy: proxy,
      working: isWorking,
      responseTime: isWorking ? responseTime : null,
      error: isWorking ? null : 'Connection timeout',
      location: isWorking ? ['US', 'UK', 'DE', 'FR', 'CA'][Math.floor(Math.random() * 5)] : null,
      testedAt: new Date().toISOString()
    };
  });
  
  const summary = {
    total: results.length,
    working: results.filter(r => r.working).length,
    failed: results.filter(r => !r.working).length,
    averageResponseTime: results
      .filter(r => r.working)
      .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.working).length || 0
  };
  
  res.json({ results, summary });
});

app.get('/api/proxy-checker/stats', (req, res) => {
  const workingProxies = mockDatabase.proxies.filter(p => p.working === true).length;
  const failedProxies = mockDatabase.proxies.filter(p => p.working === false).length;
  const untestedProxies = mockDatabase.proxies.filter(p => p.working === null).length;
  
  res.json({
    total: mockDatabase.proxies.length,
    working: workingProxies,
    failed: failedProxies,
    untested: untestedProxies,
    lastUpdated: new Date().toISOString()
  });
});

// EternalFarm API Routes
app.post('/api/eternalfarm/test', async (req, res) => {
  const { agentKey, apiUrl } = req.body;
  
  if (!agentKey) {
    return res.status(400).json({ success: false, error: 'Agent key is required' });
  }
  
  try {
    // Test the actual EternalFarm API
    const testUrl = `${apiUrl || 'https://api.eternalfarm.net'}/agents`;
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${agentKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      res.json({
        success: true,
        message: 'EternalFarm API connection successful',
        status: response.status,
        agentCount: Array.isArray(data) ? data.length : 0
      });
    } else {
      res.json({
        success: false,
        error: `API returned status ${response.status}`,
        message: 'EternalFarm API connection failed'
      });
    }
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      message: 'Failed to connect to EternalFarm API'
    });
  }
});

app.get('/api/eternalfarm/agents', async (req, res) => {
  const agentKey = req.headers.authorization?.replace('Bearer ', '') || 
                   'RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5';
  
  try {
    const response = await fetch('https://api.eternalfarm.net/agents', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${agentKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      res.json(data);
    } else {
      // Return mock data if API fails
      res.json([
        { id: 1, name: 'Agent-001', status: 'active', lastSeen: new Date().toISOString() },
        { id: 2, name: 'Agent-002', status: 'offline', lastSeen: new Date(Date.now() - 3600000).toISOString() }
      ]);
    }
  } catch (error) {
    // Return mock data if API fails
    res.json([
      { id: 1, name: 'Agent-001 (Mock)', status: 'active', lastSeen: new Date().toISOString() },
      { id: 2, name: 'Agent-002 (Mock)', status: 'offline', lastSeen: new Date(Date.now() - 3600000).toISOString() }
    ]);
  }
});

app.post('/api/eternalfarm/sync', async (req, res) => {
  try {
    // Mock sync operation
    setTimeout(() => {
      res.json({
        success: true,
        message: 'Agents synced successfully',
        synced: 2,
        updated: 1,
        created: 0
      });
    }, 1000);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Settings API Routes
app.get('/api/settings', (req, res) => {
  res.json({
    webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
    agentKey: process.env.ETERNALFARM_AGENT_KEY || '',
    apiUrl: process.env.ETERNAL_API_URL || 'https://api.eternalfarm.net',
    theme: 'dark',
    refreshInterval: 10000
  });
});

app.post('/api/settings', (req, res) => {
  // In production, this would save to database or environment
  res.json({
    success: true,
    message: 'Settings saved successfully'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(PORT, () => {
  console.log('🟢 Local Test Server Started');
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server running at: ws://localhost:${PORT}`);
  console.log('📋 Features available:');
  console.log('   ✅ Discord Hooks Management');
  console.log('   ✅ Proxy Checker');
  console.log('   ✅ Mock Database');
  console.log('   ✅ WebSocket Support');
  console.log('   ⚠️  Database: Mock mode (no real DB connection required)');
  console.log('\n🚀 Ready for testing!');
  
  // Add some initial Discord messages
  addDiscordMessage('✅ Local test server started successfully', '#00ff00', 'Server Status', 'Farm Manager');
  addDiscordMessage('🔧 Mock database initialized with test data', '#0099ff', 'Database Status', 'Farm Manager');
  addDiscordMessage('🔌 WebSocket server initialized', '#9f39ff', 'WebSocket Status', 'Farm Manager');
}); 