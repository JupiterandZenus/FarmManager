# 🚀 Farm Manager Live Deployment Guide

## ✅ Pre-Deployment Checklist

### GitHub Status
- [x] Code pushed to GitHub repository: `https://github.com/swarnes1/farm-admin.git`
- [x] Prisma client import issues resolved
- [x] Docker configuration optimized for Unraid
- [x] Test server verified working locally

### Unraid Server Requirements
- [x] Portainer installed and accessible
- [x] Docker and Docker Compose available
- [x] Port 3333 available for Farm Manager
- [x] LinuxServer MariaDB image compatibility

## 🎯 Deployment Steps

### Step 1: Access Portainer
1. Navigate to your Unraid Portainer interface
2. Go to **Stacks** section
3. Click **Add Stack**

### Step 2: Create New Stack
1. **Stack Name**: `farm-manager-v2`
2. **Build Method**: Select **Repository**
3. **Repository URL**: `https://github.com/swarnes1/farm-admin.git`
4. **Compose Path**: `docker-compose.unraid-internal.yml`
5. **Branch**: `main`

### Step 3: Environment Variables (Optional)
Add these if you want to customize:
```
DISCORD_WEBHOOK_URL=your_discord_webhook_url_here
```

### Step 4: Deploy Stack
1. Click **Deploy the Stack**
2. Wait for the build process to complete
3. Monitor the logs for any issues

## 🔍 Verification Steps

### Health Checks
1. **Farm Manager Health**: `http://192.168.1.104:3333/health`
2. **Web Interface**: `http://192.168.1.104:3333/`
3. **API Test**: `http://192.168.1.104:3333/api/v1/accounts` (with Bearer token)

### Expected Response
```json
{
  "status": "healthy",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ",
  "database": "connected"
}
```

## 🛠️ Configuration Details

### Services
- **farm-admin**: Main application (Port 3333)
- **mariadb**: LinuxServer MariaDB database (Internal only)

### Database Configuration
- **Host**: `mariadb:3306`
- **Database**: `farmboy_db`
- **User**: `farmboy`
- **Password**: `Sntioi004!`

### Network
- **Internal Network**: `farm-admin-network`
- **External Access**: Port 3333 only

## 🚨 Troubleshooting

### If Deployment Fails
1. Check Portainer logs for build errors
2. Verify GitHub repository is accessible
3. Ensure no port conflicts on 3333
4. Check MariaDB health status

### Common Issues
- **Prisma Client Error**: Should be resolved with latest fixes
- **Database Connection**: Wait for MariaDB to fully initialize (3-5 minutes)
- **Port Conflicts**: Change external port if 3333 is in use

### Log Commands
```bash
# Check container logs
docker logs farm-manager-v2_farm-admin_1

# Check MariaDB logs
docker logs farm-manager-v2_mariadb_1

# Check container status
docker ps | grep farm-manager
```

## 🎉 Post-Deployment

### Access Points
- **Main Interface**: `http://192.168.1.104:3333/`
- **Health Check**: `http://192.168.1.104:3333/health`
- **API Documentation**: Available in README.md

### Features Available
- ⚔️ Client Launcher with OSRS Theme
- 🏰 Account Management System
- 🔮 Proxy Management
- 📜 Task Automation
- 🗝️ P2P Master AI Timer
- 🎯 Real-time Status Monitoring

### API Key
```
Bearer rBoolrmakSG77Ol5CidsnWvmdyvjpzXfppuR0J4e-LYtn2zZLABzIyJVn5TeHpuv
```

## 📊 Monitoring

### Health Monitoring
The application includes built-in health checks that monitor:
- Database connectivity
- Application status
- Service availability

### Discord Notifications
If configured, the application will send notifications for:
- Startup/shutdown events
- Critical errors
- Status changes

---

## 🔄 Update Process

To update the live deployment:
1. Push changes to GitHub
2. In Portainer, go to your stack
3. Click **Update Stack**
4. Select **Pull and redeploy**
5. Click **Update**

---

**Deployment Date**: $(date)
**Version**: Farm Manager v0.1 with Prisma fixes
**Status**: Ready for production deployment 🚀 