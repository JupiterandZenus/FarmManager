const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { exec } = require('child_process');
const { PrismaClient } = require('./generated/prisma');
const WebSocket = require('ws');
const fetch = require('node-fetch');
const os = require('os');

// Enhanced task handlers with bot launching
const { createTaskStartHandler, createTaskStopHandler } = require('./enhanced-task-handler');

// Load environment variables from config.env FIRST
require('dotenv').config({ path: './config.env' });

// API Configuration
const API_KEY = process.env.API_KEY || "rBoolrmakSG77Ol5CidsnWvmdyvjpzXfppuR0J4e-LYtn2zZLABzIyJVn5TeHpuv";
const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// EternalFarm API Configuration
const ETERNALFARM_AGENT_KEY = process.env.ETERNALFARM_AGENT_KEY;
const ETERNAL_API_URL = process.env.ETERNAL_API_URL || "https://api.eternalfarm.net";

// WebSocket clients storage
const wsClients = new Set();

// Uptime tracking
const UPTIME_START = Date.now();

// Initialize Prisma Client
const prisma = new PrismaClient();

// WebSocket broadcast function
function broadcastToClients(type, data) {
    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
    console.log(`📡 Broadcasting ${type} update to ${wsClients.size} clients`);
}

// Enhanced Discord notification function with rich embeds
async function sendDiscordNotification(title, message, color = 0x00ff00, status = "🟢 Online", stats = null, imageUrl = null, webhookUrl = null) {
    const hookUrl = webhookUrl || DISCORD_WEBHOOK_URL;
    if (!hookUrl) {
        console.log('⚠️ Discord webhook URL not configured');
        return;
    }

    const fields = [
        {
            name: "Server",
            value: `http://localhost:${PORT}`,
            inline: true
        },
        {
            name: "Status",
            value: status,
            inline: true
        }
    ];

    // Add system stats if available
    if (stats) {
        fields.push(
            {
                name: "🤖 Agents",
                value: `Total: ${stats.agents.total}\nOnline: ${stats.agents.online}\nOffline: ${stats.agents.offline}`,
                inline: true
            },
            {
                name: "💻 System",
                value: `CPU: ${Math.round(stats.agents.average_cpu)}%\nMem: ${Math.round(stats.agents.average_memory)}%`,
                inline: true
            },
            {
                name: "📊 Tasks",
                value: `Total: ${stats.accounts.total}\nCompleted: ${stats.accounts.completed_tasks}`,
                inline: true
            }
        );
    }

    const embed = {
        title: title,
        description: message,
        color: color,
        timestamp: new Date().toISOString(),
        footer: {
            text: `Farm Manager v0.2 | Uptime: ${formatUptime(process.uptime())}`
        },
        fields: fields
    };

    // Add image if provided
    if (imageUrl) {
        embed.image = { url: imageUrl };
    }

    const payload = {
        username: "Farm Manager",
        avatar_url: "https://i.imgur.com/your-farm-logo.png", // Replace with your logo
        embeds: [embed]
    };

    try {
        const webhookUrlObj = new URL(hookUrl);
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

// Helper function to format uptime
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.join(' ') || '< 1m';
}

// Function to validate API key
function validateApiKey(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }
    const providedKey = authHeader.split(' ')[1];
    return providedKey === API_KEY;
}

// Function to handle pagination
function getPaginationParams(query) {
    const page = parseInt(query.page) || 1;
    const perPage = parseInt(query.per_page) || 10;
    return { page, perPage };
}

// Function to handle filters
function getFilters(query) {
    const filters = {};
    if (query.account_category_id) filters.account_category_id = query.account_category_id;
    if (query.country_code) filters.country_code = query.country_code;
    if (query.proxy_category_id) filters.proxy_category_id = query.proxy_category_id;
    return filters;
}

// Database connection test
async function testDatabaseConnection() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Function to fetch agents from EternalFarm API
async function fetchEternalFarmAgents() {
    if (!ETERNALFARM_AGENT_KEY) {
        console.log('⚠️ EternalFarm agent key not configured');
        return [];
    }

    try {
        console.log(`🕵️ DEBUG: ETERNAL_API_URL value: "${ETERNAL_API_URL}"`); // Debug log for ETERNAL_API_URL
        const url = `${ETERNAL_API_URL}/v1/agents`; // Fixed: Use /v1/agents for cloud API (not /api/v1/agents)
        console.log(`🔍 Fetching agents from EternalFarm API: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ETERNALFARM_AGENT_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`EternalFarm API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Fetched ${data.data ? data.data.length : 0} agents from EternalFarm API`);
        return data.data || [];
    } catch (error) {
        console.error('❌ Error fetching EternalFarm agents:', error.message);
        return [];
    }
}

// Function to sync agents with database
async function syncAgentsWithDatabase() {
    try {
        const eternalFarmAgents = await fetchEternalFarmAgents();
        
        if (eternalFarmAgents.length === 0) {
            console.log('⚠️ No agents received from EternalFarm API');
            return;
        }

        // Update or create agents in database
        for (const agentData of eternalFarmAgents) {
            await prisma.agent.upsert({
                where: { name: agentData.name },
                update: {
                    status: agentData.status || 'offline',
                    last_seen: agentData.last_seen ? new Date(agentData.last_seen) : null,
                    ip_address: agentData.ip_address,
                    updated_at: new Date()
                },
                create: {
                    name: agentData.name,
                    status: agentData.status || 'offline',
                    last_seen: agentData.last_seen ? new Date(agentData.last_seen) : null,
                    ip_address: agentData.ip_address,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });
        }

        console.log(`✅ Synced ${eternalFarmAgents.length} agents with database`);
        
        // Broadcast agent update to WebSocket clients
        broadcastToClients('agents_updated', { 
            count: eternalFarmAgents.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error syncing agents with database:', error.message);
    }
}

// =================== API COLLECTOR AND UPDATER SYSTEM ===================

// Function to push agent updates to EternalFarm API
async function pushAgentUpdateToEternalFarm(agentId, updateData) {
    if (!ETERNALFARM_AGENT_KEY) {
        console.log('⚠️ EternalFarm agent key not configured - cannot push updates');
        return { success: false, error: 'API key not configured' };
    }

    try {
        const url = `${ETERNAL_API_URL}/v1/agents/${agentId}`;
        console.log(`📤 Pushing agent update to EternalFarm API: ${url}`);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${ETERNALFARM_AGENT_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`EternalFarm API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`✅ Successfully pushed agent update to EternalFarm API`);
        return { success: true, data };
    } catch (error) {
        console.error('❌ Error pushing agent update to EternalFarm:', error.message);
        return { success: false, error: error.message };
    }
}

