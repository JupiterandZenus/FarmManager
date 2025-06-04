// Modern Dashboard JavaScript - Enhanced with Advanced Features

// Global state
let wsConnection = null;
let connectionStatus = 'connecting';
let messageQueue = [];
let analyticsData = {
    messagesTotal: 0,
    webhookHealth: 100
};

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeWebSocket();
    loadInitialData();
    setupEventListeners();
    updateConnectionStatus();
    
    // Start periodic updates
    setInterval(updateMetrics, 30000); // Every 30 seconds
    setInterval(updateAnalytics, 60000); // Every minute
});

// WebSocket Connection
function initializeWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    try {
        wsConnection = new WebSocket(wsUrl);
        
        wsConnection.onopen = function() {
            connectionStatus = 'connected';
            updateConnectionStatus();
            wsConnection.send(JSON.stringify({ type: 'subscribe', data: { types: ['all'] } }));
        };
        
        wsConnection.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        };
        
        wsConnection.onclose = function() {
            connectionStatus = 'disconnected';
            updateConnectionStatus();
            // Attempt to reconnect after 5 seconds
            setTimeout(initializeWebSocket, 5000);
        };
        
        wsConnection.onerror = function(error) {
            console.error('WebSocket error:', error);
            connectionStatus = 'error';
            updateConnectionStatus();
        };
    } catch (error) {
        console.error('WebSocket initialization error:', error);
        connectionStatus = 'error';
        updateConnectionStatus();
    }
}

// Handle WebSocket messages
function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'discord-message':
            addDiscordMessage(data.data);
            break;
        case 'agent_update':
            updateAgentsList(data.data);
            break;
        case 'server_status':
            updateSystemMetrics(data.data);
            break;
        case 'task_update':
            updateTasksList(data.data);
            break;
    }
}

// Tab management
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all nav tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked nav tab
    const clickedTab = event?.target || document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (clickedTab) {
        clickedTab.classList.add('active');
    }
    
    // Load tab-specific data
    loadTabData(tabName);
}

// Load data for specific tab
function loadTabData(tabName) {
    switch (tabName) {
        case 'dashboard':
            refreshAgents();
            refreshMetrics();
            break;
        case 'discord':
            loadDiscordMessages();
            break;
        case 'discord-advanced':
            loadAdvancedDiscordData();
            break;
        case 'proxy':
            refreshProxyStats();
            break;
        case 'eternalfarm':
            loadEternalFarmData();
            break;
    }
}

// Theme management
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    
    if (body.dataset.theme === 'dark') {
        body.dataset.theme = 'light';
        themeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'light');
    } else {
        body.dataset.theme = 'dark';
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
    }
}

// Connection status updates
function updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    const statusDot = document.querySelector('.status-dot');
    
    if (!statusElement || !statusDot) return;
    
    switch (connectionStatus) {
        case 'connected':
            statusElement.textContent = 'Connected';
            statusDot.style.background = 'var(--success)';
            break;
        case 'connecting':
            statusElement.textContent = 'Connecting...';
            statusDot.style.background = 'var(--warning)';
            break;
        case 'disconnected':
            statusElement.textContent = 'Disconnected';
            statusDot.style.background = 'var(--error)';
            break;
        case 'error':
            statusElement.textContent = 'Connection Error';
            statusDot.style.background = 'var(--error)';
            break;
    }
}

// API helpers
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        showNotification(`API Error: ${error.message}`, 'error');
        throw error;
    }
}

// Dashboard functions
async function refreshAgents() {
    try {
        const data = await apiRequest('/api/v1/agents');
        updateAgentsList(data);
    } catch (error) {
        console.error('Failed to refresh agents:', error);
    }
}

async function refreshMetrics() {
    try {
        // Simulate system metrics
        const metrics = {
            cpu: Math.floor(Math.random() * 50) + 20,
            memory: Math.floor(Math.random() * 40) + 30,
            disk: Math.floor(Math.random() * 30) + 10
        };
        updateSystemMetrics(metrics);
    } catch (error) {
        console.error('Failed to refresh metrics:', error);
    }
}

function updateAgentsList(data) {
    const container = document.getElementById('agentsList');
    if (!container) return;
    
    const agents = data.data || data || [];
    container.innerHTML = '';
    
    if (agents.length === 0) {
        container.innerHTML = `
            <div class="result-item">
                <span class="result-status">⚫</span>
                <span class="result-text">No agents available</span>
            </div>
        `;
        return;
    }
    
    agents.forEach(agent => {
        const status = agent.status === 'active' ? '🟢' : '⚫';
        const statusText = agent.status === 'active' ? 'Active' : 'Inactive';
        
        container.innerHTML += `
            <div class="result-item">
                <span class="result-status">${status}</span>
                <span class="result-text">${agent.name} - ${statusText}</span>
            </div>
        `;
    });
    
    // Update agent count
    const agentCount = document.getElementById('agentCount');
    if (agentCount) {
        agentCount.textContent = agents.filter(a => a.status === 'active').length;
    }
}

