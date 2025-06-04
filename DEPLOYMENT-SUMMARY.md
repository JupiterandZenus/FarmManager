# 🚀 Farmboy Docker Deployment Summary

## 📁 Files Created for Docker Deployment

| File | Purpose | Description |
|------|---------|-------------|
| `Dockerfile` | Container Definition | Defines how to build the Farmboy application container |
| `docker-compose.yml` | Multi-Container Setup | Orchestrates both app and database containers |
| `docker-entrypoint.sh` | Startup Script | Handles database migrations and app initialization |
| `.dockerignore` | Build Optimization | Excludes unnecessary files from Docker build context |
| `deploy.sh` | Deployment Automation | Bash script for easy deployment and management |
| `README-Docker.md` | Detailed Guide | Comprehensive deployment instructions for Unraid |

## 🎯 Quick Deployment Options

### Option 1: Local Testing (Windows/Docker Desktop)
```bash
# Build and run locally
docker build -t farmboy-app:latest .
docker-compose up -d

# Access at: http://localhost:3000
```

### Option 2: Unraid Manual Deployment
```bash
# 1. Transfer files to Unraid
scp -r "C:\Users\SupScotty\Documents\Farmboy 0.1\*" root@YOUR_UNRAID_IP:/mnt/user/appdata/farmboy/

# 2. SSH into Unraid and deploy
ssh root@YOUR_UNRAID_IP
cd /mnt/user/appdata/farmboy
chmod +x deploy.sh
./deploy.sh
```

### Option 3: Unraid Docker Template

Use the XML templates provided in `README-Docker.md` to create containers through the Unraid WebUI.

## 🔧 Environment Configuration

### Required Environment Variables
```env
NODE_ENV=production
DATABASE_URL=mysql://farmboy:farmboy_password@farmboy-db:3306/farmboy_db
API_KEY=rBoolrmakSG77Ol5CidsnWvmdyvjpzXfppuR0J4e-LYtn2zZLABzIyJVn5TeHpuv
PORT=3333
```

### Database Configuration
```env
MYSQL_ROOT_PASSWORD=root_password_change_me
MYSQL_DATABASE=farmboy_db
MYSQL_USER=farmboy
MYSQL_PASSWORD=farmboy_password
```

## 🌐 Network Configuration

### Ports
- **3333**: Farmboy Web Interface
- **3306**: MariaDB Database (internal)

### Volumes
- **App Data**: `/mnt/user/appdata/farmboy` → `/app`
- **Database**: `/mnt/user/appdata/farmboy-db` → `/var/lib/mysql`

## 🚀 Deployment Commands

### Using the Deploy Script
```bash
# Full deployment
./deploy.sh

# Build only
./deploy.sh build

# Start containers
./deploy.sh start

# View logs
./deploy.sh logs

# Stop containers
./deploy.sh stop

# Restart
./deploy.sh restart

# Cleanup
./deploy.sh clean
```

### Manual Docker Commands
```bash
# Build image
docker build -t farmboy-app:latest .

# Start with compose
docker-compose up -d

# View logs
docker-compose logs -f farmboy-app

# Stop containers
docker-compose down

# Check status
docker-compose ps
```

## 🔒 Security Recommendations

1. **Change Default Passwords**
   - Update `MYSQL_ROOT_PASSWORD`
   - Update `MYSQL_PASSWORD`
   - Consider generating a new `API_KEY`

2. **Network Security**
   - Use Unraid's built-in firewall
   - Consider VPN access for external connections
   - Limit port exposure if not needed externally

3. **Data Protection**
   - Regular database backups
   - Secure volume permissions
   - Monitor container logs

## 📊 Monitoring and Maintenance

### Health Checks
- Built-in Docker health checks
- Application responds on port 3333
- Database connectivity verification

### Backup Strategy
```bash
# Database backup
docker exec farmboy-db mysqldump -u farmboy -pfarmboy_password farmboy_db > backup.sql

# Application data backup
tar -czf farmboy-backup.tar.gz /mnt/user/appdata/farmboy
```

### Updates
```bash
# Update application
cd /mnt/user/appdata/farmboy
git pull  # if using git
./deploy.sh restart
```

## 🐛 Troubleshooting

### Common Issues

1. **Port 3333 already in use**
   ```bash
   # Change port in docker-compose.yml
   ports:
     - "3334:3333"  # Use port 3334 instead
   ```