// Function to create new agent in EternalFarm API
async function createAgentInEternalFarm(agentData) {
    if (!ETERNALFARM_AGENT_KEY) {
        console.log('⚠️ EternalFarm agent key not configured - cannot create agent');
        return { success: false, error: 'API key not configured' };
    }

    try {
        const url = `${ETERNAL_API_URL}/v1/agents`;
        console.log(`📤 Creating new agent in EternalFarm API: ${url}`);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ETERNALFARM_AGENT_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(agentData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`EternalFarm API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`✅ Successfully created agent in EternalFarm API`);
        return { success: true, data };
    } catch (error) {
        console.error('❌ Error creating agent in EternalFarm:', error.message);
        return { success: false, error: error.message };
    }
}

// Function to delete agent from EternalFarm API
async function deleteAgentFromEternalFarm(agentId) {
    if (!ETERNALFARM_AGENT_KEY) {
        console.log('⚠️ EternalFarm agent key not configured - cannot delete agent');
        return { success: false, error: 'API key not configured' };
    }

    try {
        const url = `${ETERNAL_API_URL}/v1/agents/${agentId}`;
        console.log(`🗑️ Deleting agent from EternalFarm API: ${url}`);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${ETERNALFARM_AGENT_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`EternalFarm API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        console.log(`✅ Successfully deleted agent from EternalFarm API`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error deleting agent from EternalFarm:', error.message);
        return { success: false, error: error.message };
    }
}

// Function to sync local database changes back to EternalFarm API
async function pushPendingChangesToEternalFarm() {
    if (!ETERNALFARM_AGENT_KEY) {
        console.log('⚠️ EternalFarm agent key not configured - skipping push sync');
        return;
    }

    try {
        console.log('🔄 Checking for pending changes to push to EternalFarm API...');
        
        // Find agents that have been modified locally and need to be synced
        const modifiedAgents = await prisma.agent.findMany({
            where: {
                needs_sync: true
            }
        });

        if (modifiedAgents.length === 0) {
            console.log('✅ No pending changes to push to EternalFarm API');
            return;
        }

        console.log(`📤 Found ${modifiedAgents.length} agents with pending changes to sync`);

        for (const agent of modifiedAgents) {
            try {
                const updateData = {
                    name: agent.name,
                    status: agent.status,
                    ip_address: agent.ip_address,
                    last_seen: agent.last_seen?.toISOString(),
                    cpu_usage: agent.cpu_usage,
                    memory_usage: agent.memory_usage,
                    disk_usage: agent.disk_usage
                };

                const result = await pushAgentUpdateToEternalFarm(agent.eternal_farm_id, updateData);
                
                if (result.success) {
                    // Mark agent as synced
                    await prisma.agent.update({
                        where: { id: agent.id },
                        data: { 
                            needs_sync: false,
                            last_synced: new Date()
                        }
                    });
                    console.log(`✅ Synced agent "${agent.name}" to EternalFarm API`);
                } else {
                    console.error(`❌ Failed to sync agent "${agent.name}": ${result.error}`);
                }
            } catch (error) {
                console.error(`❌ Error syncing agent "${agent.name}":`, error.message);
            }
        }

        // Broadcast sync completion to WebSocket clients
        broadcastToClients('sync_completed', {
            synced_count: modifiedAgents.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error in pushPendingChangesToEternalFarm:', error.message);
    }
}

// Function to collect and aggregate system statistics
async function collectSystemStatistics() {
    try {
        console.log('📊 Collecting system statistics...');
        
        const [agents, accounts, totalTasks] = await Promise.all([
            prisma.agent.findMany({
                select: {
                    id: true,
                    name: true,
                    status: true,
                    cpu_usage: true,
                    memory_usage: true,
                    disk_usage: true,
                    last_seen: true
                }
            }),
            prisma.account.count(),
            prisma.account.count({
                where: {
                    status: 'completed'
                }
            })
        ]);

        const statistics = {
            timestamp: new Date().toISOString(),
            agents: {
                total: agents.length,
                online: agents.filter(a => a.status === 'online').length,
                offline: agents.filter(a => a.status === 'offline').length,
                average_cpu: agents.reduce((sum, a) => sum + (a.cpu_usage || 0), 0) / agents.length || 0,
                average_memory: agents.reduce((sum, a) => sum + (a.memory_usage || 0), 0) / agents.length || 0,
                average_disk: agents.reduce((sum, a) => sum + (a.disk_usage || 0), 0) / agents.length || 0
            },
            accounts: {
                total: accounts,
                completed_tasks: totalTasks
            },
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                connected_clients: wsClients.size
            }
        };

        // Broadcast statistics to WebSocket clients
        broadcastToClients('system_statistics', statistics);
        
        return statistics;
    } catch (error) {
        console.error('❌ Error collecting system statistics:', error.message);
        return null;
    }
}

// Function to perform comprehensive bi-directional sync
async function performBidirectionalSync() {
    try {
        console.log('🔄 Starting bi-directional sync with EternalFarm API...');
        
        // Step 1: Pull latest data from EternalFarm API
        await syncAgentsWithDatabase();
        
        // Step 2: Push local changes to EternalFarm API
        await pushPendingChangesToEternalFarm();
        
        // Step 3: Collect and broadcast system statistics
        await collectSystemStatistics();
        
        console.log('✅ Bi-directional sync completed successfully');
        
        // Send Discord notification for successful sync (only every hour to avoid spam)
        const now = new Date();
        if (now.getMinutes() === 0) { // Only on the hour
            await sendDiscordNotification(
                "🔄 Farm Manager 0.1 - Sync Completed",
                `Bi-directional sync with EternalFarm API completed successfully!\n\n` +
                `⏰ **Sync Time:** ${now.toLocaleString()}\n` +
                `📊 **Status:** All systems operational\n` +
                `🌐 **Server URL:** http://localhost:${PORT}/`,
                0x00ff00 // Green color
            );
        }
        
    } catch (error) {
        console.error('❌ Error in bi-directional sync:', error.message);
        
        await sendDiscordNotification(
            "⚠️ Farm Manager 0.1 - Sync Error",
            `Error during bi-directional sync with EternalFarm API!\n\n` +
            `⏰ **Error Time:** ${new Date().toLocaleString()}\n` +
            `📊 **Error:** ${error.message}\n` +
            `🌐 **Server URL:** http://localhost:${PORT}/`,
            0xff9900 // Orange color for warnings
        );
    }
}

// =================== END API COLLECTOR AND UPDATER SYSTEM ===================

// Function to get local IP address
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        const interfaceInfo = interfaces[interfaceName];
        for (const alias of interfaceInfo) {
            if (alias.family === 'IPv4' && !alias.internal && alias.address !== '127.0.0.1') {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

// =============================================================================
// CONFIGURATION MANAGEMENT HELPER FUNCTIONS
// =============================================================================

// Function to write configuration to environment file
async function writeConfigToFile(config) {
    return new Promise((resolve, reject) => {
        try {
            const envPath = path.join(__dirname, 'config.env');
            let envContent = '';

            // Read existing environment file
            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, 'utf8');
            }

            // Update or add configuration values
            const updateEnvVar = (key, value) => {
                if (value !== undefined && value !== '') {
                    const regex = new RegExp(`^${key}=.*$`, 'm');
                    const line = `${key}=${value}`;
                    if (regex.test(envContent)) {
                        envContent = envContent.replace(regex, line);
                    } else {
                        envContent += `\n${line}`;
                    }
                }
            };

            // Update EternalFarm configuration
            if (config.eternalfarm) {
                updateEnvVar('ETERNALFARM_AGENT_KEY', config.eternalfarm.apiKey);
                updateEnvVar('ETERNAL_API_URL', config.eternalfarm.apiUrl);
                updateEnvVar('AUTH_AGENT_KEY', config.eternalfarm.apiKey);
            }

            // Update DreamBot configuration
            if (config.dreambot) {
                updateEnvVar('DREAMBOT_USERNAME', config.dreambot.username);
                updateEnvVar('DREAMBOT_PASSWORD', config.dreambot.password);
                updateEnvVar('DREAMBOT_SCRIPT', config.dreambot.script);
                updateEnvVar('DREAMBOT_WORLD', config.dreambot.world);
            }

            // Update Discord configuration
            if (config.discord) {
                updateEnvVar('DISCORD_WEBHOOK_URL', config.discord.webhookUrl);
            }

            // Write the updated content back to file
            fs.writeFileSync(envPath, envContent.trim() + '\n');
            console.log('✅ Configuration written to config.env file');
            resolve();
        } catch (error) {
            console.error('❌ Error writing configuration to file:', error);
            reject(error);
        }
    });
}

// Function to generate DreamBot settings.json
async function generateDreamBotSettings(dreambotConfig) {
    return new Promise((resolve, reject) => {
        try {
            const settingsPath = path.join(__dirname, 'dreambot-settings.json');
            
            const settings = {
                "username": dreambotConfig.username,
                "password": dreambotConfig.password,
                "world": dreambotConfig.world || 301,
                "script": dreambotConfig.script || "",
                "enableAntiDetection": true,
                "enableRandomization": true,
                "humanMouseMovement": true,
                "variableDelays": true,
                "randomBreaks": true,
                "proxyRotation": true,
                "clientTitle": `FarmBot-${dreambotConfig.username}`,
                "lowCpuMode": false,
                "enableLogging": true,
                "autoRestart": true,
                "maxRuntime": 21600000, // 6 hours in milliseconds
                "breakSettings": {
                    "enabled": true,
                    "minBreakTime": 300000, // 5 minutes
                    "maxBreakTime": 1800000, // 30 minutes
                    "breakFrequency": 7200000 // 2 hours
                },
                "mouseSettings": {
                    "humanLike": true,
                    "mouseSpeed": "MEDIUM",
                    "randomMovement": true
                },
                "keyboardSettings": {
                    "humanTyping": true,
                    "typingSpeed": "MEDIUM",
                    "typos": true
                }
            };

            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
            console.log('✅ DreamBot settings.json generated successfully');
            resolve();
        } catch (error) {
            console.error('❌ Error generating DreamBot settings:', error);
            reject(error);
        }
    });
}

// Function to restart services via supervisord
async function restartServices() {
    return new Promise((resolve, reject) => {
        try {
            console.log('🔄 Restarting services...');
            
            // Use supervisorctl to restart specific services
            const servicesToRestart = [
                'eternalfarm-agent',
                'eternalfarm-checker', 
                'eternalfarm-browser-automator'
            ];

            let restartCount = 0;
            const totalServices = servicesToRestart.length;

            servicesToRestart.forEach(service => {
                exec(`supervisorctl restart ${service}`, (error, stdout, stderr) => {
                    restartCount++;
                    
                    if (error) {
                        console.log(`⚠️ Service ${service} restart: ${error.message}`);
                    } else {
                        console.log(`✅ Service ${service} restarted: ${stdout.trim()}`);
                    }
                    
                    // Resolve when all services have been processed
                    if (restartCount === totalServices) {
                        console.log('🚀 All services restart commands completed');
                        resolve();
                    }
                });
            });

            // If no services to restart, resolve immediately
            if (totalServices === 0) {
                console.log('⚠️ No services configured for restart');
                resolve();
            }

        } catch (error) {
            console.error('❌ Error restarting services:', error);
            reject(error);
        }
    });
}

// =============================================================================
// DISCORD HOOKS AND SCREENSHOT FUNCTIONALITY
// =============================================================================

// Global variable to store Discord webhook configuration
let discordConfig = {
    webhookUrl: DISCORD_WEBHOOK_URL || '',
    channelName: 'farm-alerts',
    botName: 'Farm Manager',
    messageLog: []
};

// Screenshot functionality using system commands
async function takeScreenshot(type = 'desktop') {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `/tmp/screenshot-${type}-${timestamp}.png`;
        
        let command;
        switch (type) {
            case 'vnc':
                // Take screenshot of VNC display
                command = `DISPLAY=:1 xwd -root | convert xwd:- png:${filename}`;
                break;
            case 'web':
                // Use puppeteer for web interface screenshot
                return takeWebScreenshot().then(resolve).catch(reject);
            case 'full':
            case 'desktop':
            default:
                // Take screenshot of main desktop
                command = `DISPLAY=:0 xwd -root | convert xwd:- png:${filename} || DISPLAY=:1 xwd -root | convert xwd:- png:${filename}`;
                break;
        }
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Screenshot error: ${error.message}`);
                reject(error);
                return;
            }
            
            // Check if file was created
            if (fs.existsSync(filename)) {
                console.log(`✅ Screenshot saved: ${filename}`);
                resolve(filename);
            } else {
                reject(new Error('Screenshot file was not created'));
            }
        });
    });
}

// Web interface screenshot using puppeteer
async function takeWebScreenshot() {
    try {
        const puppeteer = require('puppeteer');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        const localUrl = `http://localhost:${PORT}`;
        await page.goto(localUrl, { waitUntil: 'networkidle0' });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `/tmp/screenshot-web-${timestamp}.png`;
        
        await page.screenshot({ 
            path: filename, 
            fullPage: true,
            quality: 90 
        });
        
        await browser.close();
        console.log(`✅ Web screenshot saved: ${filename}`);
        return filename;
        
    } catch (error) {
        console.error('Web screenshot error:', error);
        throw error;
    }
}

// Upload screenshot to a temporary image host (for Discord)
async function uploadScreenshot(filename) {
    try {
        // For now, we'll convert to base64 and return it
        // In production, you might want to upload to imgur, cloudinary, etc.
        const imageBuffer = fs.readFileSync(filename);
        const base64Image = imageBuffer.toString('base64');
        const dataUrl = `data:image/png;base64,${base64Image}`;
        
        // Clean up the temporary file
        fs.unlinkSync(filename);
        
        return dataUrl;
    } catch (error) {
        console.error('Upload screenshot error:', error);
        throw error;
    }
}

// Enhanced Discord notification with screenshot support
async function sendDiscordMessage(options = {}) {
    const {
        title = 'Farm Manager Update',
        message = '',
        color = 0x00ff00,
        includeStats = false,
        includeTimestamp = true,
        screenshot = null,
        webhookUrl = null
    } = options;
    
    let stats = null;
    if (includeStats) {
        stats = await collectSystemStatistics();
    }
    
    let imageUrl = null;
    if (screenshot) {
        try {
            imageUrl = await uploadScreenshot(screenshot);
        } catch (error) {
            console.error('Failed to upload screenshot:', error);
        }
    }
    
    const result = await sendDiscordNotification(
        title,
        message,
        color,
        "🟢 Online",
        stats,
        imageUrl,
        webhookUrl
    );
    
    // Log the message
    const logEntry = {
        timestamp: new Date().toISOString(),
        title,
        message,
        color,
        includeStats,
        success: !!result
    };
    
    discordConfig.messageLog.unshift(logEntry);
    
    // Keep only last 50 messages
    if (discordConfig.messageLog.length > 50) {
        discordConfig.messageLog = discordConfig.messageLog.slice(0, 50);
    }
    
    // Broadcast to WebSocket clients
    broadcastToClients('discord-message-sent', logEntry);
    
    return result;
}

// Test Discord webhook
async function testDiscordWebhook(webhookUrl) {
    try {
        const testResult = await sendDiscordNotification(
            '🧪 Discord Webhook Test',
            'This is a test message from Farm Manager. If you can see this, the webhook is working correctly!',
            0x0099ff,
            "🧪 Testing",
            null,
            null,
            webhookUrl
        );
        
        return { success: true, message: 'Test message sent successfully!' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// =============================================================================
// PROXY CHECKER FUNCTIONALITY
// =============================================================================

// Try to load proxy dependencies, fallback to built-in modules if not available
let axios, SocksProxyAgent, HttpsProxyAgent, HttpProxyAgent;
let useAdvancedProxyTesting = true;

try {
    axios = require('axios');
    ({ SocksProxyAgent } = require('socks-proxy-agent'));
    ({ HttpsProxyAgent } = require('https-proxy-agent'));
    ({ HttpProxyAgent } = require('http-proxy-agent'));
    console.log('✅ Advanced proxy testing modules loaded');
} catch (error) {
    console.log('⚠️ Advanced proxy modules not available, using basic testing');
    useAdvancedProxyTesting = false;
}

const net = require('net');

// Basic proxy checker using built-in modules
async function checkProxyBasic(proxyConfig, testOptions = {}) {
    const { host, port, type = 'http' } = proxyConfig;
    const { timeout = 10000 } = testOptions;
    
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const result = {
            proxy: `${type}://${host}:${port}`,
            working: false,
            responseTime: null,
            ip: null,
            location: null,
            error: null,
            testDetails: {
                testType: 'basic_tcp',
                timestamp: new Date().toISOString()
            }
        };
        
        const socket = new net.Socket();
        
        const timer = setTimeout(() => {
            socket.destroy();
            result.error = 'Connection timeout';
            resolve(result);
        }, timeout);
        
        socket.connect(port, host, () => {
            const endTime = Date.now();
            result.responseTime = endTime - startTime;
            result.working = true;
            clearTimeout(timer);
            socket.destroy();
            resolve(result);
        });
        
        socket.on('error', (error) => {
            clearTimeout(timer);
            result.error = error.message;
            if (error.code === 'ECONNREFUSED') {
                result.error = 'Connection refused - proxy server not responding';
            } else if (error.code === 'ETIMEDOUT') {
                result.error = 'Connection timeout - proxy server too slow or unreachable';
            } else if (error.code === 'ENOTFOUND') {
                result.error = 'Host not found - check proxy address';
            }
            socket.destroy();
            resolve(result);
        });
    });
}

// Proxy checker with comprehensive testing
async function checkProxy(proxyConfig, testOptions = {}) {
    // Use basic testing if advanced modules are not available
    if (!useAdvancedProxyTesting) {
        return await checkProxyBasic(proxyConfig, testOptions);
    }
    const {
        host,
        port,
        username,
        password,
        type = 'http'
    } = proxyConfig;
    
    const {
        timeout = 10000,
        testUrl = 'https://httpbin.org/ip',
        checkLocation = true,
        checkSpeed = true
    } = testOptions;
    
    const results = {
        proxy: `${type}://${host}:${port}`,
        working: false,
        responseTime: null,
        ip: null,
        location: null,
        error: null,
        testDetails: {}
    };
    
    try {
        const startTime = Date.now();
        
        // Create proxy agent based on type
        let agent;
        const proxyUrl = username && password ? 
            `${type}://${username}:${password}@${host}:${port}` :
            `${type}://${host}:${port}`;
            
        switch (type.toLowerCase()) {
            case 'socks4':
            case 'socks5':
                agent = new SocksProxyAgent(proxyUrl);
                break;
            case 'https':
                agent = new HttpsProxyAgent(proxyUrl);
                break;
            case 'http':
            default:
                agent = new HttpProxyAgent(proxyUrl);
                break;
        }
        
        // Test basic connectivity
        const response = await axios.get(testUrl, {
            httpsAgent: agent,
            httpAgent: agent,
            timeout: timeout,
            headers: {
                'User-Agent': 'Farm-Manager-Proxy-Checker/1.0'
            }
        });
        
        const endTime = Date.now();
        results.responseTime = endTime - startTime;
        results.working = true;
        
        // Extract IP from response
        if (response.data && response.data.origin) {
            results.ip = response.data.origin.split(',')[0].trim();
        }
        
        // Get location info if requested
        if (checkLocation && results.ip) {
            try {
                const locationResponse = await axios.get(`http://ip-api.com/json/${results.ip}`, {
                    timeout: 5000
                });
                
                if (locationResponse.data.status === 'success') {
                    results.location = {
                        country: locationResponse.data.country,
                        countryCode: locationResponse.data.countryCode,
                        region: locationResponse.data.regionName,
                        city: locationResponse.data.city,
                        isp: locationResponse.data.isp,
                        timezone: locationResponse.data.timezone
                    };
                }
            } catch (locationError) {
                console.log('Location lookup failed:', locationError.message);
            }
        }
        
        // Additional speed test if requested
        if (checkSpeed && results.working) {
            try {
                const speedTestStart = Date.now();
                await axios.get('https://httpbin.org/bytes/1024', {
                    httpsAgent: agent,
                    httpAgent: agent,
                    timeout: timeout
                });
                const speedTestEnd = Date.now();
                results.testDetails.downloadSpeed = Math.round(1024 / ((speedTestEnd - speedTestStart) / 1000)); // bytes per second
            } catch (speedError) {
                console.log('Speed test failed:', speedError.message);
            }
        }
        
        results.testDetails = {
            ...results.testDetails,
            statusCode: response.status,
            testUrl: testUrl,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        results.working = false;
        results.error = error.message;
        
        // Categorize common errors
        if (error.code === 'ECONNREFUSED') {
            results.error = 'Connection refused - proxy server not responding';
        } else if (error.code === 'ETIMEDOUT') {
            results.error = 'Connection timeout - proxy server too slow or unreachable';
        } else if (error.code === 'ENOTFOUND') {
            results.error = 'Host not found - check proxy address';
        } else if (error.response && error.response.status === 407) {
            results.error = 'Proxy authentication required - check username/password';
        }
    }
    
    return results;
}

// Batch proxy checker
async function checkMultipleProxies(proxies, testOptions = {}) {
    const { concurrent = 5 } = testOptions;
    const results = [];
    
    // Process proxies in batches to avoid overwhelming the system
    for (let i = 0; i < proxies.length; i += concurrent) {
        const batch = proxies.slice(i, i + concurrent);
        const batchPromises = batch.map(proxy => checkProxy(proxy, testOptions));
        
        try {
            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push({
                        ...result.value,
                        originalIndex: i + index
                    });
                } else {
                    results.push({
                        proxy: `${batch[index].type || 'http'}://${batch[index].host}:${batch[index].port}`,
                        working: false,
                        error: result.reason.message,
                        originalIndex: i + index
                    });
                }
            });
        } catch (error) {
            console.error('Batch proxy check error:', error);
        }
        
        // Add small delay between batches to be respectful
        if (i + concurrent < proxies.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    return results;
}

// Get proxy health statistics
async function getProxyHealthStats() {
    try {
        const proxies = await prisma.proxy.findMany();
        
        const stats = {
            total: proxies.length,
            active: proxies.filter(p => p.is_active).length,
            inactive: proxies.filter(p => !p.is_active).length,
            byType: {},
            byCategory: {},
            lastChecked: null
        };
        
        // Count by type
        proxies.forEach(proxy => {
            const type = proxy.type || 'unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });
        
        // Count by category
        const categoryCounts = await prisma.proxy.groupBy({
            by: ['category_id'],
            _count: { id: true },
            include: {
                category: true
            }
        });
        
        stats.byCategory = categoryCounts.reduce((acc, item) => {
            const categoryName = item.category?.name || 'Uncategorized';
            acc[categoryName] = item._count.id;
            return acc;
        }, {});
        
        return stats;
    } catch (error) {
        console.error('Error getting proxy health stats:', error);
        return {
            total: 0,
            active: 0,
            inactive: 0,
            byType: {},
            byCategory: {},
            error: error.message
        };
    }
}

// =============================================================================
// END CONFIGURATION MANAGEMENT HELPER FUNCTIONS
// =============================================================================

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

    // Handle API routes
    if (pathname.startsWith('/api/v1/')) {
        res.setHeader('Content-Type', 'application/json');

        // Validate API key
        const authHeader = req.headers.authorization;
        if (!validateApiKey(authHeader)) {
            res.writeHead(401);
            res.end(JSON.stringify({ error: "Invalid API key" }));
            return;
        }

        // Get pagination and filter parameters
        const { page, perPage } = getPaginationParams(parsedUrl.query);
        const filters = getFilters(parsedUrl.query);

        try {
            // Handle different API endpoints
            if (pathname === '/api/v1/accounts' && req.method === 'GET') {
                const skip = (page - 1) * perPage;
                
                let whereClause = {};
                if (filters.account_category_id) {
                    const categories = filters.account_category_id.split(',').map(id => parseInt(id));
                    whereClause.category_id = { in: categories };
                }

                const [accounts, total] = await Promise.all([
                    prisma.account.findMany({
                        where: whereClause,
                        include: {
                            category: true,
                            proxy: true,
                            agent: true
                        },
                        skip: skip,
                        take: perPage,
                        orderBy: { created_at: 'desc' }
                    }),
                    prisma.account.count({ where: whereClause })
                ]);

                res.writeHead(200);
                res.end(JSON.stringify({
                    data: accounts,
                    page: page,
                    per_page: perPage,
                    total_items: total
                }));
                return;
            }

            if (pathname === '/api/v1/accounts/tutorial' && req.method === 'GET') {
                const tutorialCategory = await prisma.accountCategory.findFirst({
                    where: { name: 'Tutorial' }
                });

                if (tutorialCategory) {
                    const tutorialAccount = await prisma.account.findFirst({
                        where: { 
                            category_id: tutorialCategory.id,
                            status: { not: 'completed' }
                        },
                        include: {
                            category: true,
                            proxy: true,
                            agent: true
                        }
                    });

                    res.writeHead(200);
                    res.end(JSON.stringify({ data: tutorialAccount }));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: "Tutorial category not found" }));
                }
                return;
            }

            if (pathname === '/api/v1/accounts/check' && req.method === 'GET') {
                const count = parseInt(parsedUrl.query.count) || 3;
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                
                const checkAccounts = await prisma.account.findMany({
                    where: {
                        OR: [
                            { updated_at: { lt: oneDayAgo } },
                            { updated_at: null }
                        ]
                    },
                    include: {
                        category: true,
                        proxy: true,
                        agent: true
                    },
                    take: count,
                    orderBy: { updated_at: 'asc' }
                });

                res.writeHead(200);
                res.end(JSON.stringify({ data: checkAccounts }));
                return;
            }

            // Handle account creation
            if (pathname === '/api/v1/accounts' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                req.on('end', async () => {
                    try {
                        const accountData = JSON.parse(body);
                        const account = await prisma.account.create({
                            data: {
                                username: accountData.username,
                                password: accountData.password,
                                email: accountData.email,
                                type: accountData.account_type || 'p2p',
                                category_id: accountData.account_category_id ? parseInt(accountData.account_category_id) : null,
                                otp_key: accountData.otp_key,
                                tutorial_status: accountData.tutorial_status ? parseInt(accountData.tutorial_status) : 0,
                                status: accountData.status || 'idle'
                            },
                            include: {
                                category: true,
                                proxy: true,
                                agent: true
                            }
                        });

                        // Broadcast account creation to all connected clients
                        broadcastToClients('account_created', {
                            account: account,
                            message: `Account ${account.username} created`
                        });

                        res.writeHead(201);
                        res.end(JSON.stringify({ data: account }));
                    } catch (error) {
                        console.error('Error creating account:', error);
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                return;
            }

            // Handle individual account endpoints
            const accountMatch = pathname.match(/^\/api\/v1\/accounts\/(\d+)$/);
            if (accountMatch) {
                const accountId = parseInt(accountMatch[1]);

                if (req.method === 'GET') {
                    const account = await prisma.account.findUnique({
                        where: { id: accountId },
                        include: {
                            category: true,
                            proxy: true,
                            agent: true,
                            tasks: true
                        }
                    });

                    if (!account) {
                        res.writeHead(404);
                        res.end(JSON.stringify({ error: "Account not found" }));
                        return;
                    }

                    res.writeHead(200);
                    res.end(JSON.stringify({ data: account }));
                    return;
                }

                if (req.method === 'PUT') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', async () => {
                        try {
                            const accountData = JSON.parse(body);
                            const account = await prisma.account.update({
                                where: { id: accountId },
                                data: {
                                    username: accountData.username,
                                    password: accountData.password,
                                    email: accountData.email,
                                    type: accountData.account_type,
                                    category_id: accountData.account_category_id ? parseInt(accountData.account_category_id) : null,
                                    proxy_id: accountData.proxy_id ? parseInt(accountData.proxy_id) : null,
                                    agent_id: accountData.agent_id ? parseInt(accountData.agent_id) : null,
                                    otp_key: accountData.otp_key,
                                    tutorial_status: accountData.tutorial_status ? parseInt(accountData.tutorial_status) : null,
                                    status: accountData.status,
                                    last_checked_at: accountData.update_last_checked ? new Date() : undefined
                                },
                                include: {
                                    category: true,
                                    proxy: true,
                                    agent: true,
                                    tasks: true
                                }
                            });

                            // Broadcast account update to all connected clients
                            broadcastToClients('account_updated', {
                                account: account,
                                message: `Account ${account.username} updated`
                            });

                            res.writeHead(200);
                            res.end(JSON.stringify({ data: account }));
                        } catch (error) {
                            console.error('Error updating account:', error);
                            res.writeHead(400);
                            res.end(JSON.stringify({ error: error.message }));
                        }
                    });
                    return;
                }

                if (req.method === 'DELETE') {
                    try {
                        const account = await prisma.account.findUnique({
                            where: { id: accountId },
                            select: { username: true }
                        });

                        await prisma.account.delete({
                            where: { id: accountId }
                        });

                        // Broadcast account deletion to all connected clients
                        broadcastToClients('account_deleted', {
                            accountId: accountId,
                            message: `Account ${account?.username || accountId} deleted`
                        });

                        res.writeHead(200);
                        res.end(JSON.stringify({ message: "Account deleted successfully" }));
                    } catch (error) {
                        console.error('Error deleting account:', error);
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: error.message }));
                    }
                    return;
                }
            }

            // Handle account control endpoints (stop, pause, resume)
            const controlMatch = pathname.match(/^\/api\/v1\/accounts\/(\d+)\/(stop|pause|resume)$/);
            if (controlMatch && req.method === 'POST') {
                const accountId = parseInt(controlMatch[1]);
                const action = controlMatch[2];

                const statusMap = {
                    'stop': 'stopped',
                    'pause': 'paused', 
                    'resume': 'running'
                };

                try {
                    const updatedAccount = await prisma.account.update({
                        where: { id: accountId },
                        data: {
                            status: statusMap[action],
                            updated_at: new Date()
                        },
                        include: {
                            category: true,
                            proxy: true,
                            agent: true
                        }
                    });

                    res.writeHead(200);
                    res.end(JSON.stringify({ 
                        message: `Account ${action}ped successfully`,
                        data: updatedAccount 
                    }));
                } catch (error) {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: "Account not found" }));
                }
                return;
            }

            // Handle tasks endpoints
            if (pathname === '/api/v1/tasks' && req.method === 'GET') {
                const skip = (page - 1) * perPage;
                
                const [tasks, total] = await Promise.all([
                    prisma.task.findMany({
                        include: {
                            account: true,
                            agent: true,
                            bot: true
                        },
                        skip: skip,
                        take: perPage,
                        orderBy: { created_at: 'desc' }
                    }),
                    prisma.task.count()
                ]);

                res.writeHead(200);
                res.end(JSON.stringify({
                    data: tasks,
                    page: page,
                    per_page: perPage,
                    total_items: total
                }));
                return;
            }

            // Handle agents endpoints
            if (pathname === '/api/v1/agents' && req.method === 'GET') {
                const agents = await prisma.agent.findMany({
                    include: {
                        accounts: true,
                        bots: true,
                        tasks: true
                    },
                    orderBy: { name: 'asc' }
                });

                res.writeHead(200);
                res.end(JSON.stringify({ data: agents }));
                return;
            }

            // Manual agent sync endpoint for testing
            if (pathname === '/api/v1/agents/sync' && req.method === 'POST') {
                if (!ETERNALFARM_AGENT_KEY || ETERNALFARM_AGENT_KEY === 'YOUR_ACTUAL_ETERNALFARM_API_KEY_HERE' || ETERNALFARM_AGENT_KEY === 'YOUR_ETERNALFARM_AGENT_KEY_HERE') {
                    res.writeHead(400);
                    res.end(JSON.stringify({ 
                        error: "EternalFarm API key not configured",
                        message: "Please configure ETERNALFARM_AGENT_KEY in config.env"
                    }));
                    return;
                }

                try {
                    console.log('🔄 Manual agent sync triggered via API...');
                    await syncAgentsWithDatabase();
                    
                    const agents = await prisma.agent.findMany({
                        orderBy: { name: 'asc' }
                    });

                    res.writeHead(200);
                    res.end(JSON.stringify({ 
                        message: "Agent sync completed successfully",
                        agents_count: agents.length,
                        data: agents
                    }));
                } catch (error) {
                    console.error('❌ Manual agent sync failed:', error);
                    res.writeHead(500);
                    res.end(JSON.stringify({ 
                        error: "Agent sync failed",
                        message: error.message
                    }));
                }
                return;
            }

            // Bi-directional sync endpoint (pull from and push to EternalFarm)
            if (pathname === '/api/v1/agents/sync/bidirectional' && req.method === 'POST') {
                if (!ETERNALFARM_AGENT_KEY || ETERNALFARM_AGENT_KEY === 'YOUR_ACTUAL_ETERNALFARM_API_KEY_HERE' || ETERNALFARM_AGENT_KEY === 'YOUR_ETERNALFARM_AGENT_KEY_HERE') {
                    res.writeHead(400);
                    res.end(JSON.stringify({ 
                        error: "EternalFarm API key not configured",
                        message: "Please configure ETERNALFARM_AGENT_KEY in config.env"
                    }));
                    return;
                }

                try {
                    console.log('🔄 Manual bi-directional sync triggered via API...');
                    await performBidirectionalSync();
                    
                    const agents = await prisma.agent.findMany({
                        orderBy: { name: 'asc' }
                    });

                    res.writeHead(200);
                    res.end(JSON.stringify({ 
                        message: "Bi-directional sync completed successfully",
                        agents_count: agents.length,
                        data: agents,
                        timestamp: new Date().toISOString()
                    }));
                } catch (error) {
                    console.error('❌ Manual bi-directional sync failed:', error);
                    res.writeHead(500);
                    res.end(JSON.stringify({ 
                        error: "Bi-directional sync failed",
                        message: error.message
                    }));
                }
                return;
            }

            // Push pending changes endpoint
            if (pathname === '/api/v1/agents/sync/push' && req.method === 'POST') {
                if (!ETERNALFARM_AGENT_KEY || ETERNALFARM_AGENT_KEY === 'YOUR_ACTUAL_ETERNALFARM_API_KEY_HERE' || ETERNALFARM_AGENT_KEY === 'YOUR_ETERNALFARM_AGENT_KEY_HERE') {
                    res.writeHead(400);
                    res.end(JSON.stringify({ 
                        error: "EternalFarm API key not configured",
                        message: "Please configure ETERNALFARM_AGENT_KEY in config.env"
                    }));
                    return;
                }

                try {
                    console.log('📤 Manual push sync triggered via API...');
                    await pushPendingChangesToEternalFarm();
                    
                    const pendingAgents = await prisma.agent.findMany({
                        where: { needs_sync: true },
                        orderBy: { name: 'asc' }
                    });

                    res.writeHead(200);
                    res.end(JSON.stringify({ 
                        message: "Push sync completed successfully",
                        pending_changes: pendingAgents.length,
                        timestamp: new Date().toISOString()
                    }));
                } catch (error) {
                    console.error('❌ Manual push sync failed:', error);
                    res.writeHead(500);
                    res.end(JSON.stringify({ 
                        error: "Push sync failed",
                        message: error.message
                    }));
                }
                return;
            }

            // System statistics endpoint
            if (pathname === '/api/v1/system/statistics' && req.method === 'GET') {
                try {
                    const statistics = await collectSystemStatistics();
                    
                    res.writeHead(200);
                    res.end(JSON.stringify({ 
                        message: "System statistics collected successfully",
                        data: statistics
                    }));
                } catch (error) {
                    console.error('❌ Failed to collect system statistics:', error);
                    res.writeHead(500);
                    res.end(JSON.stringify({ 
                        error: "Failed to collect system statistics",
                        message: error.message
                    }));
                }
                return;
            }

            // Agent update endpoint (marks agent for sync)
            if (pathname.startsWith('/api/v1/agents/') && pathname.endsWith('/update') && req.method === 'PUT') {
                const agentIdMatch = pathname.match(/^\/api\/v1\/agents\/(\d+)\/update$/);
                if (agentIdMatch) {
                    const agentId = parseInt(agentIdMatch[1]);
                    
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', async () => {
                        try {
                            const updateData = JSON.parse(body);
                            
                            const agent = await prisma.agent.update({
                                where: { id: agentId },
                                data: {
                                    ...updateData,
                                    needs_sync: true, // Mark for sync
                                    updated_at: new Date()
                                }
                            });

                            // Broadcast agent update to WebSocket clients
                            broadcastToClients('agent_updated', {
                                agent: agent,
                                message: `Agent ${agent.name} updated and marked for sync`
                            });

                            res.writeHead(200);
                            res.end(JSON.stringify({ 
                                message: "Agent updated and marked for sync",
                                data: agent
                            }));
                        } catch (error) {
                            console.error('Error updating agent:', error);
                            res.writeHead(400);
                            res.end(JSON.stringify({ error: error.message }));
                        }
                    });
                    return;
                }
            }

            // Handle account categories
            if (pathname === '/api/v1/account-categories' && req.method === 'GET') {
                const categories = await prisma.accountCategory.findMany({
                    include: {
                        accounts: true
                    }
                });

                res.writeHead(200);
                res.end(JSON.stringify({ data: categories }));
                return;
            }

            // Handle proxies
            if (pathname === '/api/v1/proxies' && req.method === 'GET') {
                const proxies = await prisma.proxy.findMany({
                    include: {
                        category: true,
                        accounts: true
                    }
                });

                res.writeHead(200);
                res.end(JSON.stringify({ data: proxies }));
                return;
            }

            // Handle proxy creation
            if (pathname === '/api/v1/proxies' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                req.on('end', async () => {
                    try {
                        const proxyData = JSON.parse(body);
                        const proxy = await prisma.proxy.create({
                            data: {
                                host: proxyData.ip_address || proxyData.host,
                                port: parseInt(proxyData.port),
                                username: proxyData.username,
                                password: proxyData.password,
                                type: proxyData.type || 'http',
                                category_id: proxyData.proxy_category_id ? parseInt(proxyData.proxy_category_id) : null,
                                is_active: proxyData.is_active !== undefined ? proxyData.is_active : true
                            },
                            include: {
                                category: true,
                                accounts: true
                            }
                        });

                        res.writeHead(201);
                        res.end(JSON.stringify({ data: proxy }));
                    } catch (error) {
                        console.error('Error creating proxy:', error);
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                return;
            }

            // Handle individual proxy operations
            const proxyMatch = pathname.match(/^\/api\/v1\/proxies\/(\d+)$/);
            if (proxyMatch) {
                const proxyId = parseInt(proxyMatch[1]);

                if (req.method === 'GET') {
                    const proxy = await prisma.proxy.findUnique({
                        where: { id: proxyId },
                        include: {
                            category: true,
                            accounts: true
                        }
                    });

                    if (!proxy) {
                        res.writeHead(404);
                        res.end(JSON.stringify({ error: "Proxy not found" }));
                        return;
                    }

                    res.writeHead(200);
                    res.end(JSON.stringify({ data: proxy }));
                    return;
                }

                if (req.method === 'PUT') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', async () => {
                        try {
                            const proxyData = JSON.parse(body);
                            const proxy = await prisma.proxy.update({
                                where: { id: proxyId },
                                data: {
                                    host: proxyData.ip_address || proxyData.host,
                                    port: parseInt(proxyData.port),
                                    username: proxyData.username,
                                    password: proxyData.password,
                                    type: proxyData.type,
                                    category_id: proxyData.proxy_category_id ? parseInt(proxyData.proxy_category_id) : null,
                                    is_active: proxyData.is_active
                                },
                                include: {
                                    category: true,
                                    accounts: true
                                }
                            });

                            res.writeHead(200);
                            res.end(JSON.stringify({ data: proxy }));
                        } catch (error) {
                            console.error('Error updating proxy:', error);
                            res.writeHead(400);
                            res.end(JSON.stringify({ error: error.message }));
                        }
                    });
                    return;
                }

                if (req.method === 'DELETE') {
                    try {
                        await prisma.proxy.delete({
                            where: { id: proxyId }
                        });

                        res.writeHead(200);
                        res.end(JSON.stringify({ message: "Proxy deleted successfully" }));
                    } catch (error) {
                        console.error('Error deleting proxy:', error);
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: error.message }));
                    }
                    return;
                }
            }

            // Handle bots
            if (pathname === '/api/v1/bots' && req.method === 'GET') {
                const bots = await prisma.bot.findMany({
                    include: {
                        agent: true,
                        tasks: true
                    }
                });

                res.writeHead(200);
                res.end(JSON.stringify({ data: bots }));
                return;
            }

            // Handle prime link requests
            if (pathname === '/api/v1/prime-link-requests' && req.method === 'GET') {
                const requests = await prisma.primeLinkRequest.findMany({
                    orderBy: { requested_at: 'desc' }
                });

                res.writeHead(200);
                res.end(JSON.stringify({ data: requests }));
                return;
            }

            // Handle bot CRUD operations
            if (pathname === '/api/v1/bots' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                req.on('end', async () => {
                    try {
                        const botData = JSON.parse(body);
                        const bot = await prisma.bot.create({
                            data: {
                                name: botData.name,
                                type: botData.type,
                                version: botData.version,
                                agent_id: botData.agent_id,
                                status: botData.status || 'idle'
                            },
                            include: {
                                agent: true,
                                tasks: true
                            }
                        });

                        res.writeHead(201);
                        res.end(JSON.stringify({ data: bot }));
                    } catch (error) {
                        console.error('Error creating bot:', error);
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                return;
            }

            // Handle individual bot operations
            const botMatch = pathname.match(/^\/api\/v1\/bots\/(\d+)$/);
            if (botMatch) {
                const botId = parseInt(botMatch[1]);

                if (req.method === 'GET') {
                    const bot = await prisma.bot.findUnique({
                        where: { id: botId },
                        include: {
                            agent: true,
                            tasks: true
                        }
                    });

                    if (!bot) {
                        res.writeHead(404);
                        res.end(JSON.stringify({ error: "Bot not found" }));
                        return;
                    }

                    res.writeHead(200);
                    res.end(JSON.stringify({ data: bot }));
                    return;
                }

                if (req.method === 'PUT') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', async () => {
                        try {
                            const botData = JSON.parse(body);
                            const bot = await prisma.bot.update({
                                where: { id: botId },
                                data: {
                                    name: botData.name,
                                    type: botData.type,
                                    version: botData.version,
                                    agent_id: botData.agent_id,
                                    status: botData.status
                                },
                                include: {
                                    agent: true,
                                    tasks: true
                                }
                            });

                            res.writeHead(200);
                            res.end(JSON.stringify({ data: bot }));
                        } catch (error) {
                            console.error('Error updating bot:', error);
                            res.writeHead(400);
                            res.end(JSON.stringify({ error: error.message }));
                        }
                    });
                    return;
                }

                if (req.method === 'DELETE') {
                    try {
                        await prisma.bot.delete({
                            where: { id: botId }
                        });

                        res.writeHead(200);
                        res.end(JSON.stringify({ message: "Bot deleted successfully" }));
                    } catch (error) {
                        console.error('Error deleting bot:', error);
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: error.message }));
                    }
                    return;
                }
            }

            // Handle account category CRUD operations
            if (pathname === '/api/v1/account-categories' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                req.on('end', async () => {
                    try {
                        const categoryData = JSON.parse(body);
                        const category = await prisma.accountCategory.create({
                            data: {
                                name: categoryData.name,
                                description: categoryData.description
                            },
                            include: {
                                accounts: true
                            }
                        });

                        res.writeHead(201);
                        res.end(JSON.stringify({ data: category }));
                    } catch (error) {
                        console.error('Error creating account category:', error);
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                return;
            }

            // Handle proxy categories
            if (pathname === '/api/v1/proxy-categories' && req.method === 'GET') {
                const categories = await prisma.proxyCategory.findMany({
                    include: {
                        proxies: true
                    }
                });

                res.writeHead(200);
                res.end(JSON.stringify({ data: categories }));
                return;
            }

            if (pathname === '/api/v1/proxy-categories' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                req.on('end', async () => {
                    try {
                        const categoryData = JSON.parse(body);
                        const category = await prisma.proxyCategory.create({
                            data: {
                                name: categoryData.name,
                                description: categoryData.description
                            },
                            include: {
                                proxies: true
                            }
                        });

                        res.writeHead(201);
                        res.end(JSON.stringify({ data: category }));
                    } catch (error) {
                        console.error('Error creating proxy category:', error);
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                return;
            }

            // Handle prime link request CRUD operations
            if (pathname === '/api/v1/prime-link-requests' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                req.on('end', async () => {
                    try {
                        const requestData = JSON.parse(body);
                        const request = await prisma.primeLinkRequest.create({
                            data: {
                                account_id: requestData.account_id,
                                notes: requestData.notes,
                                status: requestData.status || 'pending'
                            }
                        });

                        res.writeHead(201);
                        res.end(JSON.stringify({ data: request }));
                    } catch (error) {
                        console.error('Error creating prime link request:', error);
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
                return;
            }

            // Handle individual prime link request operations
            const primeMatch = pathname.match(/^\/api\/v1\/prime-link-requests\/(\d+)$/);
            if (primeMatch) {
                const requestId = parseInt(primeMatch[1]);

                if (req.method === 'PUT') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', async () => {
                        try {
                            const requestData = JSON.parse(body);
                            const request = await prisma.primeLinkRequest.update({
                                where: { id: requestId },
                                data: {
                                    status: requestData.status,
                                    notes: requestData.notes,
                                    processed_at: requestData.status === 'processed' ? new Date() : null
                                }
                            });

                            res.writeHead(200);
                            res.end(JSON.stringify({ data: request }));
                        } catch (error) {
                            console.error('Error updating prime link request:', error);
                            res.writeHead(400);
                            res.end(JSON.stringify({ error: error.message }));
                        }
                    });
                    return;
                }

                if (req.method === 'DELETE') {
                    try {
                        await prisma.primeLinkRequest.delete({
                            where: { id: requestId }
                        });

                        res.writeHead(200);
                        res.end(JSON.stringify({ message: "Prime link request deleted successfully" }));
                    } catch (error) {
                        console.error('Error deleting prime link request:', error);
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: error.message }));
                    }
                    return;
                }
            }

            // Enhanced task start/stop with agent and account assignment
            const taskStartMatch = pathname.match(/^\/api\/v1\/tasks\/(\d+)\/start$/);
            if (taskStartMatch && req.method === 'POST') {
                const taskId = parseInt(taskStartMatch[1]);
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                req.on('end', () => handleTaskStart(taskId, body, res));
                return;
            }

            const taskStopMatch = pathname.match(/^\/api\/v1\/tasks\/(\d+)\/stop$/);
            if (taskStopMatch && req.method === 'POST') {
                const taskId = parseInt(taskStopMatch[1]);
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                req.on('end', () => handleTaskStop(taskId, body, res));
                return;
            }

            // =============================================================================
            // LIVE CONFIGURATION MANAGEMENT ENDPOINTS
            // =============================================================================

            // Handle configuration endpoints
            if (pathname.startsWith('/api/config')) {
                // Get current configuration
                if (pathname === '/api/config' && req.method === 'GET') {
                    try {
                        const config = {
                            eternalfarm: {
                                apiKey: process.env.ETERNALFARM_AGENT_KEY || '',
                                apiUrl: process.env.ETERNAL_API_URL || 'https://api.eternalfarm.net'
                            },
                            dreambot: {
                                username: process.env.DREAMBOT_USERNAME || '',
                                password: process.env.DREAMBOT_PASSWORD || '',
                                script: process.env.DREAMBOT_SCRIPT || '',
                                world: parseInt(process.env.DREAMBOT_WORLD) || 301
                            },
                            discord: {
                                webhookUrl: process.env.DISCORD_WEBHOOK_URL || ''
                            }
                        };

                        res.writeHead(200);
                        res.end(JSON.stringify({ 
                            success: true,
                            config: config 
                        }));
                    } catch (error) {
                        console.error('Error getting configuration:', error);
                        res.writeHead(500);
                        res.end(JSON.stringify({ 
                            success: false,
                            error: error.message 
                        }));
                    }
                    return;
                }

                // Save configuration (updates environment variables in memory)
                if (pathname === '/api/config' && req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', async () => {
                        try {
                            const config = JSON.parse(body);
                            
                            // Update environment variables in memory
                            if (config.eternalfarm) {
                                if (config.eternalfarm.apiKey) process.env.ETERNALFARM_AGENT_KEY = config.eternalfarm.apiKey;
                                if (config.eternalfarm.apiUrl) process.env.ETERNAL_API_URL = config.eternalfarm.apiUrl;
                                if (config.eternalfarm.apiKey) process.env.AUTH_AGENT_KEY = config.eternalfarm.apiKey;
                            }
                            
                            if (config.dreambot) {
                                if (config.dreambot.username) process.env.DREAMBOT_USERNAME = config.dreambot.username;
                                if (config.dreambot.password) process.env.DREAMBOT_PASSWORD = config.dreambot.password;
                                if (config.dreambot.script) process.env.DREAMBOT_SCRIPT = config.dreambot.script;
                                if (config.dreambot.world) process.env.DREAMBOT_WORLD = config.dreambot.world.toString();
                            }
                            
                            if (config.discord) {
                                if (config.discord.webhookUrl) process.env.DISCORD_WEBHOOK_URL = config.discord.webhookUrl;
                            }

                            // Write configuration to environment file for persistence
                            await writeConfigToFile(config);

                            res.writeHead(200);
                            res.end(JSON.stringify({ 
                                success: true,
                                message: 'Configuration saved successfully'
                            }));
                        } catch (error) {
                            console.error('Error saving configuration:', error);
                            res.writeHead(400);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: error.message 
                            }));
                        }
                    });
                    return;
                }

                // Apply configuration and restart services
                if (pathname === '/api/config/apply' && req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', async () => {
                        try {
                            const config = JSON.parse(body);
                            
                            // Update environment variables
                            if (config.eternalfarm) {
                                if (config.eternalfarm.apiKey) {
                                    process.env.ETERNALFARM_AGENT_KEY = config.eternalfarm.apiKey;
                                    process.env.AUTH_AGENT_KEY = config.eternalfarm.apiKey;
                                }
                                if (config.eternalfarm.apiUrl) process.env.ETERNAL_API_URL = config.eternalfarm.apiUrl;
                            }
                            
                            if (config.dreambot) {
                                if (config.dreambot.username) process.env.DREAMBOT_USERNAME = config.dreambot.username;
                                if (config.dreambot.password) process.env.DREAMBOT_PASSWORD = config.dreambot.password;
                                if (config.dreambot.script) process.env.DREAMBOT_SCRIPT = config.dreambot.script;
                                if (config.dreambot.world) process.env.DREAMBOT_WORLD = config.dreambot.world.toString();
                            }
                            
                            if (config.discord) {
                                if (config.discord.webhookUrl) process.env.DISCORD_WEBHOOK_URL = config.discord.webhookUrl;
                            }

                            // Write to environment file
                            await writeConfigToFile(config);

                            // Generate new DreamBot settings if credentials provided
                            if (config.dreambot && config.dreambot.username && config.dreambot.password) {
                                await generateDreamBotSettings(config.dreambot);
                            }

                            // Restart services via supervisord
                            await restartServices();

                            res.writeHead(200);
                            res.end(JSON.stringify({ 
                                success: true,
                                message: 'Configuration applied and services restarted'
                            }));
                        } catch (error) {
                            console.error('Error applying configuration:', error);
                            res.writeHead(500);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: error.message 
                            }));
                        }
                    });
                    return;
                }

                // Test EternalFarm API connection
                if (pathname === '/api/config/test/eternalfarm' && req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', async () => {
                        try {
                            const { apiKey, apiUrl } = JSON.parse(body);
                            
                            if (!apiKey) {
                                throw new Error('API key is required');
                            }

                            // Test the API connection
                            const testUrl = `${apiUrl}/v1/agents`;
                            const response = await fetch(testUrl, {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${apiKey}`,
                                    'Content-Type': 'application/json'
                                }
                            });

                            if (response.ok) {
                                const data = await response.json();
                                res.writeHead(200);
                                res.end(JSON.stringify({ 
                                    success: true,
                                    message: `Connection successful - Found ${data.data?.length || 0} agents`
                                }));
                            } else {
                                throw new Error(`API returned ${response.status}: ${response.statusText}`);
                            }
                        } catch (error) {
                            console.error('EternalFarm API test failed:', error);
                            res.writeHead(400);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: error.message 
                            }));
                        }
                    });
                    return;
                }

                // Test Discord webhook
                if (pathname === '/api/config/test/discord' && req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', async () => {
                        try {
                            const { webhookUrl } = JSON.parse(body);
                            
                            if (!webhookUrl) {
                                throw new Error('Discord webhook URL is required');
                            }

                            // Test Discord webhook with a simple message
                            const testPayload = {
                                username: "Farm Manager",
                                content: "🧪 **Configuration Test** - Discord webhook is working correctly!",
                                embeds: [{
                                    title: "Configuration Test",
                                    description: "This is a test message from the Farm Manager live configuration panel.",
                                    color: 0x00ff00,
                                    timestamp: new Date().toISOString(),
                                    footer: {
                                        text: "Farm Manager v0.1"
                                    }
                                }]
                            };

                            const webhookUrlObj = new URL(webhookUrl);
                            const postData = JSON.stringify(testPayload);

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

                            const discordReq = https.request(options, (discordRes) => {
                                if (discordRes.statusCode === 204) {
                                    res.writeHead(200);
                                    res.end(JSON.stringify({ 
                                        success: true,
                                        message: 'Discord webhook test successful'
                                    }));
                                } else {
                                    res.writeHead(400);
                                    res.end(JSON.stringify({ 
                                        success: false,
                                        error: `Discord API returned ${discordRes.statusCode}`
                                    }));
                                }
                            });

                            discordReq.on('error', (error) => {
                                res.writeHead(400);
                                res.end(JSON.stringify({ 
                                    success: false,
                                    error: error.message 
                                }));
                            });

                            discordReq.write(postData);
                            discordReq.end();
                        } catch (error) {
                            console.error('Discord webhook test failed:', error);
                            res.writeHead(400);
                            res.end(JSON.stringify({ 
                                success: false,
                                error: error.message 
                            }));
                        }
                    });
                    return;
                }

                // If no config route matches
                res.writeHead(404);
                res.end(JSON.stringify({ 
                    success: false,
                    error: "Configuration endpoint not found" 
                }));
                return;
            }

            // =============================================================================
            // DISCORD HOOKS MANAGEMENT ENDPOINTS  
            // =============================================================================

            // Handle Discord configuration and management
            if (pathname.startsWith('/api/discord')) {
                // Get Discord configuration and message log
                if (pathname === '/api/discord/config' && req.method === 'GET') {
                    try {
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            success: true,
                            data: {
                                webhookUrl: discordConfig.webhookUrl,
                                channelName: discordConfig.channelName,
                                botName: discordConfig.botName,
                                messageLog: discordConfig.messageLog
                            }
                        }));
                    } catch (error) {
                        console.error('Error getting Discord config:', error);
                        res.writeHead(500);
                        res.end(JSON.stringify({ 
                            success: false, 
                            error: 'Failed to get Discord configuration' 
                        }));
                    }
                    return;
                }

                // Update Discord configuration
                if (pathname === '/api/discord/config' && req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', async () => {
                        try {
                            const configData = JSON.parse(body);
                            
                            // Update in-memory configuration
                            if (configData.webhookUrl !== undefined) {
                                discordConfig.webhookUrl = configData.webhookUrl;
                                process.env.DISCORD_WEBHOOK_URL = configData.webhookUrl;
                            }
                            if (configData.channelName !== undefined) {
                                discordConfig.channelName = configData.channelName;
                            }
                            if (configData.botName !== undefined) {
                                discordConfig.botName = configData.botName;
                            }

                            // Write to config file for persistence
                            await writeConfigToFile({
                                discord: {
                                    webhookUrl: discordConfig.webhookUrl
                                }
                            });

                            res.writeHead(200);
                            res.end(JSON.stringify({
                                success: true,
                                message: 'Discord configuration updated successfully',
                                data: {
                                    webhookUrl: discordConfig.webhookUrl,
                                    channelName: discordConfig.channelName,
                                    botName: discordConfig.botName
                                }
                            }));
                        } catch (error) {
                            console.error('Error updating Discord config:', error);
                            res.writeHead(400);
                            res.end(JSON.stringify({ 
                                success: false, 
                                error: 'Failed to update Discord configuration' 
                            }));
                        }
                    });
                    return;
                }

                // Test Discord webhook
                if (pathname === '/api/discord/test' && req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', async () => {
                        try {
                            const { webhookUrl } = JSON.parse(body);
                            const testResult = await testDiscordWebhook(webhookUrl || discordConfig.webhookUrl);
                            
                            res.writeHead(200);
                            res.end(JSON.stringify({
                                success: testResult.success,
                                message: testResult.message
                            }));
                        } catch (error) {
                            console.error('Error testing Discord webhook:', error);
                            res.writeHead(500);
                            res.end(JSON.stringify({ 
                                success: false, 
                                error: 'Failed to test Discord webhook' 
                            }));
                        }
                    });
                    return;
                }

                // Send custom Discord message
                if (pathname === '/api/discord/send' && req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', async () => {
                        try {
                            const messageData = JSON.parse(body);
                            
                            // Parse color from hex to integer
                            let color = 0x00ff00; // Default green
                            if (messageData.color) {
                                if (typeof messageData.color === 'string' && messageData.color.startsWith('#')) {
                                    color = parseInt(messageData.color.slice(1), 16);
                                } else if (typeof messageData.color === 'number') {
                                    color = messageData.color;
                                }
                            }

                            const result = await sendDiscordMessage({
                                title: messageData.title || 'Farm Manager Message',
                                message: messageData.message || '',
                                color: color,
                                includeStats: messageData.includeStats || false,
                                screenshot: messageData.screenshot || null,
                                webhookUrl: messageData.webhookUrl || null
                            });

                            res.writeHead(200);
                            res.end(JSON.stringify({
                                success: true,
                                message: 'Discord message sent successfully'
                            }));
                        } catch (error) {
                            console.error('Error sending Discord message:', error);
                            res.writeHead(500);
                            res.end(JSON.stringify({ 
                                success: false, 
                                error: 'Failed to send Discord message' 
                            }));
                        }
                    });
                    return;
                }

                // Take screenshot
                if (pathname === '/api/discord/screenshot' && req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', async () => {
                        try {
                            const { type = 'desktop', sendToDiscord = false, title = '', message = '' } = JSON.parse(body);
                            
                            console.log(`📸 Taking ${type} screenshot...`);
                            const screenshotPath = await takeScreenshot(type);
                            
                            if (sendToDiscord) {
                                // Send screenshot to Discord
                                await sendDiscordMessage({
                                    title: title || `📸 ${type.charAt(0).toUpperCase() + type.slice(1)} Screenshot`,
                                    message: message || `Screenshot taken at ${new Date().toLocaleString()}`,
                                    color: 0x0099ff,
                                    screenshot: screenshotPath
                                });
                                
                                res.writeHead(200);
                                res.end(JSON.stringify({
                                    success: true,
                                    message: 'Screenshot taken and sent to Discord',
                                    screenshotPath: screenshotPath
                                }));
                            } else {
                                // Return screenshot as base64
                                const imageBuffer = fs.readFileSync(screenshotPath);
                                const base64Image = imageBuffer.toString('base64');
                                const dataUrl = `data:image/png;base64,${base64Image}`;
                                
                                // Clean up file
                                fs.unlinkSync(screenshotPath);
                                
                                res.writeHead(200);
                                res.end(JSON.stringify({
                                    success: true,
                                    message: 'Screenshot taken successfully',
                                    screenshot: dataUrl
                                }));
                            }
                        } catch (error) {
                            console.error('Error taking screenshot:', error);
                            res.writeHead(500);
                            res.end(JSON.stringify({ 
                                success: false, 
                                error: 'Failed to take screenshot' 
                            }));
                        }
                    });
                    return;
                }

                // Quick action endpoints
                if (pathname === '/api/discord/quick-action' && req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', async () => {
                        try {
                            const { action } = JSON.parse(body);
                            let title, message, color = 0x00ff00;
                            let includeStats = false;

                            switch (action) {
                                case 'status':
                                    title = '📊 Farm Manager Status';
                                    message = `System is running normally.\nUptime: ${formatUptime(process.uptime())}`;
                                    includeStats = true;
                                    color = 0x00ff00;
                                    break;
                                case 'stats':
                                    title = '📈 System Statistics';
                                    message = 'Current system performance metrics:';
                                    includeStats = true;
                                    color = 0x0099ff;
                                    break;
                                case 'agents':
                                    const agents = await prisma.agent.findMany();
                                    title = '🤖 Agent Summary';
                                    message = `Total agents: ${agents.length}\nActive: ${agents.filter(a => a.is_active).length}\nInactive: ${agents.filter(a => !a.is_active).length}`;
                                    color = 0x9c27b0;
                                    break;
                                case 'accounts':
                                    const accounts = await prisma.account.findMany();
                                    title = '👥 Account Summary';
                                    message = `Total accounts: ${accounts.length}\nActive: ${accounts.filter(a => a.status !== 'banned').length}`;
                                    color = 0xff9800;
                                    break;
                                default:
                                    throw new Error('Unknown quick action');
                            }

                            await sendDiscordMessage({
                                title,
                                message,
                                color,
                                includeStats
                            });

                            res.writeHead(200);
                            res.end(JSON.stringify({
                                success: true,
                                message: `${action} message sent to Discord`
                            }));
                        } catch (error) {
                            console.error('Error sending quick action:', error);
                            res.writeHead(500);
                            res.end(JSON.stringify({ 
                                success: false, 
                                error: 'Failed to send quick action message' 
                            }));
                        }
                    });
                    return;
                }

                // Get message log
                if (pathname === '/api/discord/messages' && req.method === 'GET') {
                    try {
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            success: true,
                            data: discordConfig.messageLog
                        }));
                    } catch (error) {
                        console.error('Error getting message log:', error);
                        res.writeHead(500);
                        res.end(JSON.stringify({ 
                            success: false, 
                            error: 'Failed to get message log' 
                        }));
                    }
                    return;
                }

                // If no Discord route matches
                res.writeHead(404);
                res.end(JSON.stringify({ 
                    success: false,
                    error: "Discord endpoint not found" 
                }));
                return;
            }

            // =============================================================================
            // PROXY CHECKER ENDPOINTS
            // =============================================================================
            
            // Handle proxy checking endpoints
            if (pathname.startsWith('/api/proxy-checker')) {
                // Test a single proxy
                if (pathname === '/api/proxy-checker/test' && req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', async () => {
                        try {
                            const { proxy, options = {} } = JSON.parse(body);
                            
                            if (!proxy || !proxy.host || !proxy.port) {
                                throw new Error('Proxy host and port are required');
                            }
                            
                            const result = await checkProxy(proxy, options);
                            
                            res.writeHead(200);
                            res.end(JSON.stringify({
                                success: true,
                                data: result
                            }));
                        } catch (error) {
                            console.error('Proxy test error:', error);
                            res.writeHead(500);
                            res.end(JSON.stringify({ 
                                success: false, 
                                error: error.message 
                            }));
                        }
                    });
                    return;
                }
                
                // Test multiple proxies (batch)
                if (pathname === '/api/proxy-checker/test-batch' && req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', async () => {
                        try {
                            const { proxies, options = {} } = JSON.parse(body);
                            
                            if (!Array.isArray(proxies) || proxies.length === 0) {
                                throw new Error('Proxies array is required');
                            }
                            
                            const results = await checkMultipleProxies(proxies, options);
                            
                            res.writeHead(200);
                            res.end(JSON.stringify({
                                success: true,
                                data: results,
                                summary: {
                                    total: results.length,
                                    working: results.filter(r => r.working).length,
                                    failed: results.filter(r => !r.working).length,
                                    averageResponseTime: Math.round(
                                        results.filter(r => r.responseTime)
                                                .reduce((sum, r) => sum + r.responseTime, 0) / 
                                        results.filter(r => r.responseTime).length || 0
                                    )
                                }
                            }));
                        } catch (error) {
                            console.error('Batch proxy test error:', error);
                            res.writeHead(500);
                            res.end(JSON.stringify({ 
                                success: false, 
                                error: error.message 
                            }));
                        }
                    });
                    return;
                }
                
                // Test all proxies from database
                if (pathname === '/api/proxy-checker/test-all' && req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => body += chunk.toString());
                    req.on('end', async () => {
                        try {
                            const { options = {} } = JSON.parse(body);
                            
                            // Get all proxies from database
                            const dbProxies = await prisma.proxy.findMany({
                                where: { is_active: true }
                            });
                            
                            if (dbProxies.length === 0) {
                                res.writeHead(200);
                                res.end(JSON.stringify({
                                    success: true,
                                    data: [],
                                    message: 'No active proxies found in database'
                                }));
                                return;
                            }
                            
                            // Convert database proxies to test format
                            const proxiesToTest = dbProxies.map(proxy => ({
                                id: proxy.id,
                                host: proxy.host,
                                port: proxy.port,
                                username: proxy.username,
                                password: proxy.password,
                                type: proxy.type || 'http'
                            }));
                            
                            const results = await checkMultipleProxies(proxiesToTest, options);
                            
                            // Update database with results
                            for (const result of results) {
                                const proxyId = proxiesToTest[result.originalIndex]?.id;
                                if (proxyId) {
                                    try {
                                        await prisma.proxy.update({
                                            where: { id: proxyId },
                                            data: {
                                                last_checked: new Date(),
                                                is_active: result.working,
                                                // Store test results in a JSON field if your schema supports it
                                                // test_results: result
                                            }
                                        });
                                    } catch (updateError) {
                                        console.error(`Failed to update proxy ${proxyId}:`, updateError);
                                    }
                                }
                            }
                            
                            res.writeHead(200);
                            res.end(JSON.stringify({
                                success: true,
                                data: results,
                                summary: {
                                    total: results.length,
                                    working: results.filter(r => r.working).length,
                                    failed: results.filter(r => !r.working).length,
                                    averageResponseTime: Math.round(
                                        results.filter(r => r.responseTime)
                                                .reduce((sum, r) => sum + r.responseTime, 0) / 
                                        results.filter(r => r.responseTime).length || 0
                                    )
                                }
                            }));
                        } catch (error) {
                            console.error('Test all proxies error:', error);
                            res.writeHead(500);
                            res.end(JSON.stringify({ 
                                success: false, 
                                error: error.message 
                            }));
                        }
                    });
                    return;
                }
                
                // Get proxy health statistics
                if (pathname === '/api/proxy-checker/stats' && req.method === 'GET') {
                    try {
                        const stats = await getProxyHealthStats();
                        
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            success: true,
                            data: stats
                        }));
                    } catch (error) {
                        console.error('Proxy stats error:', error);
                        res.writeHead(500);
                        res.end(JSON.stringify({ 
                            success: false, 
                            error: error.message 
                        }));
                    }
                    return;
                }
                
                // If no proxy checker route matches
                res.writeHead(404);
                res.end(JSON.stringify({ 
                    success: false,
                    error: "Proxy checker endpoint not found" 
                }));
                return;
            }

            // =============================================================================
            // END CONFIGURATION MANAGEMENT ENDPOINTS
            // =============================================================================

        } catch (error) {
            console.error('Database error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Internal server error" }));
            return;
        }

        // If no route matches
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Endpoint not found" }));
        return;
    }

    // Health check endpoint
    if (pathname === '/health') {
        try {
            // Test database connection
            await prisma.$queryRaw`SELECT 1`;
            res.writeHead(200);
            res.end(JSON.stringify({ 
                status: "healthy", 
                timestamp: new Date().toISOString(),
                database: "connected"
            }));
        } catch (error) {
            res.writeHead(503);
            res.end(JSON.stringify({ 
                status: "unhealthy", 
                timestamp: new Date().toISOString(),
                database: "disconnected",
                error: error.message
            }));
        }
        return;
    }

    // Handle static files (for web interface)
    if (pathname === '/' || pathname === '/index.html') {
        fs.readFile(path.join(__dirname, 'dashboard-production.html'), (err, data) => {
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

    if (pathname === '/index-discord.html') {
        fs.readFile(path.join(__dirname, 'index-discord.html'), (err, data) => {
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

    if (pathname === '/modern-dashboard.js') {
        fs.readFile(path.join(__dirname, 'modern-dashboard.js'), (err, data) => {
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

    if (pathname === '/modern-dashboard.css') {
        fs.readFile(path.join(__dirname, 'modern-dashboard.css'), (err, data) => {
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

// Initialize enhanced task handlers
const handleTaskStart = createTaskStartHandler(prisma, broadcastToClients, sendDiscordNotification, DISCORD_WEBHOOK_URL);
const handleTaskStop = createTaskStopHandler(prisma, broadcastToClients, sendDiscordNotification, DISCORD_WEBHOOK_URL);

// Start server with database connection test
async function startServer() {
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
        console.error('Failed to connect to database. Please check your connection settings.');
        process.exit(1);
    }

    const httpServer = server.listen(PORT, '0.0.0.0', async () => {
        const localIP = getLocalIPAddress();
        console.log(`✅ Server running at:`);
        console.log(`   🏠 Local: http://localhost:${PORT}/`);
        console.log(`   🌐 Network: http://${localIP}:${PORT}/`);
        console.log(`📊 Database: Connected to MariaDB`);
        console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
        
        // Debug environment variables
        console.log(`🔍 Debug - ETERNALFARM_AGENT_KEY: ${ETERNALFARM_AGENT_KEY ? ETERNALFARM_AGENT_KEY.substring(0, 10) + '...' : 'undefined'}`);
        console.log(`🔍 Debug - ETERNAL_API_URL: ${ETERNAL_API_URL}`);
        
        // Check EternalFarm configuration
        if (ETERNALFARM_AGENT_KEY && ETERNALFARM_AGENT_KEY !== 'YOUR_ACTUAL_ETERNALFARM_API_KEY_HERE' && ETERNALFARM_AGENT_KEY !== 'YOUR_ETERNALFARM_AGENT_KEY_HERE') {
            console.log(`🔑 EternalFarm Agent Key: ${ETERNALFARM_AGENT_KEY.substring(0, 10)}...`);
            console.log(`🌐 EternalFarm API URL: ${ETERNAL_API_URL}`);
            
            // Initial agent sync
            console.log('🔄 Performing initial agent sync...');
            await syncAgentsWithDatabase();
        } else {
            console.log('⚠️ EternalFarm agent key not configured - agent data will not be synced');
            console.log('📋 To enable agent sync:');
            console.log('   1. Get your EternalFarm API key from your account settings');
            console.log('   2. Update ETERNALFARM_AGENT_KEY in config.env');
            console.log('   3. Restart the server');
            console.log('   4. Agents will be automatically loaded from EternalFarm API');
        }
        
        // Send Discord notification
        await sendDiscordNotification(
            "🚀 Farm Manager 0.1",
            `Farm Manager has been successfully launched and is now online!\n\n` +
            `🌐 **Server URL:** http://localhost:${PORT}/\n` +
            `📊 **Database:** Connected to MariaDB\n` +
            `🔧 **Features:** Client Launcher, P2P Master AI Timer, Account Management, Real-time Updates\n` +
            `🔑 **EternalFarm:** ${ETERNALFARM_AGENT_KEY ? 'Connected' : 'Not configured'}\n` +
            `⏰ **Started:** ${new Date().toLocaleString()}`,
            0x00ff00 // Green color
        );
    });

    // Create WebSocket server
    const wss = new WebSocket.Server({ server: httpServer });
    
    wss.on('connection', (ws, req) => {
        const clientIP = req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'Unknown';
        console.log(`🔌 New WebSocket client connected from ${clientIP}`);
        wsClients.add(ws);
        
        // Send welcome message
        ws.send(JSON.stringify({
            type: 'connection',
            data: { message: 'Connected to Farm Manager WebSocket' },
            timestamp: new Date().toISOString()
        }));
        
        // Handle client messages
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                
                // Only log non-ping messages to reduce noise
                if (data.type !== 'ping') {
                    console.log('📨 WebSocket message received:', data);
                }
                
                // Handle different message types
                switch (data.type) {
                    case 'ping':
                        ws.send(JSON.stringify({
                            type: 'pong',
                            data: { timestamp: new Date().toISOString() },
                            timestamp: new Date().toISOString()
                        }));
                        break;
                    case 'subscribe':
                        // Handle subscription to specific data types
                        ws.send(JSON.stringify({
                            type: 'subscribed',
                            data: { subscriptions: data.data.types || [] },
                            timestamp: new Date().toISOString()
                        }));
                        break;
                }
            } catch (error) {
                console.error('❌ WebSocket message error:', error);
            }
        });
        
        // Handle client disconnect
        ws.on('close', (code, reason) => {
            console.log(`🔌 WebSocket client disconnected (${clientIP}) - Code: ${code}, Reason: ${reason || 'No reason'}`);
            wsClients.delete(ws);
        });
        
        // Handle errors
        ws.on('error', (error) => {
            console.error(`❌ WebSocket error (${clientIP}):`, error.message);
            wsClients.delete(ws);
        });
    });
    
    console.log(`🔌 WebSocket server running on:`);
    console.log(`   🏠 Local: ws://localhost:${PORT}/`);
    console.log(`   🌐 Network: ws://${getLocalIPAddress()}:${PORT}/`);
    
    // Start periodic status broadcasts (reduced frequency to reduce log noise)
    setInterval(() => {
        const statusData = {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            connections: wsClients.size,
            timestamp: new Date().toISOString()
        };
        
        if (wsClients.size > 0) {
            console.log(`📡 Broadcasting server_status update to ${wsClients.size} clients`);
            broadcastToClients('server_status', statusData);
        }
    }, 120000); // Every 2 minutes instead of 30 seconds
    
    // Start periodic bi-directional syncing with EternalFarm API (every 5 minutes)
    if (ETERNALFARM_AGENT_KEY) {
        setInterval(async () => {
            await performBidirectionalSync();
        }, 300000); // Every 5 minutes
        
        // Also start more frequent statistics collection (every 2 minutes)
        setInterval(async () => {
            await collectSystemStatistics();
        }, 120000); // Every 2 minutes
        
        // Initial sync on startup
        setTimeout(async () => {
            console.log('🚀 Performing initial bi-directional sync on startup...');
            await performBidirectionalSync();
        }, 5000); // 5 seconds after startup
    }
    
    // Database connection monitoring (every 2 minutes)
    let dbOfflineNotificationSent = false;
    setInterval(async () => {
        try {
            await prisma.$queryRaw`SELECT 1`;
            if (dbOfflineNotificationSent) {
                // Database is back online
                await sendDiscordNotification(
                    "✅ Farm Manager 0.1 - Database Restored",
                    `Database connection has been restored!\n\n` +
                    `⏰ **Restored Time:** ${new Date().toLocaleString()}\n` +
                    `📊 **Status:** Database reconnected\n` +
                    `🌐 **Server URL:** http://localhost:${PORT}/`,
                    0x00ff00 // Green color
                );
                dbOfflineNotificationSent = false;
                console.log('✅ Database connection restored');
            }
        } catch (error) {
            if (!dbOfflineNotificationSent) {
                console.error('❌ Database connection lost:', error.message);
                await sendOfflineNotification('Database connection lost', error);
                dbOfflineNotificationSent = true;
            }
        }
    }, 120000); // Every 2 minutes
}

