# 🚀 Farmboy Docker Deployment Guide for Unraid

This guide will help you deploy the Farmboy application to your Unraid server using Docker.

## 📋 Prerequisites

- Unraid server with Docker support
- SSH access to your Unraid server
- Basic knowledge of Docker and Unraid

## 🔧 Deployment Methods

### Method 1: Using Unraid Community Applications (Recommended)

1. **Install Community Applications Plugin** (if not already installed)
   - Go to Unraid WebUI → Apps → Install Community Applications

2. **Create Custom Template** (since this is a custom app)
   - Go to Docker tab → Add Container
   - Use the configuration below

### Method 2: Manual Docker Compose Deployment

#### Step 1: Transfer Files to Unraid

1. **SSH into your Unraid server:**
   ```bash
   ssh root@YOUR_UNRAID_IP
   ```

2. **Create application directory:**
   ```bash
   mkdir -p /mnt/user/appdata/farmboy
   cd /mnt/user/appdata/farmboy
   ```

3. **Transfer your project files** (use SCP, SFTP, or Unraid file manager)
   ```bash
   # From your Windows machine, copy the entire project
   scp -r "C:\Users\SupScotty\Documents\Farmboy 0.1\*" root@YOUR_UNRAID_IP:/mnt/user/appdata/farmboy/
   ```

#### Step 2: Deploy with Docker Compose

1. **Navigate to the application directory:**
   ```bash
   cd /mnt/user/appdata/farmboy
   ```

2. **Start the application:**
   ```bash
   docker-compose up -d
   ```

3. **Check the logs:**
   ```bash
   docker-compose logs -f farmboy-app
   ```

## 🐳 Unraid Docker Template Configuration

### Farmboy Application Container

```xml
<?xml version="1.0"?>
<Container version="2">
  <Name>Farmboy</Name>
  <Repository>farmboy-app:latest</Repository>
  <Registry>local</Registry>
  <Network>bridge</Network>
  <MyIP/>
  <Shell>sh</Shell>
  <Privileged>false</Privileged>
  <Support/>
  <Project/>
  <Overview>Farmboy - EternalFarm Management Interface</Overview>
  <Category>Tools:</Category>
  <WebUI>http://[IP]:[PORT:3000]/</WebUI>
  <TemplateURL/>
  <Icon>https://raw.githubusercontent.com/selfhosters/unRAID-CA-templates/master/templates/img/farmboy.png</Icon>
  <ExtraParams/>
  <PostArgs/>
  <CPUset/>
  <DateInstalled>1640995200</DateInstalled>
  <DonateText/>
  <DonateLink/>
  <Description>Farmboy is a web-based management interface for EternalFarm with support for accounts, proxies, bots, tasks, and more.</Description>
  <Networking>
    <Mode>bridge</Mode>
    <Publish>
      <Port>
        <HostPort>3000</HostPort>
        <ContainerPort>3000</ContainerPort>
        <Protocol>tcp</Protocol>
      </Port>
    </Publish>
  </Networking>
  <Data>
    <Volume>
      <HostDir>/mnt/user/appdata/farmboy</HostDir>
      <ContainerDir>/app</ContainerDir>
      <Mode>rw</Mode>
    </Volume>
  </Data>
  <Environment>
    <Variable>
      <Value>production</Value>
      <Name>NODE_ENV</Name>
      <Mode/>
    </Variable>
    <Variable>
      <Value>mysql://farmboy:farmboy_password@farmboy-db:3306/farmboy_db</Value>
      <Name>DATABASE_URL</Name>
      <Mode/>
    </Variable>
    <Variable>
      <Value>rBoolrmakSG77Ol5CidsnWvmdyvjpzXfppuR0J4e-LYtn2zZLABzIyJVn5TeHpuv</Value>
      <Name>API_KEY</Name>
      <Mode/>
    </Variable>
  </Environment>
  <Labels/>
  <Config Name="WebUI Port" Target="3000" Default="3000" Mode="tcp" Description="Web interface port" Type="Port" Display="always" Required="true" Mask="false">3000</Config>
  <Config Name="App Data" Target="/app" Default="/mnt/user/appdata/farmboy" Mode="rw" Description="Application data directory" Type="Path" Display="always" Required="true" Mask="false">/mnt/user/appdata/farmboy</Config>
  <Config Name="Database URL" Target="DATABASE_URL" Default="mysql://farmboy:farmboy_password@farmboy-db:3306/farmboy_db" Mode="" Description="Database connection string" Type="Variable" Display="always" Required="true" Mask="false">mysql://farmboy:farmboy_password@farmboy-db:3306/farmboy_db</Config>
  <Config Name="API Key" Target="API_KEY" Default="rBoolrmakSG77Ol5CidsnWvmdyvjpzXfppuR0J4e-LYtn2zZLABzIyJVn5TeHpuv" Mode="" Description="API authentication key" Type="Variable" Display="always" Required="true" Mask="true">rBoolrmakSG77Ol5CidsnWvmdyvjpzXfppuR0J4e-LYtn2zZLABzIyJVn5TeHpuv</Config>
</Container>
```

### MariaDB Container (if not using external database)

