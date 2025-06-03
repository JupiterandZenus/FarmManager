# Building Your Own EternalFarm API

## 🎯 Overview

You can extend your existing Farm Manager into a full EternalFarm-like API service. Your current infrastructure already provides 80% of what's needed!

## 📋 Current Infrastructure Analysis

### ✅ What You Already Have:
- **Agent Management**: Registration, status tracking, heartbeats
- **Account System**: User accounts with categories and proxies  
- **Task Management**: Bot tasks, scheduling, execution tracking
- **Database**: Prisma schema with MySQL backend
- **API Framework**: REST endpoints with authentication
- **Real-time Updates**: WebSocket broadcasting
- **Docker Deployment**: Container-based infrastructure

### 🔧 What Needs Enhancement:

1. **Multi-tenant Architecture** 
2. **API Key Management System**
3. **Agent Registration & Authentication**
4. **Billing/Subscription System**
5. **Advanced Monitoring & Analytics**
6. **Rate Limiting & Security**

## 🏗️ Implementation Plan

### Phase 1: Multi-Tenant Foundation

#### 1.1 Database Schema Updates

Add to your existing Prisma schema:

```prisma
model User {
  id              Int       @id @default(autoincrement())
  email           String    @unique
  username        String    @unique
  password_hash   String
  subscription_tier String  @default("free") // free, pro, enterprise
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  
  // API Keys for this user
  api_keys        ApiKey[]
  
  // User's agents
  agents          Agent[]
  accounts        Account[]
  
  @@map("users")
}

model ApiKey {
  id          Int       @id @default(autoincrement())
  user_id     Int
  key_hash    String    @unique
  name        String    // "Main API Key", "Agent Key", etc.
  permissions String[]  // ["agents:read", "accounts:write", etc.]
  last_used   DateTime?
  expires_at  DateTime?
  is_active   Boolean   @default(true)
  created_at  DateTime  @default(now())
  
  user        User      @relation(fields: [user_id], references: [id])
  
  @@map("api_keys")
}

// Update existing Agent model
model Agent {
  id              Int       @id @default(autoincrement())
  user_id         Int       // Associate with user
  name            String
  auth_token      String    @unique // Agent's auth token
  status          String    @default("offline")
  last_seen       DateTime?
  ip_address      String?
  
  // Agent capabilities
  capabilities    String[]  // ["p2p", "browser", "api", etc.]
  max_accounts    Int       @default(10)
  
  // Monitoring
  cpu_usage       Float?
  memory_usage    Float?
  disk_usage      Float?
  
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  
  user            User      @relation(fields: [user_id], references: [id])
  accounts        Account[]
  tasks           Task[]
  
  @@map("agents")
}
```

#### 1.2 API Key Management System

Create `/api/v1/auth/` endpoints:

```javascript
// Generate API key for user
app.post('/api/v1/auth/keys', authenticateUser, async (req, res) => {
    const { name, permissions, expires_at } = req.body;
    const user_id = req.user.id;
    
    // Generate secure API key
    const apiKey = generateSecureKey(); // 64-char random string
    const keyHash = await bcrypt.hash(apiKey, 12);
    
    const newKey = await prisma.apiKey.create({
        data: {
            user_id,
            key_hash: keyHash,
            name,
            permissions,
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
});
```

### Phase 2: Agent Registration API

#### 2.1 Agent Registration Endpoint

```javascript
// Agent registration - similar to EternalFarm
app.post('/api/v1/agents/register', validateApiKey, async (req, res) => {
    const { name, capabilities, system_info } = req.body;
    const user_id = req.user.id;
    
    // Generate agent auth token
    const authToken = generateSecureKey();
    
    const agent = await prisma.agent.create({
        data: {
            user_id,
            name,
            auth_token: authToken,
            capabilities,
            ip_address: req.ip,
            system_info: JSON.stringify(system_info)
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
});

// Agent heartbeat - keeps agent alive
app.post('/api/v1/agents/:id/heartbeat', validateAgentToken, async (req, res) => {
    const { id } = req.params;
    const { status, cpu_usage, memory_usage, disk_usage } = req.body;
    
    await prisma.agent.update({
        where: { id: parseInt(id) },
        data: {
            status: status || 'online',
            last_seen: new Date(),
            cpu_usage,
            memory_usage,
            disk_usage
        }
    });
    
    res.json({ success: true });
});
```

### Phase 3: Multi-User API Endpoints

#### 3.1 User-Scoped Agent Management