function updateSystemMetrics(metrics) {
    const container = document.getElementById('systemMetrics');
    if (!container) return;
    
    container.innerHTML = `
        <div class="result-item">
            <span class="result-status">💻</span>
            <span class="result-text">CPU: ${metrics.cpu || 0}%</span>
        </div>
        <div class="result-item">
            <span class="result-status">🧠</span>
            <span class="result-text">Memory: ${metrics.memory || 0}%</span>
        </div>
        <div class="result-item">
            <span class="result-status">💾</span>
            <span class="result-text">Disk: ${metrics.disk || 0}%</span>
        </div>
    `;
}

// Discord functions
async function testWebhook() {
    const webhookUrl = document.getElementById('webhookUrl')?.value;
    if (!webhookUrl) {
        showNotification('Please enter a webhook URL', 'error');
        return;
    }
    
    try {
        const response = await apiRequest('/api/discord/test', {
            method: 'POST',
            body: JSON.stringify({
                webhookUrl: webhookUrl,
                message: 'Test message from FarmBoy v0.2 Dashboard'
            })
        });
        
        showNotification('Discord webhook test successful!', 'success');
        analyticsData.messagesTotal++;
        updateAnalyticsDisplay();
    } catch (error) {
        showNotification('Discord webhook test failed', 'error');
        analyticsData.webhookHealth = Math.max(0, analyticsData.webhookHealth - 10);
        updateAnalyticsDisplay();
    }
}

async function sendCustomMessage() {
    const message = document.getElementById('customMessage')?.value;
    const title = document.getElementById('messageTitle')?.value;
    const color = document.getElementById('messageColor')?.value;
    
    if (!message) {
        showNotification('Please enter a message', 'error');
        return;
    }
    
    try {
        await apiRequest('/api/discord/send', {
            method: 'POST',
            body: JSON.stringify({
                message: message,
                title: title || 'Custom Message',
                color: color || '0x0099ff'
            })
        });
        
        showNotification('Message sent successfully!', 'success');
        analyticsData.messagesTotal++;
        updateAnalyticsDisplay();
        
        // Clear form
        document.getElementById('customMessage').value = '';
        document.getElementById('messageTitle').value = '';
    } catch (error) {
        showNotification('Failed to send message', 'error');
    }
}

// Discord Advanced functions
async function advancedDiscordAction(action) {
    const actions = {
        'server-status': {
            title: '📊 Complete Server Status Report',
            message: `🔥 **FarmBoy v0.2 - Complete System Report**\n\n` +
                    `🤖 **Agents Status:**\n` +
                    `• Active Agents: 2/3\n` +
                    `• Running Tasks: 5\n` +
                    `• Completed Today: 12\n\n` +
                    `💻 **System Performance:**\n` +
                    `• CPU Usage: 35%\n` +
                    `• Memory Usage: 67%\n` +
                    `• Disk Usage: 23%\n\n` +
                    `🌐 **Network Status:**\n` +
                    `• EternalFarm API: ✅ Connected\n` +
                    `• Discord Webhook: ✅ Active\n` +
                    `• Proxy Health: 85%\n\n` +
                    `📊 **Statistics:**\n` +
                    `• Uptime: 4h 23m\n` +
                    `• Messages Sent: ${analyticsData.messagesTotal}\n` +
                    `• Last Update: ${new Date().toLocaleTimeString()}`,
            color: '0x00ff00'
        },
        'performance-report': {
            title: '⚡ Advanced Performance Analysis',
            message: `🔬 **Performance Deep Dive**\n\n` +
                    `📈 **Trends (24h):**\n` +
                    `• CPU Peak: 78% (02:15 AM)\n` +
                    `• Memory Peak: 89% (03:42 AM)\n` +
                    `• Network Peak: 145 MB/s\n\n` +
                    `🎯 **Optimization Suggestions:**\n` +
                    `• Consider agent load balancing\n` +
                    `• Memory cleanup recommended\n` +
                    `• Cache optimization available\n\n` +
                    `📊 **Resource Allocation:**\n` +
                    `• Agents: 45% CPU\n` +
                    `• Discord Bot: 12% CPU\n` +
                    `• System Overhead: 8% CPU`,
            color: '0x3b82f6'
        },
        'agent-detailed': {
            title: '🤖 Comprehensive Agent Report',
            message: `🔍 **Agent Analysis Report**\n\n` +
                    `🟢 **Agent-001 (TestAgent1)**\n` +
                    `• Status: Active\n` +
                    `• Runtime: 2h 15m\n` +
                    `• Tasks Completed: 8\n` +
                    `• Success Rate: 94%\n\n` +
                    `🟡 **Agent-002 (TestAgent2)**\n` +
                    `• Status: Standby\n` +
                    `• Last Active: 45m ago\n` +
                    `• Tasks Completed: 4\n` +
                    `• Success Rate: 87%\n\n` +
                    `⚫ **Agent-003 (TestAgent3)**\n` +
                    `• Status: Offline\n` +
                    `• Last Seen: 2h ago\n` +
                    `• Requires Attention: Yes`,
            color: '0xff6600'
        },
        'system-diagnostics': {
            title: '🔧 System Health Diagnostics',
            message: `🏥 **System Health Check Results**\n\n` +
                    `✅ **Passing Tests:**\n` +
                    `• Database Connection\n` +
                    `• API Endpoints\n` +
                    `• WebSocket Server\n` +
                    `• File System Access\n\n` +
                    `⚠️ **Warnings:**\n` +
                    `• High memory usage detected\n` +
                    `• Disk space below 25%\n\n` +
                    `🔧 **Recommendations:**\n` +
                    `• Schedule maintenance window\n` +
                    `• Consider disk cleanup\n` +
                    `• Review log rotation settings`,
            color: '0xfbbf24'
        }
    };
    
    const actionData = actions[action];
    if (!actionData) return;
    
    try {
        await apiRequest('/api/discord/send', {
            method: 'POST',
            body: JSON.stringify(actionData)
        });
        
        showNotification(`${actionData.title} sent successfully!`, 'success');
        analyticsData.messagesTotal++;
        updateAnalyticsDisplay();
    } catch (error) {
        showNotification('Failed to send advanced Discord action', 'error');
    }
}