```xml
<?xml version="1.0"?>
<Container version="2">
  <Name>Farmboy-DB</Name>
  <Repository>mariadb:10.11</Repository>
  <Registry>https://hub.docker.com/</Registry>
  <Network>bridge</Network>
  <MyIP/>
  <Shell>sh</Shell>
  <Privileged>false</Privileged>
  <Support/>
  <Project/>
  <Overview>MariaDB database for Farmboy</Overview>
  <Category>Tools:</Category>
  <WebUI/>
  <TemplateURL/>
  <Icon>https://raw.githubusercontent.com/selfhosters/unRAID-CA-templates/master/templates/img/mariadb.png</Icon>
  <ExtraParams/>
  <PostArgs/>
  <CPUset/>
  <DateInstalled>1640995200</DateInstalled>
  <DonateText/>
  <DonateLink/>
  <Description>MariaDB database server for Farmboy application</Description>
  <Networking>
    <Mode>bridge</Mode>
    <Publish>
      <Port>
        <HostPort>3306</HostPort>
        <ContainerPort>3306</ContainerPort>
        <Protocol>tcp</Protocol>
      </Port>
    </Publish>
  </Networking>
  <Data>
    <Volume>
      <HostDir>/mnt/user/appdata/farmboy-db</HostDir>
      <ContainerDir>/var/lib/mysql</ContainerDir>
      <Mode>rw</Mode>
    </Volume>
  </Data>
  <Environment>
    <Variable>
      <Value>root_password_change_me</Value>
      <Name>MYSQL_ROOT_PASSWORD</Name>
      <Mode/>
    </Variable>
    <Variable>
      <Value>farmboy_db</Value>
      <Name>MYSQL_DATABASE</Name>
      <Mode/>
    </Variable>
    <Variable>
      <Value>farmboy</Value>
      <Name>MYSQL_USER</Name>
      <Mode/>
    </Variable>
    <Variable>
      <Value>farmboy_password</Value>
      <Name>MYSQL_PASSWORD</Name>
      <Mode/>
    </Variable>
  </Environment>
  <Labels/>
</Container>
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `DATABASE_URL` | Database connection string | `mysql://farmboy:farmboy_password@farmboy-db:3306/farmboy_db` |
| `API_KEY` | API authentication key | `rBoolrmakSG77Ol5CidsnWvmdyvjpzXfppuR0J4e-LYtn2zZLABzIyJVn5TeHpuv` |
| `PORT` | Application port | `3000` |

### Ports

| Port | Description |
|------|-------------|
| `3000` | Web interface |
| `3306` | MariaDB (if using separate container) |

### Volumes

| Host Path | Container Path | Description |
|-----------|----------------|-------------|
| `/mnt/user/appdata/farmboy` | `/app` | Application data |
| `/mnt/user/appdata/farmboy-db` | `/var/lib/mysql` | Database data |

## 🚀 Quick Start Commands

### Build and Deploy
```bash
# Navigate to project directory
cd /mnt/user/appdata/farmboy

# Build the Docker image
docker build -t farmboy-app:latest .

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f farmboy-app
```

### Management Commands
```bash
# Stop the application
docker-compose down

# Update the application
docker-compose pull
docker-compose up -d

# View container status
docker-compose ps

# Access container shell
docker-compose exec farmboy-app sh
```

## 🌐 Access Your Application

Once deployed, access Farmboy at:
- **Local Network**: `http://YOUR_UNRAID_IP:3000`
- **With Reverse Proxy**: `http://farmboy.local` (if configured)

## 🔒 Security Considerations

1. **Change Default Passwords**: Update the database passwords in the environment variables
2. **API Key**: Consider generating a new API key for production
3. **Network Security**: Use Unraid's built-in firewall or VPN access
4. **Regular Updates**: Keep the Docker images updated

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if database container is running
   docker ps | grep farmboy-db
   
   # Check database logs
   docker logs farmboy-db
   ```

2. **Application Won't Start**
   ```bash
   # Check application logs
   docker logs farmboy-app
   
   # Verify environment variables
   docker inspect farmboy-app | grep -A 20 "Env"
   ```

3. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :3000
   
   # Change the host port in docker-compose.yml
   ```

### Log Locations

- Application logs: `docker logs farmboy-app`
- Database logs: `docker logs farmboy-db`
- Unraid Docker logs: `/var/log/docker.log`

## 📊 Monitoring

### Health Checks

The application includes built-in health checks:
```bash
# Check application health
curl http://localhost:3000/

# Docker health status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Resource Usage

Monitor resource usage in Unraid WebUI:
- Go to Docker tab
- View CPU, Memory, and Network usage for each container

## 🔄 Updates and Maintenance

### Updating the Application

1. **Pull latest changes** to your project directory
2. **Rebuild the Docker image**:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Database Backups

```bash
# Create database backup
docker exec farmboy-db mysqldump -u farmboy -pfarmboy_password farmboy_db > backup.sql

# Restore database backup
docker exec -i farmboy-db mysql -u farmboy -pfarmboy_password farmboy_db < backup.sql
```

## 📞 Support

If you encounter issues:
1. Check the logs first
2. Verify all environment variables are set correctly
3. Ensure all required ports are available
4. Check Unraid system logs for Docker-related issues

---

**Happy farming! 🌱** 