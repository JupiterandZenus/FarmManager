# API Collector and Updater System

## Overview

The Farm Manager now includes a comprehensive **API Collector and Updater System** that enables bi-directional synchronization with the EternalFarm API. This system automatically collects data from EternalFarm, tracks local changes, and pushes updates back to maintain data consistency.

## Features

### 🔄 Bi-directional Synchronization
- **Pull**: Automatically fetch agent data from EternalFarm API
- **Push**: Send local changes back to EternalFarm API
- **Merge**: Intelligent conflict resolution and data merging

### 📊 Real-time Statistics
- System performance monitoring
- Agent status aggregation
- Resource usage tracking
- Connection monitoring

### 🚀 Automatic Operations
- Scheduled sync every 5 minutes
- Real-time WebSocket broadcasts
- Error handling and retry logic
- Discord notifications for sync status

## API Endpoints

### Agent Management

#### GET /api/v1/agents
```json
{
  "data": [
    {
      "id": 1,
      "name": "Scott",
      "status": "offline",
      "eternal_farm_id": "agent_123",
      "needs_sync": false,
      "last_synced": "2024-01-20T10:30:00Z",
      "cpu_usage": 45.2,
      "memory_usage": 67.8,
      "disk_usage": 23.1,
      "auth_key": "P52FE7-I2G19W-C2S4R8"
    }
  ]
}
```

### Synchronization Endpoints

#### POST /api/v1/agents/sync
Manual sync (pull only) from EternalFarm API
```bash
curl -X POST http://localhost:3000/api/v1/agents/sync \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### POST /api/v1/agents/sync/bidirectional
Complete bi-directional sync (pull + push + statistics)
```bash
curl -X POST http://localhost:3000/api/v1/agents/sync/bidirectional \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### POST /api/v1/agents/sync/push
Push pending changes to EternalFarm API
```bash
curl -X POST http://localhost:3000/api/v1/agents/sync/push \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Agent Updates

#### PUT /api/v1/agents/{id}/update
Update agent and mark for sync
```bash
curl -X PUT http://localhost:3000/api/v1/agents/1/update \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "online",
    "cpu_usage": 65.4,
    "memory_usage": 78.2,
    "disk_usage": 34.7
  }'
```

### System Statistics

#### GET /api/v1/system/statistics
Get comprehensive system statistics
```bash
curl http://localhost:3000/api/v1/system/statistics \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Response:
```json
{
  "data": {
    "timestamp": "2024-01-20T10:30:00Z",
    "agents": {
      "total": 3,
      "online": 1,
      "offline": 2,
      "average_cpu": 45.6,
      "average_memory": 67.2,
      "average_disk": 28.9
    },
    "accounts": {
      "total": 15,
      "completed_tasks": 8
    },
    "server": {
      "uptime": 86400,
      "memory": {
        "used": 125829120,
        "total": 536870912
      },
      "connected_clients": 2
    }
  }
}
```

## Configuration

### Environment Variables

Add these to your `config.env` file:

```env
# EternalFarm API Configuration
ETERNALFARM_AGENT_KEY=RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5
ETERNAL_API_URL=https://api.eternalfarm.net

# Discord Notifications (optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
```

### Database Schema

The system requires additional fields in the Agent table:

```sql
-- Sync tracking
eternal_farm_id VARCHAR(255)    -- Links to EternalFarm API
needs_sync BOOLEAN DEFAULT FALSE -- Marks agents needing sync
last_synced TIMESTAMP           -- Last successful sync time

-- Performance monitoring
cpu_usage FLOAT                 -- CPU usage percentage
memory_usage FLOAT              -- Memory usage percentage  
disk_usage FLOAT                -- Disk usage percentage

-- Authentication
auth_key VARCHAR(255)           -- EternalFarm agent key
```

## How It Works

### 1. Data Collection (Pull)
```javascript
// Fetch agents from EternalFarm API
const agents = await fetchEternalFarmAgents();

// Update local database
for (const agent of agents) {
  await prisma.agent.upsert({
    where: { name: agent.name },
    update: { status: agent.status, last_seen: agent.last_seen },
    create: { ...agent }
  });
}
```

### 2. Change Tracking (Push)
```javascript
// Find agents marked for sync
const modifiedAgents = await prisma.agent.findMany({
  where: { needs_sync: true }
});

// Push changes to EternalFarm API
for (const agent of modifiedAgents) {
  await pushAgentUpdateToEternalFarm(agent.eternal_farm_id, agent);
  await markAgentAsSynced(agent.id);
}
```

