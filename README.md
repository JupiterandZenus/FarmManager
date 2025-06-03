# 🚀 Farm Manager - Complete Production System

A comprehensive farm management system with hybrid Docker container support, VNC access, web dashboard, EternalFarm integration, and automated deployment capabilities.

## 📋 Table of Contents
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Portainer Deployment](#-portainer-deployment)
- [Configuration](#-configuration)
- [Services](#-services)
- [Troubleshooting](#-troubleshooting)
- [Development](#-development)

## ✨ Features

### 🖥️ **Hybrid Container System**
- **VNC Server** (Port 5900) - Remote desktop access
- **noVNC Web Interface** (Port 8080) - Browser-based VNC access
- **SSH Access** (Port 22) - Terminal access
- **Web Dashboard** (Port 3333) - Farm management interface

### 🌾 **Farm Management**
- **EternalFarm Integration** - Automated farming operations
- **Real-time Monitoring** - Live status updates
- **Agent Management** - Multiple agent support
- **CPU Management** - Automated resource optimization

### 🗄️ **Database & Storage**
- **MariaDB Database** - Persistent data storage
- **Prisma ORM** - Type-safe database operations
- **Redis Cache** - High-performance caching
- **Volume Persistence** - Data retention across restarts

### 🔧 **Process Management**
- **Supervisord** - Service orchestration
- **Health Checks** - Automatic service monitoring
- **Auto-restart** - Fault tolerance
- **Log Management** - Centralized logging

## 🚀 Quick Start

### Option 1: Portainer Deployment (Recommended)

1. **Create New Stack in Portainer:**
   - Go to **Stacks** → **+ Add Stack**
   - Name: `farmmanager-production`

2. **Use Quick Deploy Configuration:**
   ```yaml
   # Copy content from portainer-farmmanager-simple.yml
   ```

3. **Update Environment Variables:**
   ```yaml
   environment:
     API_KEY: "your-actual-secure-api-key"
     ETERNALFARM_AGENT_KEY: "your-actual-eternalfarm-key"
     ETERNAL_FARM_KEY: "your-actual-eternal-farm-key"
     ETERNAL_AUTH_KEY: "your-actual-eternal-auth-key"
   ```

4. **Deploy Stack** - It will build automatically from this GitHub repository!

### Option 2: Docker Compose

```bash
# Clone the repository
git clone https://github.com/JupiterandZenus/FarmManager.git
cd FarmManager

# Copy and edit environment file
cp farmmanager.env .env
# Edit .env with your actual values

# Deploy with Docker Compose
docker-compose -f portainer-farmmanager-simple.yml up -d
```

## 🐳 Portainer Deployment

### 📦 **Available Stack Configurations:**

#### **`portainer-farmmanager-simple.yml`** ⭐ *Recommended*
- **Self-contained** - All configuration in one file
- **GitHub build** - Builds directly from repository
- **Easy deployment** - Minimal setup required
- **Production ready** - Includes all services

#### **`portainer-farmmanager-stack.yml`** 🔧 *Advanced*
- **Environment file support** - Uses `farmmanager.env`
- **Flexible configuration** - External variable management
- **Complex deployments** - Multiple environment support

### 🔧 **Deployment Steps:**

1. **In Portainer Dashboard:**
   - Navigate to **Stacks**
   - Click **"+ Add Stack"**
   - Name: `farmmanager-production`

2. **Paste Configuration:**
   - Copy content from `portainer-farmmanager-simple.yml`
   - Update environment variables with your actual values

3. **Required Environment Variables:**
   ```yaml
   API_KEY: "generate-a-secure-random-string"
   ETERNALFARM_AGENT_KEY: "your-eternalfarm-agent-key"
   ETERNAL_FARM_KEY: "your-eternal-farm-key"
   ETERNAL_AUTH_KEY: "your-eternal-auth-key"
   VNC_PASSWORD: "your-vnc-password"
   ```

4. **Deploy Stack** - Portainer will:
   - Clone from GitHub repository
   - Build using `Dockerfile.hybrid`
   - Start all services
   - Set up networking and volumes

## ⚙️ Configuration

### 🔐 **Security Settings**
- Change default passwords in environment variables
- Use strong API keys (minimum 32 characters)
- Configure firewall rules for exposed ports
- Enable SSL/TLS for production deployments

### 🌐 **Network Configuration**
- **Port 3333**: Web Dashboard (HTTP)
- **Port 5900**: VNC Server (TCP)
- **Port 8080**: noVNC Web Interface (HTTP)
- **Port 22**: SSH Access (TCP)

### 💾 **Database Configuration**
```yaml
DATABASE_URL: "mysql://farmboy:password@mariadb:3306/farm_admin"
MYSQL_ROOT_PASSWORD: "SecureRootPassword2025!"
MYSQL_DATABASE: "farm_admin"
MYSQL_USER: "farmboy"
MYSQL_PASSWORD: "Sntioi004!"
```

## 🛠️ Services

### **Farm Manager Web Interface** (Port 3333)
- Real-time dashboard
- Agent management
- System monitoring
- Configuration management

Access: `http://your-server:3333`

### **VNC Remote Desktop** (Port 5900)
- Full desktop environment
- GUI application access
- Direct system interaction

Connect with VNC client to: `your-server:5900`

### **noVNC Web Interface** (Port 8080)
- Browser-based VNC access
- No client installation required
- Cross-platform compatibility

Access: `http://your-server:8080`

### **SSH Terminal Access** (Port 22)
- Command-line interface
- File management
- System administration

Connect: `ssh root@your-server`

## 🔍 Health Checks & Monitoring

### **Service Status Endpoints:**
- **Health Check**: `http://your-server:3333/health`
- **API Status**: `http://your-server:3333/api/status`
- **Database Status**: `http://your-server:3333/api/db/status`

### **Log Monitoring:**
```bash
# View container logs
docker logs farm-admin-hybrid

# View specific service logs
docker exec farm-admin-hybrid supervisorctl tail -f farmmanager
docker exec farm-admin-hybrid supervisorctl tail -f eternalfarm-checker
```

## 🐛 Troubleshooting

### **Common Issues:**

#### **Container Won't Start**
```bash
# Check container status
docker ps -a

# View container logs
docker logs farm-admin-hybrid

# Check Dockerfile build
docker build -t farmmanager -f Dockerfile.hybrid .
```

#### **Web Interface Not Loading**
- Verify port 3333 is accessible
- Check firewall settings
- Ensure container is running: `docker ps`
- Check service status: `curl http://localhost:3333/health`

#### **VNC Connection Failed**
- Verify port 5900 is open
- Check VNC password in environment variables
- Ensure X11 display is running
- Test with: `docker exec farm-admin-hybrid ps aux | grep vnc`

#### **Database Connection Issues**
```bash
# Test database connection
docker exec farm-admin-hybrid mysql -h mariadb -u farmboy -p farm_admin

# Check MariaDB container
docker logs farmmanager-mariadb-1
```

#### **EternalFarm API Issues**
- Verify API keys in environment variables
- Check network connectivity
- Review EternalFarm service logs: `docker exec farm-admin-hybrid supervisorctl tail eternalfarm-checker`

### **Service Management:**
```bash
# Enter container
docker exec -it farm-admin-hybrid bash

# Check all services
supervisorctl status

# Restart a service
supervisorctl restart farmmanager
supervisorctl restart eternalfarm-checker

# View service logs
supervisorctl tail -f farmmanager
```

## 🔧 Development

### **Local Development Setup:**
```bash
# Clone repository
git clone https://github.com/JupiterandZenus/FarmManager.git
cd FarmManager

# Install dependencies
npm install

# Set up database
npm run db:setup

# Start development server
npm run dev
```

### **Building Custom Image:**
```bash
# Build hybrid container
docker build -t farmmanager:latest -f Dockerfile.hybrid .

# Run locally
docker run -d \
  -p 3333:3333 \
  -p 5900:5900 \
  -p 8080:8080 \
  -e DATABASE_URL="your-database-url" \
  farmmanager:latest
```

### **Environment Variables Reference:**
```bash
# Application
NODE_ENV=production
PORT=3333
API_KEY=your-secure-api-key

# Database
DATABASE_URL=mysql://user:pass@host:port/database
MYSQL_ROOT_PASSWORD=secure-password
MYSQL_DATABASE=farm_admin
MYSQL_USER=farmboy
MYSQL_PASSWORD=secure-password

# EternalFarm
ETERNALFARM_AGENT_KEY=your-agent-key
ETERNAL_FARM_KEY=your-farm-key
ETERNAL_AUTH_KEY=your-auth-key

# VNC
VNC_PASSWORD=vnc-password
DISPLAY=:1

# System
TZ=America/New_York
```

## 📁 Project Structure

```
FarmManager/
├── 📄 README.md                          # This file
├── 🐳 Dockerfile.hybrid                  # Multi-service container
├── 🚀 docker-entrypoint-hybrid.sh       # Container startup script
├── ⚙️ supervisord.conf                   # Process management
├── 🌐 server.js                          # Node.js backend
├── 📱 app.js                             # Frontend application
├── 🎨 style.css                          # Web interface styles
├── 📄 index.html                         # Web dashboard
├── 📊 prisma/                            # Database schema & migrations
├── 🐳 docker-compose*.yml               # Various deployment configs
├── 📋 portainer-farmmanager-simple.yml  # Portainer stack (recommended)
├── 📋 portainer-farmmanager-stack.yml   # Portainer stack (advanced)
├── ⚙️ farmmanager.env                   # Environment template
├── 🧪 test-*.js                         # Test suite
└── 📚 *.md                              # Documentation files
```

## 🚀 Deployment Summary

✅ **Successfully Deployed Features:**
- Hybrid Dockerfile with VNC support ✓
- Fixed supervisord configuration ✓  
- Added zenity for GUI dialogs ✓
- Web interface file copying ✓
- Updated Java 8 installation ✓
- Proper X11 setup ✓
- MariaDB database integration ✓
- Redis caching support ✓
- Comprehensive documentation ✓

✅ **Production Ready:**
- All services functional
- Secret files excluded from repository
- GitHub Actions ready
- Portainer deployment tested
- Health checks implemented

## 📞 Support

For issues and questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review container logs: `docker logs farm-admin-hybrid`
3. Check service status: `docker exec farm-admin-hybrid supervisorctl status`
4. Create an issue in this repository

---

**Farm Manager** - Complete production system for automated farm management with hybrid container support, VNC access, and comprehensive monitoring.

## 🧪 Testing Workflow

Testing GitHub Actions CI/CD pipeline - Docker Hub integration! 🚀 