2. **Database connection failed**
   ```bash
   # Check database container
   docker logs farmboy-db
   
   # Verify network connectivity
   docker exec farmboy-app ping farmboy-db
   ```

3. **Application won't start**
   ```bash
   # Check application logs
   docker logs farmboy-app
   
   # Verify environment variables
   docker exec farmboy-app env | grep -E "(DATABASE_URL|API_KEY)"
   ```

### Log Locations
- **Application**: `docker logs farmboy-app`
- **Database**: `docker logs farmboy-db`
- **Compose**: `docker-compose logs`

## 📞 Support Resources

### Documentation
- `README-Docker.md` - Detailed deployment guide
- Docker Compose documentation
- Unraid Docker documentation

### Useful Commands
```bash
# Container shell access
docker exec -it farmboy-app sh

# Database shell access
docker exec -it farmboy-db mysql -u farmboy -p

# Resource usage
docker stats farmboy-app farmboy-db

# Network inspection
docker network ls
docker network inspect farmboy_farmboy-network
```

## ✅ Deployment Checklist

- [ ] Docker and Docker Compose installed
- [ ] Project files transferred to deployment location
- [ ] Environment variables configured
- [ ] Ports available (3333, 3306)
- [ ] Storage volumes configured
- [ ] Security settings reviewed
- [ ] Backup strategy planned
- [ ] Monitoring setup configured

## 🎉 Success Indicators

After successful deployment, you should see:
- ✅ Containers running: `docker-compose ps`
- ✅ Application accessible: `http://YOUR_SERVER_IP:3333`
- ✅ Database connected: Check application logs
- ✅ All features working: Test account creation, etc.

---

**Your Farmboy application is now ready for production deployment on Unraid! 🌱**

For detailed step-by-step instructions, see `README-Docker.md`.

# Farm Manager Deployment Summary

## Latest Updates

This version includes critical fixes and improvements to the Farm Manager system:

1. **Database Authentication Fix**
   - Changed to use `farmboy` user instead of `root`
   - Added `MYSQL_ROOT_HOST=%` to allow connections from any host
   - Removed problematic volume mounts that could cause conflicts

2. **Missing account_categories Table Fix**
   - Added scripts to create the missing table causing Prisma seeding errors
   - Files: `fix-account-categories-table.sql`, `fix-database-schema.sh`, `fix-database-schema.ps1`, `fix-database-schema.bat`

3. **X11 Display Server Improvements**
   - Modified `Entry.sh` to proactively start and restart X11
   - Reduced timeout and continued execution even if X11 isn't ready
   - Added error handling to prevent hanging

4. **Environment Labels**
   - Added comprehensive Docker labels for better container management
   - Database-specific labels for both containers
   - Service-specific labels for monitoring and documentation

5. **Configuration Updates**
   - Fixed database URL in `supervisord.conf`
   - Added environment variables for database connection in `docker-compose.yml`
   - Updated Portainer stack files with consistent configuration

## Deployment Instructions

### Method 1: Docker Compose

```bash
# Pull the latest changes
git pull

# Deploy using Docker Compose
docker-compose up -d
```

### Method 2: Manual Build and Deploy

```bash
# Pull the latest changes
git pull

# Build the Docker image
docker build -t supscotty/farmboy:latest .

# Push to Docker Hub (optional)
docker push supscotty/farmboy:latest

# Deploy using Docker Compose
docker-compose up -d
```

### Method 3: Portainer Stack

1. Login to Portainer
2. Navigate to Stacks
3. Create a new stack or update existing
4. Use the content from `portainer-farmmanager-stack.yml`
5. Deploy the stack

## Verification

After deployment, verify the system is working properly:

1. Web interface: http://your-server:3333
2. VNC interface: http://your-server:8080/vnc.html
3. Database connection: Test with the farmboy user
4. EternalFarm integration: Check agent, checker, and automator services

## Troubleshooting

If you encounter issues:

1. Check container logs: `docker-compose logs`
2. Verify database connection: `docker exec -it farm-admin-mariadb-fresh mysql -u farmboy -pSntioi004! farmboy_db -e "SHOW TABLES;"`
3. Restart services: `docker-compose restart`
4. Run the test script: `node test-launch-sequence.js` 