// Graceful shutdown handlers
let isShuttingDown = false;

async function sendOfflineNotification(reason = 'Unknown', error = null) {
    if (!DISCORD_WEBHOOK_URL) {
        console.log('⚠️ Discord webhook URL for offline notification not configured');
        return;
    }

    const uptimeDuration = Date.now() - UPTIME_START;
    const uptimeSeconds = Math.floor(uptimeDuration / 1000);

    const lines = [
        "Farm Manager has gone offline!",
        "", // For an empty line
        `🕒 **Offline Time:** ${new Date().toLocaleString()}`,
        `📊 **Reason:** ${reason}`,
        `⏱️ **Uptime:** ${uptimeSeconds} seconds`,
        `🔗 **Last URL:** http://localhost:${PORT}/`
    ];

    if (error) {
        lines.push(""); // Empty line before error
        lines.push("**Error Details:**");
        lines.push(`\`\`\`${error.stack || error.message || error}\`\`\``);
    }
    
    let description = lines.join('\\n');
    
    console.log(`🔴 Sending offline notification. Reason: ${reason}`);
    await sendDiscordNotification(
        "🔴 Farm Manager 0.1 - OFFLINE",
        description,
        0xff0000, // Red color for offline
        "🔴 Offline" // Pass the offline status and emoji
    );
}

// Handle graceful shutdown (Ctrl+C)
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    
    await sendOfflineNotification('Manual shutdown (SIGINT)');
    
    await prisma.$disconnect();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Handle termination signal
process.on('SIGTERM', async () => {
    console.log('\n🛑 Server terminated...');
    
    await sendOfflineNotification('Server terminated (SIGTERM)');
    
    await prisma.$disconnect();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
    console.error('❌ Uncaught Exception:', error);
    
    await sendOfflineNotification('Uncaught exception', error);
    
    await prisma.$disconnect();
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    
    await sendOfflineNotification('Unhandled promise rejection', { message: reason });
    
    await prisma.$disconnect();
    process.exit(1);
});

// Handle server errors
server.on('error', async (error) => {
    console.error('❌ Server error:', error);
    
    await sendOfflineNotification('Server error', error);
});

// Start the server
startServer().catch(console.error); 