```javascript
// Get user's agents
app.get('/api/v1/agents', validateApiKey, async (req, res) => {
    const agents = await prisma.agent.findMany({
        where: { user_id: req.user.id },
        include: {
            accounts: true,
            tasks: {
                where: { status: 'running' }
            }
        }
    });
    
    res.json({
        success: true,
        data: agents
    });
});

// Get user's accounts
app.get('/api/v1/accounts', validateApiKey, async (req, res) => {
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
});
```

### Phase 4: Advanced Features

#### 4.1 Subscription & Limits System

```javascript
// Check user limits before creating accounts/agents
async function checkUserLimits(user_id, resource_type) {
    const user = await prisma.user.findUnique({
        where: { id: user_id },
        include: {
            agents: true,
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
    
    const userLimits = limits[user.subscription_tier];
    
    if (resource_type === 'agent' && user._count.agents >= userLimits.agents) {
        throw new Error('Agent limit reached for your subscription');
    }
    
    if (resource_type === 'account' && user._count.accounts >= userLimits.accounts) {
        throw new Error('Account limit reached for your subscription');
    }
    
    return true;
}
```

#### 4.2 Analytics & Monitoring API

```javascript
// User dashboard stats
app.get('/api/v1/stats/dashboard', validateApiKey, async (req, res) => {
    const user_id = req.user.id;
    
    const stats = await prisma.$transaction([
        // Agent stats
        prisma.agent.count({ where: { user_id } }),
        prisma.agent.count({ where: { user_id, status: 'online' } }),
        
        // Account stats  
        prisma.account.count({ 
            where: { agent: { user_id } }
        }),
        prisma.account.count({ 
            where: { agent: { user_id }, status: 'running' }
        }),
        
        // Task stats
        prisma.task.count({
            where: { agent: { user_id } }
        }),
        prisma.task.count({
            where: { agent: { user_id }, status: 'completed' }
        })
    ]);
    
    res.json({
        success: true,
        data: {
            agents: { total: stats[0], online: stats[1] },
            accounts: { total: stats[2], running: stats[3] },
            tasks: { total: stats[4], completed: stats[5] }
        }
    });
});
```

## 🔐 Security Implementation

### Authentication Middleware

```javascript
async function validateApiKey(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Invalid authorization header' });
    }
    
    const apiKey = authHeader.split(' ')[1];
    
    // Hash the provided key to compare with stored hash
    const apiKeyRecord = await prisma.apiKey.findFirst({
        where: {
            is_active: true,
            OR: [
                { expires_at: null },
                { expires_at: { gte: new Date() } }
            ]
        },
        include: { user: true }
    });
    
    // Verify key (you'd need to implement secure comparison)
    if (!apiKeyRecord || !await bcrypt.compare(apiKey, apiKeyRecord.key_hash)) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    
    // Update last used
    await prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { last_used: new Date() }
    });
    
    req.user = apiKeyRecord.user;
    req.apiKey = apiKeyRecord;
    next();
}
```

## 🚀 Deployment Architecture

### Multi-Service Setup

```yaml
# docker-compose.yml for your EternalFarm API
version: '3.8'

services:
  eternalfarm-api:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://user:pass@mysql:3306/eternalfarm
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-secret-key
    ports:
      - "3000:3000"
    depends_on:
      - mysql
      - redis
    
  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=rootpass
      - MYSQL_DATABASE=eternalfarm
    volumes:
      - mysql_data:/var/lib/mysql
    
  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
```

## 📈 Monetization Features

### Subscription Tiers

```javascript
const SUBSCRIPTION_TIERS = {
    free: {
        price: 0,
        agents: 1,
        accounts: 10,
        api_calls_per_hour: 100,
        features: ['basic_monitoring']
    },
    pro: {
        price: 29, // per month
        agents: 5,
        accounts: 100,
        api_calls_per_hour: 1000,
        features: ['advanced_monitoring', 'webhooks', 'priority_support']
    },
    enterprise: {
        price: 99,
        agents: 50,
        accounts: 1000,
        api_calls_per_hour: 10000,
        features: ['all_features', 'custom_integrations', 'dedicated_support']
    }
};
```

## 🎯 Next Steps

1. **Extend your current Prisma schema** with multi-tenant models
2. **Add user registration/authentication** system
3. **Implement API key generation** and validation
4. **Create agent registration** endpoints
5. **Add rate limiting** and security measures
6. **Build a dashboard** for users to manage their agents
7. **Add billing integration** (Stripe, PayPal)

## 💡 Key Advantages of Your Own API

- **Full Control**: No dependency on external services
- **Custom Features**: Build exactly what you need
- **Revenue Stream**: Monetize your agent management system
- **Privacy**: Keep all data under your control
- **Scalability**: Scale according to your needs

Your Farm Manager is already 80% of the way there! You just need to add multi-tenancy and user management on top of your existing infrastructure.

Would you like me to help implement any specific part of this system? 