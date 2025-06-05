#!/usr/bin/env node

/**
 * Your Own EternalFarm API
 * 
 * A multi-tenant farm management API built on your existing infrastructure
 * This extends your current Farm Manager into a full EternalFarm competitor!
 */

const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('./generated/prisma');

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Rate limiting for API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP' }
});

app.use('/api/', apiLimiter);

// Generate secure API key
function generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
}

// Validate API Key middleware
async function validateApiKey(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid authorization header' 
            });
        }
        
        const apiKey = authHeader.split(' ')[1];
        
        // In a real implementation, you'd hash the API key
        // For now, we'll do a simple lookup
        const user = await prisma.user.findFirst({
            where: {
                api_keys: {
                    some: {
                        key_hash: apiKey, // In production, compare hashes
                        is_active: true,
                        OR: [
                            { expires_at: null },
                            { expires_at: { gte: new Date() } }
                        ]
                    }
                }
            },
            include: {
                api_keys: true
            }
        });
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid API key' 
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Authentication error' 
        });
    }
}

// Check subscription limits
async function checkLimits(user_id, resource_type) {
    const user = await prisma.user.findUnique({
        where: { id: user_id },
        include: {
            _count: {
                select: {
                    agents: true,
                    accounts: true
                }
            }
        }
    });
    
    const limits = {
        free: { agents: 1, accounts: 10 },
        pro: { agents: 5, accounts: 100 },
        enterprise: { agents: 50, accounts: 1000 }
    };
    
    const userLimits = limits[user.subscription_tier] || limits.free;
    
    if (resource_type === 'agent' && user._count.agents >= userLimits.agents) {
        throw new Error(`Agent limit reached (${userLimits.agents}) for ${user.subscription_tier} plan`);
    }
    
    if (resource_type === 'account' && user._count.accounts >= userLimits.accounts) {
        throw new Error(`Account limit reached (${userLimits.accounts}) for ${user.subscription_tier} plan`);
    }
    
    return true;
}

// ===========================================
// USER MANAGEMENT API
// ===========================================

