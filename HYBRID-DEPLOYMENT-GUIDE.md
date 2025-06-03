# Hybrid Farm Manager + DreamBot Deployment Guide

This guide explains how to deploy the hybrid container that combines your Farm Manager web application with the Entry.sh DreamBot functionality in Portainer.

## 🎯 **What This Hybrid Container Includes**

### **Farm Manager (Port 3000)**
- ✅ Web interface for managing accounts, agents, and tasks
- ✅ EternalFarm API integration with bi-directional sync
- ✅ Discord notifications
- ✅ WebSocket real-time updates
- ✅ MariaDB database with Prisma ORM

### **DreamBot + Entry.sh (Port 5900)**
- ✅ VNC remote desktop access
- ✅ X11 virtual display
- ✅ DreamBot launcher integration
- ✅ EternalFarm tools (Checker, Browser Automator)
- ✅ Java environment with required dependencies
- ✅ SSH access (Port 2222)

## 🚀 **Deployment Steps**

### **1. Prepare Your Files**

Ensure you have these files in your project directory:
```
├── Dockerfile.hybrid
├── docker-entrypoint-hybrid.sh
├── supervisord.conf
├── Entry.sh
├── docker-compose.hybrid.yml
└── (all your existing Farm Manager files)
```

### **2. Deploy in Portainer**

1. **Open Portainer** and navigate to **Stacks**
2. **Click "Add Stack"**
3. **Name your stack**: `farm-admin-hybrid`
4. **Upload or paste** the `docker-compose.hybrid.yml` content
5. **Set environment variables** (optional):
   ```
   ETERNAL_FARM_KEY=your_checker_key_here
   ETERNAL_AUTH_KEY=your_browser_automator_key_here
   VNC_PASSWORD=your_vnc_password_here
   ```
6. **Click "Deploy the stack"**

### **3. Access Your Services**

After deployment, you can access:

- **Farm Manager Web Interface**: `http://your-server:3333`
- **VNC Remote Desktop**: `your-server:5900` (password: `vncpass` or your custom password)
- **SSH Access**: `ssh root@your-server -p 2222`
- **Database**: `your-server:3307`

## 🔧 **Configuration Options**

### **Environment Variables**

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ETERNAL_FARM_KEY` | EternalFarm Checker tool key | - | Optional |
| `ETERNAL_AUTH_KEY` | EternalFarm Browser Automator key | - | Optional |
| `VNC_PASSWORD` | VNC remote desktop password | `vncpass` | Optional |
| `NODE_ENV` | Application environment | `production` | Yes |
| `DATABASE_URL` | Database connection string | Auto-configured | Yes |

### **Port Mapping**

| Internal Port | External Port | Service |
|---------------|---------------|---------|
| 3000 | 3333 | Farm Manager Web Interface |
| 5900 | 5900 | VNC Remote Desktop |
| 22 | 2222 | SSH Access |
| 3306 | 3307 | MariaDB Database |

## 📊 **Monitoring and Logs**

### **View Logs in Portainer**
1. Go to **Containers**
2. Click on `farm-admin-hybrid`
3. Click **Logs** tab

### **Key Log Files Inside Container**
- `/var/log/farm-manager.out.log` - Farm Manager application logs
- `/var/log/entry.log` - Entry.sh DreamBot logs
- `/var/log/supervisord.log` - Supervisor process manager logs

### **Health Checks**
The container includes automatic health checks:
- **Farm Manager**: HTTP check on `http://localhost:3000/health`
- **Database**: MySQL ping check
- **Interval**: Every 30 seconds

## 🔍 **Troubleshooting**

### **Container Won't Start**
1. Check Portainer logs for build errors
2. Verify all required files are present
3. Check environment variable syntax

### **Farm Manager Not Accessible**
1. Verify port 3333 is not blocked by firewall
2. Check container logs for Node.js errors
3. Ensure database connection is working

### **VNC Not Working**
1. Verify port 5900 is accessible
2. Check if X11 and VNC processes started:
   ```bash
   docker exec -it farm-admin-hybrid ps aux | grep -E "(Xvfb|x11vnc)"
   ```

### **Entry.sh Not Running**
1. Check if Entry.sh file exists and is executable
2. View Entry.sh logs: `docker exec -it farm-admin-hybrid tail -f /var/log/entry.log`
3. Verify EternalFarm keys are set correctly

### **Database Connection Issues**
1. Wait for database to fully initialize (can take 2-3 minutes)
2. Check MariaDB container logs
3. Verify database credentials in environment variables

## 🛠️ **Advanced Configuration**

### **Custom Entry.sh**
To modify the Entry.sh behavior:
1. Edit the `Entry.sh` file in your project
2. Rebuild the container: `docker-compose -f docker-compose.hybrid.yml build`
3. Redeploy the stack

### **Additional Services**
To add more services to supervisord:
1. Edit `supervisord.conf`
2. Add new `[program:service-name]` sections
3. Rebuild and redeploy

### **Volume Persistence**
The hybrid container uses persistent volumes:
- `dreambot_data` - DreamBot configuration and data
- `vnc_data` - VNC configuration
- `mariadb_config` - Database data

## 🔐 **Security Considerations**

1. **Change default passwords**:
   - VNC password: Set `VNC_PASSWORD` environment variable
   - Database passwords: Update in docker-compose file

2. **Firewall configuration**:
   - Only expose necessary ports
   - Consider using VPN for VNC access

3. **SSH access**:
   - SSH is enabled on port 2222
   - Consider disabling if not needed

## 📈 **Performance Optimization**

1. **Resource allocation**:
   - Minimum 2GB RAM recommended
   - 2 CPU cores for optimal performance

2. **Storage**:
   - Use SSD storage for database volume
   - Regular database backups recommended

## 🆘 **Support**

If you encounter issues:
1. Check container logs in Portainer
2. Verify all environment variables are set correctly
3. Ensure all required ports are accessible
4. Review the troubleshooting section above

## 🎉 **Success Indicators**

Your hybrid container is working correctly when you see:
- ✅ Farm Manager accessible at `http://your-server:3333`
- ✅ VNC desktop accessible at `your-server:5900`
- ✅ Discord notifications working
- ✅ EternalFarm API sync functioning
- ✅ Database queries working in Farm Manager
- ✅ Entry.sh processes running (if keys are configured) 