### 3. Automatic Scheduling
- **Bi-directional sync**: Every 5 minutes
- **Statistics collection**: Every 2 minutes  
- **Database monitoring**: Every 2 minutes
- **Initial sync**: 5 seconds after startup

## WebSocket Events

The system broadcasts real-time updates via WebSocket:

### Agent Updates
```json
{
  "type": "agents_updated",
  "data": {
    "count": 3,
    "timestamp": "2024-01-20T10:30:00Z"
  }
}
```

### Sync Completion
```json
{
  "type": "sync_completed", 
  "data": {
    "synced_count": 2,
    "timestamp": "2024-01-20T10:30:00Z"
  }
}
```

### System Statistics
```json
{
  "type": "system_statistics",
  "data": {
    "agents": { "total": 3, "online": 1 },
    "server": { "uptime": 86400 }
  }
}
```

## Testing

Use the included test script to verify functionality:

```bash
# Run comprehensive test suite
node test-api-collector.js
```

Tests include:
- ✅ Basic agent list retrieval
- ✅ System statistics collection  
- ✅ Manual sync operations
- ✅ Agent updates and marking
- ✅ Push pending changes
- ✅ Bi-directional sync
- ✅ WebSocket real-time updates

## Error Handling

### API Failures
- Automatic retry with exponential backoff
- Graceful degradation when EternalFarm API is unavailable
- Discord notifications for persistent failures

### Database Issues
- Connection monitoring and automatic reconnection
- Transaction rollback on sync conflicts
- Data integrity validation

### Sync Conflicts
- EternalFarm data takes precedence for status updates
- Local modifications preserved until successfully pushed
- Timestamp-based conflict resolution

## Monitoring and Logs

### Console Output
```
🔄 Starting bi-directional sync with EternalFarm API...
✅ Fetched 3 agents from EternalFarm API
✅ Synced 3 agents with database
📤 Found 1 agents with pending changes to sync
✅ Synced agent "Scott" to EternalFarm API
📊 Collecting system statistics...
✅ Bi-directional sync completed successfully
```

### Discord Notifications
- ✅ Successful sync completion (hourly)
- ⚠️ Sync errors and failures
- 🔴 System offline notifications
- 🔄 Startup and shutdown events

## Performance Optimization

### Database Indexes
```sql
CREATE INDEX idx_agent_eternal_farm_id ON Agent(eternal_farm_id);
CREATE INDEX idx_agent_needs_sync ON Agent(needs_sync);
CREATE INDEX idx_agent_last_synced ON Agent(last_synced);
```

### Batching and Caching
- Batch API requests to reduce overhead
- In-memory caching of frequently accessed data
- Intelligent sync scheduling based on change frequency

### Resource Management
- Connection pooling for database operations
- Request throttling for API calls
- Memory optimization for large datasets

## Security

### API Key Protection
- Environment variable storage
- No hardcoded credentials
- Secure key rotation support

### Data Validation
- Input sanitization for all API endpoints
- Schema validation for sync operations
- SQL injection prevention

### Access Control
- Bearer token authentication required
- Rate limiting on sync endpoints
- Audit logging for all sync operations

## Future Enhancements

### Planned Features
- 🔮 Conflict resolution UI
- 📈 Performance analytics dashboard
- 🎯 Selective sync by agent groups
- 🔄 Real-time sync (WebSocket to EternalFarm)
- 📊 Historical sync data tracking
- 🚨 Advanced error alerting
- 🔧 Sync configuration management

### Scalability
- Multi-instance sync coordination
- Distributed caching layer
- Async job processing
- Load balancing support

---

## Quick Start

1. **Configure Environment**
   ```bash
   cp env.example config.env
   # Edit config.env with your EternalFarm API key
   ```

2. **Update Database Schema**
   ```bash
   mysql -u root -p farmboy_db < setup_database.sql
   ```

3. **Start Server**
   ```bash
   npm start
   ```

4. **Test Sync**
   ```bash
   curl -X POST http://localhost:3000/api/v1/agents/sync/bidirectional \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

5. **Monitor Logs**
   Watch console output for sync status and any errors.

The API Collector and Updater System is now ready to maintain perfect synchronization between your Farm Manager and EternalFarm! 🚀 