// User registration
app.post('/api/v1/auth/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        
        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User already exists'
            });
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);
        
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                username,
                password_hash: passwordHash,
                subscription_tier: 'free'
            }
        });
        
        // Generate initial API key
        const apiKey = generateApiKey();
        await prisma.apiKey.create({
            data: {
                user_id: user.id,
                key_hash: apiKey, // In production, hash this
                name: 'Default API Key',
                permissions: ['agents:read', 'agents:write', 'accounts:read', 'accounts:write']
            }
        });
        
        res.json({
            success: true,
            data: {
                user_id: user.id,
                username: user.username,
                subscription_tier: user.subscription_tier,
                api_key: apiKey // Only shown once!
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Generate new API key
app.post('/api/v1/auth/keys', validateApiKey, async (req, res) => {
    try {
        const { name, permissions, expires_at } = req.body;
        
        const apiKey = generateApiKey();
        const newKey = await prisma.apiKey.create({
            data: {
                user_id: req.user.id,
                key_hash: apiKey, // In production, hash this
                name: name || 'API Key',
                permissions: permissions || ['agents:read'],
                expires_at: expires_at ? new Date(expires_at) : null
            }
        });
        
        res.json({
            success: true,
            data: {
                id: newKey.id,
                key: apiKey, // Only shown once!
                name: newKey.name,
                permissions: newKey.permissions
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===========================================
// AGENT MANAGEMENT API
// ===========================================

// Get user's agents
app.get('/api/v1/agents', validateApiKey, async (req, res) => {
    try {
        const agents = await prisma.agent.findMany({
            where: { user_id: req.user.id },
            include: {
                accounts: true,
                tasks: {
                    where: { status: 'running' }
                },
                _count: {
                    select: {
                        accounts: true,
                        tasks: true
                    }
                }
            }
        });
        
        res.json({
            success: true,
            data: agents
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Register new agent
app.post('/api/v1/agents/register', validateApiKey, async (req, res) => {
    try {
        const { name, capabilities, system_info } = req.body;
        
        // Check agent limits
        await checkLimits(req.user.id, 'agent');
        
        // Generate agent auth token
        const authToken = generateApiKey();
        
        const agent = await prisma.agent.create({
            data: {
                user_id: req.user.id,
                name,
                auth_token: authToken,
                capabilities: capabilities || [],
                ip_address: req.ip,
                system_info: system_info ? JSON.stringify(system_info) : null
            }
        });
        
        res.json({
            success: true,
            data: {
                agent_id: agent.id,
                auth_token: authToken,
                heartbeat_interval: 30 // seconds
            }
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Agent heartbeat
app.post('/api/v1/agents/:id/heartbeat', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cpu_usage, memory_usage, disk_usage } = req.body;
        
        // Validate agent token (simplified)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid agent token' 
            });
        }
        
        const agentToken = authHeader.split(' ')[1];
        const agent = await prisma.agent.findFirst({
            where: {
                id: parseInt(id),
                auth_token: agentToken
            }
        });
        
        if (!agent) {
            return res.status(401).json({
                success: false,
                error: 'Invalid agent token'
            });
        }
        
        // Update agent status
        await prisma.agent.update({
            where: { id: parseInt(id) },
            data: {
                status: status || 'online',
                last_seen: new Date(),
                cpu_usage: cpu_usage || null,
                memory_usage: memory_usage || null,
                disk_usage: disk_usage || null
            }
        });
        
        res.json({ success: true });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===========================================
// ACCOUNT MANAGEMENT API
// ===========================================

// Get user's accounts
app.get('/api/v1/accounts', validateApiKey, async (req, res) => {
    try {
        const accounts = await prisma.account.findMany({
            where: {
                agent: { user_id: req.user.id }
            },
            include: {
                agent: true,
                category: true,
                proxy: true
            }
        });
        
        res.json({
            success: true,
            data: accounts
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create account
app.post('/api/v1/accounts', validateApiKey, async (req, res) => {
    try {
        const { username, password, email, type, agent_id, category_id } = req.body;
        
        // Check account limits
        await checkLimits(req.user.id, 'account');
        
        // Verify agent belongs to user
        const agent = await prisma.agent.findFirst({
            where: {
                id: agent_id,
                user_id: req.user.id
            }
        });
        
        if (!agent) {
            return res.status(400).json({
                success: false,
                error: 'Agent not found or does not belong to user'
            });
        }
        
        const account = await prisma.account.create({
            data: {
                username,
                password,
                email,
                type: type || 'p2p',
                agent_id,
                category_id
            }
        });
        
        res.json({
            success: true,
            data: account
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// ===========================================
// DASHBOARD & ANALYTICS API
// ===========================================

// User dashboard stats
app.get('/api/v1/stats/dashboard', validateApiKey, async (req, res) => {
    try {
        const user_id = req.user.id;
        
        const [
            totalAgents,
            onlineAgents,
            totalAccounts,
            runningAccounts,
            totalTasks,
            completedTasks
        ] = await prisma.$transaction([
            prisma.agent.count({ where: { user_id } }),
            prisma.agent.count({ where: { user_id, status: 'online' } }),
            prisma.account.count({ where: { agent: { user_id } } }),
            prisma.account.count({ where: { agent: { user_id }, status: 'running' } }),
            prisma.task.count({ where: { agent: { user_id } } }),
            prisma.task.count({ where: { agent: { user_id }, status: 'completed' } })
        ]);
        
        res.json({
            success: true,
            data: {
                user: {
                    id: req.user.id,
                    username: req.user.username,
                    subscription_tier: req.user.subscription_tier
                },
                stats: {
                    agents: { total: totalAgents, online: onlineAgents },
                    accounts: { total: totalAccounts, running: runningAccounts },
                    tasks: { total: totalTasks, completed: completedTasks }
                }
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===========================================
// SERVER STARTUP
// ===========================================

const PORT = process.env.YOUR_API_PORT || 4000;

app.listen(PORT, () => {
    console.log('🚀 Your EternalFarm API is running!');
    console.log('=====================================');
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/api/v1/stats/dashboard`);
    console.log(`🔑 Register: POST http://localhost:${PORT}/api/v1/auth/register`);
    console.log(`🤖 Agents: GET http://localhost:${PORT}/api/v1/agents`);
    console.log(`👤 Accounts: GET http://localhost:${PORT}/api/v1/accounts`);
    console.log('');
    console.log('💡 Example registration:');
    console.log('curl -X POST http://localhost:4000/api/v1/auth/register \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"email":"test@example.com","username":"testuser","password":"password123"}\'');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Your EternalFarm API...');
    await prisma.$disconnect();
    process.exit(0);
}); 