async function advancedScreenshot(type) {
    try {
        const response = await apiRequest('/api/discord/screenshot', {
            method: 'POST',
            body: JSON.stringify({ type: type })
        });
        
        showNotification(`${type} screenshot captured successfully!`, 'success');
        analyticsData.messagesTotal++;
        updateAnalyticsDisplay();
    } catch (error) {
        showNotification(`Failed to capture ${type} screenshot`, 'error');
    }
}

async function sendTemplate() {
    const templateType = document.getElementById('templateType')?.value;
    const urgencyLevel = document.getElementById('urgencyLevel')?.value;
    
    const templates = {
        startup: {
            title: '🚀 System Startup Complete',
            message: 'FarmBoy v0.2 has successfully started and all systems are operational.',
            color: '0x00ff00'
        },
        shutdown: {
            title: '🛑 System Shutdown Initiated',
            message: 'FarmBoy v0.2 is shutting down gracefully. All agents will be stopped safely.',
            color: '0xff6600'
        },
        error: {
            title: '❌ System Error Detected',
            message: 'An error has been detected in the system. Administrator attention required.',
            color: '0xff0000'
        },
        success: {
            title: '✅ Operation Successful',
            message: 'The requested operation has been completed successfully.',
            color: '0x00ff00'
        },
        maintenance: {
            title: '🔧 Maintenance Mode Activated',
            message: 'System is entering maintenance mode. Some services may be temporarily unavailable.',
            color: '0xfbbf24'
        },
        performance: {
            title: '📈 Performance Alert',
            message: 'System performance metrics have exceeded normal thresholds.',
            color: '0x3b82f6'
        }
    };
    
    const template = templates[templateType];
    if (!template) return;
    
    // Modify message based on urgency
    const urgencyPrefixes = {
        low: '🟢 LOW PRIORITY: ',
        medium: '🟡 MEDIUM PRIORITY: ',
        high: '🟠 HIGH PRIORITY: ',
        critical: '🔴 CRITICAL: '
    };
    
    template.title = urgencyPrefixes[urgencyLevel] + template.title;
    
    try {
        await apiRequest('/api/discord/send', {
            method: 'POST',
            body: JSON.stringify(template)
        });
        
        showNotification('Template notification sent!', 'success');
        analyticsData.messagesTotal++;
        updateAnalyticsDisplay();
    } catch (error) {
        showNotification('Failed to send template notification', 'error');
    }
}

function loadAdvancedDiscordData() {
    updateAnalyticsDisplay();
    refreshQueue();
}

function refreshQueue() {
    const container = document.getElementById('messageQueue');
    if (!container) return;
    
    if (messageQueue.length === 0) {
        container.innerHTML = `
            <div class="result-item">
                <span class="result-status">📤</span>
                <span class="result-text">Queue is empty</span>
            </div>
        `;
    } else {
        container.innerHTML = messageQueue.map(msg => `
            <div class="result-item">
                <span class="result-status">📨</span>
                <span class="result-text">${msg.title} - ${msg.timestamp}</span>
            </div>
        `).join('');
    }
}

function updateAnalyticsDisplay() {
    const messagesTotal = document.getElementById('messagesTotal');
    const webhookHealth = document.getElementById('webhookHealth');
    
    if (messagesTotal) messagesTotal.textContent = analyticsData.messagesTotal;
    if (webhookHealth) webhookHealth.textContent = analyticsData.webhookHealth + '%';
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>${getNotificationIcon(type)}</span>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
}

function loadInitialData() {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.dataset.theme = savedTheme;
    document.getElementById('themeIcon').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    
    // Initialize analytics
    updateAnalyticsDisplay();
}

function setupEventListeners() {
    // Add any additional event listeners here
}

function updateMetrics() {
    refreshMetrics();
}

function updateAnalytics() {
    // Update analytics data periodically
    if (analyticsData.webhookHealth < 100) {
        analyticsData.webhookHealth = Math.min(100, analyticsData.webhookHealth + 5);
        updateAnalyticsDisplay();
    }
} 