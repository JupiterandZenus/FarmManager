# Farm Manager Local Testing Guide

## Prerequisites

1. **Docker Desktop** - Must be installed and running
2. **Git** - For cloning/managing the repository
3. **Web Browser** - For accessing the Farm Manager interface

## Quick Start

### 1. Start the Local Environment

**Windows:**
```bash
# Double-click start-local.bat or run in terminal:
start-local.bat
```

**Linux/Mac:**
```bash
# Make sure Docker is running, then:
docker-compose -f docker-compose.local.yml up --build -d
```

### 2. Access Your Services

Once started, you can access:

- **Farm Manager Web Interface**: http://localhost:3334
- **noVNC (Browser VNC)**: http://localhost:8081
- **VNC Direct Connection**: localhost:5901
- **Database**: localhost:3307

### 3. Stop the Environment

**Windows:**
```bash
stop-local.bat
```

**Linux/Mac:**
```bash
docker-compose -f docker-compose.local.yml down
```

## Configuration

### Environment Variables

Edit `local.env` to customize your local setup:

#### Required for Testing:
```bash
# DreamBot credentials (if testing bot launching)
DREAMBOT_USERNAME=your_dreambot_username
DREAMBOT_PASSWORD=your_dreambot_password

# Discord webhook (if testing notifications)
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

#### EternalFarm Keys (Already Configured):
```bash
AGENT_KEY=RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5
CHECKER_KEY=RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5
AUTOMATOR_KEY=RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5
```

## Testing Features

### 1. Individual EternalFarm Service Keys

The local environment is configured to test individual service keys:

- **Agent Service**: Uses `AGENT_KEY`
- **Checker Service**: Uses `CHECKER_KEY`
- **Automator Service**: Uses `AUTOMATOR_KEY`

#### Verify Key Setup:
```bash
# Check key configuration
docker exec farm-admin-local env | grep -E "(AGENT_KEY|CHECKER_KEY|AUTOMATOR_KEY)"
```

### 2. DreamBot Integration

Test bot launching functionality:

1. Set your DreamBot credentials in `local.env`
2. Access the web interface at http://localhost:3334
3. Navigate to the Bot Management section
4. Test launching a bot

### 3. VNC Access

Test remote desktop functionality:

- **Browser VNC**: http://localhost:8081
- **VNC Client**: Connect to localhost:5901

### 4. Database Access

Connect to the local database:

```bash
# Connection details:
Host: localhost
Port: 3307
Database: farmboy_db
Username: farmboy
Password: Sntioi004!
```

## Development Commands

### View Logs
```bash
# All services
docker-compose -f docker-compose.local.yml logs -f

# Specific service
docker-compose -f docker-compose.local.yml logs -f farm-admin-local
```

### Restart Services
```bash
# Restart all
docker-compose -f docker-compose.local.yml restart

# Restart specific service
docker-compose -f docker-compose.local.yml restart farm-admin-local
```

### Access Container Shell
```bash
# Access the Farm Manager container
docker exec -it farm-admin-local /bin/bash
```

### Rebuild After Changes
```bash
# Rebuild and restart
docker-compose -f docker-compose.local.yml up --build -d
```

## Troubleshooting

### Container Won't Start

1. **Check Docker Desktop is running**:
   ```bash
   docker info
   ```

2. **Check port conflicts**:
   ```bash
       netstat -an | findstr ":3334"
    netstat -an | findstr ":5901"
    netstat -an | findstr ":8081"
   ```

3. **View container logs**:
   ```bash
   docker-compose -f docker-compose.local.yml logs farm-admin-local
   ```

### Database Connection Issues

1. **Check MariaDB container**:
   ```bash
   docker-compose -f docker-compose.local.yml logs mariadb-local
   ```

2. **Test database connection**:
   ```bash
   docker exec farm-mariadb-local mysqladmin ping -h 127.0.0.1 -u root -pSntioi004!
   ```

### EternalFarm API Issues

1. **Verify key configuration**:
   ```bash
   docker exec farm-admin-local env | grep ETERNAL
   ```

2. **Test API connectivity**:
   ```bash
   docker exec farm-admin-local curl -s https://api.eternalfarm.net/health
   ```

### Clean Restart

If you need to completely reset:

```bash
# Stop and remove everything including volumes
docker-compose -f docker-compose.local.yml down -v

# Remove any orphaned containers
docker system prune

# Start fresh
docker-compose -f docker-compose.local.yml up --build -d
```

## File Structure

```
farm-admin-enablevnc/
├── docker-compose.local.yml     # Local testing configuration
├── local.env                    # Local environment variables
├── start-local.bat             # Windows start script
├── stop-local.bat              # Windows stop script
├── Dockerfile                  # Container build instructions
├── docker-entrypoint.sh        # Container startup script
├── supervisord.conf            # Service management
└── logs/                       # Local log files (created automatically)
```

## Production vs Local Differences

| Feature | Local | Production (Portainer) |
|---------|-------|----------------------|
| Environment | `NODE_ENV=development` | `NODE_ENV=production` |
| Debug Logs | `DEBUG=true` | `DEBUG=false` |
| Database Port | `3307` | `3306` |
| Container Names | `*-local` suffix | Production names |
| Volumes | Local volumes | Persistent volumes |
| Log Access | `./logs` directory | Container logs only |

## Next Steps

1. **Test Individual Features**: Use this local environment to test each component
2. **Validate Configuration**: Ensure all services work before production deployment
3. **Debug Issues**: Use detailed logging and direct container access
4. **Development**: Make changes and test them locally first

## Support

If you encounter issues:

1. Check the logs: `docker-compose -f docker-compose.local.yml logs -f`
2. Verify Docker Desktop is running and has sufficient resources
3. Ensure no port conflicts with other services
4. Review the troubleshooting section above 