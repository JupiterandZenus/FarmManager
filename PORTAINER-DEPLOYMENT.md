# 🚀 Farm Manager - Portainer Deployment Guide

## Quick Deploy with Portainer

This guide will help you deploy Farm Manager 0.1 using Portainer with all environment variables pre-configured for easy setup.

### 📋 Prerequisites

- Portainer installed and running
- Docker and Docker Compose available
- Discord webhook URL (optional, for notifications)

### 🎯 One-Click Deployment

1. **Open Portainer** and navigate to **Stacks**
2. **Click "Add Stack"**
3. **Name your stack**: `farm-manager`
4. **Select "Repository"** as the build method
5. **Repository URL**: `https://github.com/swarnes1/farm-admin`
6. **Compose path**: `docker-compose.portainer.yml`
7. **Configure Environment Variables** (see below)
8. **Click "Deploy the stack"**

### 🔧 Environment Variables Configuration

The following environment variables are automatically detected by Portainer from the YML labels:

#### **Farm Admin Service**
| Variable | Default Value | Description |
|----------|---------------|-------------|
| `NODE_ENV` | `production` | Application environment (development/production) |
| `DATABASE_URL` | `mysql://farmboy:Sntioi004!@mariadb:3306/farmboy_db` | MySQL database connection string |
| `API_KEY` | `rBoolrmakSG77Ol5CidsnWvmdyvjpzXfppuR0J4e-LYtn2zZLABzIyJVn5TeHpuv` | API authentication key for Farm Admin |
| `PORT` | `3000` | Internal application port |
| `DISCORD_WEBHOOK_URL` | *(empty)* | Discord webhook URL for notifications (optional) |

#### **MariaDB Service**
| Variable | Default Value | Description |
|----------|---------------|-------------|
| `MYSQL_ROOT_PASSWORD` | `Sntioi004!` | MySQL root user password |
| `MYSQL_DATABASE` | `farmboy_db` | Default database name |
| `MYSQL_USER` | `farmboy` | MySQL application user |
| `MYSQL_PASSWORD` | `Sntioi004!` | MySQL application user password |

### 🔔 Discord Notifications Setup (Optional)

To enable Discord notifications when Farm Manager starts/stops:

1. **Create a Discord Webhook**:
   - Go to your Discord server settings
   - Navigate to **Integrations** → **Webhooks**
   - Click **New Webhook**
   - Copy the webhook URL

2. **Add to Portainer**:
   - In the environment variables section
   - Set `DISCORD_WEBHOOK_URL` to your webhook URL
   - Example: `https://discord.com/api/webhooks/123456789/abcdef123456`

### 🌐 Access Your Application

After deployment:
- **Web Interface**: `http://your-server-ip:3333`
- **API Endpoint**: `http://your-server-ip:3333/api/v1/`
- **Health Check**: `http://your-server-ip:3333/health`

### 📊 Features Included

- ✅ **Client Launcher** with P2P Master AI Timer
- ✅ **Account Management** (CRUD operations)
- ✅ **Proxy Management** with categories
- ✅ **Task Management** and automation
- ✅ **Agent and Bot Management**
- ✅ **Prime Link Request handling**
- ✅ **Discord Notifications** (startup/shutdown)
- ✅ **Health Monitoring** with automatic restarts
- ✅ **MariaDB Database** with persistent storage

### 🔒 Security Features

- Non-root container execution
- API key authentication
- CORS protection
- Health checks and auto-restart
- Secure database credentials

### 🛠️ Troubleshooting

#### ❌ MariaDB Container Unhealthy (Most Common Issue)

**Error**: `dependency failed to start: container farmin-admin-mariadb-1 is unhealthy`

**Cause**: MariaDB health check failing during initialization

**Solutions** (try in order):

1. **⏰ Wait Longer (Recommended First Step)**
   ```bash
   # MariaDB can take 2-3 minutes to fully initialize
   # Check logs to see initialization progress:
   docker logs -f $(docker ps --filter 'name=mariadb' --format '{{.Names}}' | head -1)
   
   # Look for this message: "ready for connections"
   ```

2. **🔄 Restart the Stack**
   - In Portainer: Go to **Stacks** → **farm-manager** → **Stop** → **Start**
   - Or via command line:
   ```bash
   docker-compose -f docker-compose.portainer.yml restart
   ```

3. **🗑️ Clean Restart (If Persistent Issues)**
   ```bash
   # Stop the stack in Portainer first, then:
   docker volume rm farm-manager_mariadb_data
   # Redeploy the stack in Portainer
   ```

4. **💾 Check System Resources**
   ```bash
   # Check disk space (MariaDB needs space to initialize)
   df -h
   
   # Check memory usage (minimum 512MB recommended)
   docker stats
   ```

5. **🔧 Manual Health Check**
   ```bash
   # Test if MariaDB is actually working:
   docker exec $(docker ps --filter 'name=mariadb' --format '{{.Names}}' | head -1) \
     mysqladmin ping -h localhost -u farmboy -pSntioi004!
   ```

#### Container Won't Start
1. Check Portainer logs for the farm-admin container
2. Verify database connection in MariaDB container logs
3. Ensure ports 3333 is available

#### Database Connection Issues
1. Wait for MariaDB health check to pass (30-60 seconds)
2. Check MariaDB container logs
3. Verify database credentials match

#### Discord Notifications Not Working
1. Verify webhook URL is correct
2. Check container logs for Discord errors
3. Test webhook URL manually

### 🚨 Emergency Recovery Steps

If your deployment is completely stuck:

1. **Stop Everything**:
   - In Portainer: Stop the stack
   - Or: `docker-compose -f docker-compose.portainer.yml down`

2. **Clean Volumes** (⚠️ This will delete all data):
   ```bash
   docker volume rm farm-manager_mariadb_data
   ```

3. **Redeploy**:
   - In Portainer: Deploy the stack again
   - Wait 3-5 minutes for full initialization

### 📊 Health Check Commands

```bash
# Check all containers status
docker ps --filter 'name=farm'

# View MariaDB logs
docker logs -f $(docker ps --filter 'name=mariadb' --format '{{.Names}}' | head -1)

# View Farm Admin logs  
docker logs -f $(docker ps --filter 'name=farm-admin' --format '{{.Names}}' | head -1)

# Test application health
curl http://localhost:3333/health

# Test MariaDB directly
docker exec $(docker ps --filter 'name=mariadb' --format '{{.Names}}' | head -1) \
  mysql -u farmboy -pSntioi004! -e "SELECT 1;"
```

### 📝 Manual Docker Compose

If you prefer manual deployment, use this command:

```bash
# Clone the repository
git clone https://github.com/swarnes1/farm-admin.git
cd farm-admin

# Set your Discord webhook (optional)
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_URL"

# Deploy with Docker Compose
docker-compose -f docker-compose.portainer.yml up -d
```

### 🔄 Updates

To update Farm Manager:
1. Go to your stack in Portainer
2. Click **Editor**
3. Click **Update the stack**
4. Portainer will pull the latest code and redeploy

### 📞 Support

- **GitHub Issues**: [https://github.com/swarnes1/farm-admin/issues](https://github.com/swarnes1/farm-admin/issues)
- **Documentation**: Check the README.md in the repository

---

**🎉 That's it! Your Farm Manager should now be running and accessible at `http://your-server-ip:3333`** 