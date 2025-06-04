# Portainer Stack Database Authentication Fix

## Overview

This document outlines the changes made to the Portainer stack files to fix the database authentication issues that were occurring with the Farm Manager deployment.

## Problem Description

The original issue was:
```
ERROR 1045 (28000): Access denied for user 'root'@'farmboyhybrid-farm-admin-1.farmboyhybrid_farm-network' (using password: YES)
```

This was caused by:
1. Database user configuration issues
2. Missing environment variables in containers
3. Problematic volume mounts in Portainer

## Files Updated

### 1. `portainer-farmmanager-stack.yml`
- **Full-featured** Portainer stack with all integrations

### 2. `portainer-farmmanager-simple.yml`
- **Simplified** Portainer stack for basic deployment

## Changes Made

### Farm-Admin Container Environment Variables

Added the following database configuration variables to both stack files:

```yaml
# Database Configuration
- MYSQL_ROOT_PASSWORD=Sntioi004!
- MYSQL_HOST=mariadb
- MYSQL_PORT=3306
- MYSQL_DATABASE=farmboy_db
- MYSQL_USER=farmboy
- MYSQL_PASSWORD=Sntioi004!
```

### MariaDB Container Configuration

1. **Added MYSQL_ROOT_HOST environment variable:**
   ```yaml
   - MYSQL_ROOT_HOST=%
   ```
   This allows the root user to connect from any hostname.

2. **Commented out problematic volume mounts:**
   ```yaml
   volumes:
     - mariadb_data:/config
     # Comment out problematic mounts for Portainer deployment
     # - ./prisma:/prisma
     # - ./setup_database.sql:/docker-entrypoint-initdb.d/setup_database.sql
   ```

### Database URL Configuration

Both stack files already had the correct DATABASE_URL:
```yaml
- DATABASE_URL=mysql://farmboy:Sntioi004!@mariadb:3306/farmboy_db
```

This uses the `farmboy` user instead of `root`, which is more secure and reliable.

## Deployment Instructions

### Option 1: Full Stack (Recommended)
```bash
# Use the full-featured stack
docker stack deploy -c portainer-farmmanager-stack.yml farmmanager
```

### Option 2: Simple Stack
```bash
# Use the simplified stack (fewer features)
docker stack deploy -c portainer-farmmanager-simple.yml farmmanager
```

### Option 3: Portainer UI
1. Copy the contents of either stack file
2. Paste into Portainer Stack creation interface
3. Configure environment variables as needed
4. Deploy the stack

## Environment Variables to Configure

When deploying via Portainer, make sure to set these environment variables:

### Required Variables
- `API_KEY` - Your EternalFarm API key
- `ETERNALFARM_AGENT_KEY` - Your EternalFarm Agent key

### Optional Variables
- `DISCORD_WEBHOOK_URL` - Discord webhook for notifications
- `DREAMBOT_USERNAME` - DreamBot username (if using DreamBot)
- `DREAMBOT_PASSWORD` - DreamBot password (if using DreamBot)
- `AGENT_KEY` - Individual EternalFarm Agent key
- `CHECKER_KEY` - Individual EternalFarm Checker key
- `AUTOMATOR_KEY` - Individual EternalFarm Automator key

## Verification

After deployment, check the logs to verify the database connection:

```bash
# Check container logs
docker service logs farmmanager_farm-admin -f

# Should see:
# ✅ Database is ready
# ✅ Database already exists
# ✅ Prisma client generated
```

## Security Notes

1. **Database User**: Uses `farmboy` user instead of `root` for better security
2. **Passwords**: Consider using Docker secrets for production deployments
3. **API Keys**: Store sensitive keys as environment variables, not in the compose file

## Troubleshooting

### If database connection still fails:
1. Check that MariaDB container is healthy
2. Verify environment variables are set correctly
3. Check network connectivity between containers
4. Review container logs for specific error messages

### Common Issues:
- **Volume mount errors**: The problematic volume mounts have been commented out
- **Permission errors**: The script creates necessary directories and permissions
- **Network issues**: All containers use the same `farm-network`

## Support

If you encounter issues with the updated stack files:

1. Check the container logs: `docker service logs <service_name>`
2. Verify all environment variables are set
3. Ensure the MariaDB container is healthy before the farm-admin container starts
4. Review the database initialization logs

The database authentication issue should now be resolved with these updated stack files. 