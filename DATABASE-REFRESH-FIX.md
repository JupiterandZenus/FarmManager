# Database Refresh Fix Guide

This guide provides solutions for fixing database refresh issues in the Farm Manager application.

## Issue Description

The database refresh functionality may fail due to:

1. Incorrect database connection settings
2. Missing Prisma migrations
3. Incompatible database schema
4. Docker networking issues

## Solution 1: Update Database Connection Settings

The most common issue is incorrect database connection settings. Follow these steps:

1. Open the `config.env` file
2. Update the `DATABASE_URL` to match your environment:

   For Docker deployments:
   ```
   DATABASE_URL=mysql://root:Sntioi004!@mariadb:3306/farmboy_db
   ```

   For local deployments:
   ```
   DATABASE_URL=mysql://root:Sntioi004!@localhost:3306/farmboy_db
   ```

   For remote deployments:
   ```
   DATABASE_URL=mysql://username:password@hostname:port/farmboy_db
   ```

## Solution 2: Initialize Database Manually

If automatic refresh doesn't work, follow these manual steps:

1. Connect to your database:
   ```
   # For Docker
   docker exec -it farm-admin-mariadb-fresh mysql -u root -pSntioi004!
   
   # For local MySQL/MariaDB
   mysql -u root -p
   ```

2. Create and initialize the database:
   ```sql
   DROP DATABASE IF EXISTS farmboy_db;
   CREATE DATABASE farmboy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE farmboy_db;

   -- Create Agent table
   CREATE TABLE IF NOT EXISTS agents (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(255) UNIQUE,
     status VARCHAR(50) DEFAULT 'offline',
     last_seen DATETIME NULL,
     ip_address VARCHAR(45) NULL,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     eternal_farm_id VARCHAR(255) NULL UNIQUE,
     needs_sync BOOLEAN DEFAULT FALSE,
     last_synced DATETIME NULL,
     cpu_usage FLOAT NULL,
     memory_usage FLOAT NULL,
     disk_usage FLOAT NULL,
     auth_key VARCHAR(255) NULL
   );

   -- Create indexes
   CREATE INDEX idx_agent_eternal_farm_id ON agents(eternal_farm_id);
   CREATE INDEX idx_agent_needs_sync ON agents(needs_sync);
   CREATE INDEX idx_agent_last_synced ON agents(last_synced);
   CREATE INDEX idx_agent_status ON agents(status);
   CREATE INDEX idx_agent_last_seen ON agents(last_seen);

   -- Insert sample agent
   INSERT INTO agents (name, status, ip_address, last_seen, auth_key, eternal_farm_id)
   VALUES ('Local Agent', 'online', '127.0.0.1', NOW(), 'sample_key_123', 'local-agent-1');
   ```

## Solution 3: Fix Docker Container Issues

If you're using Docker and experiencing issues:

1. Check if the MariaDB container is running:
   ```
   docker ps | grep mariadb
   ```

2. If not running, start it:
   ```
   docker start farm-admin-mariadb-fresh
   ```

3. If there are port conflicts, update the port mapping:
   ```
   # Stop the container
   docker stop farm-admin-mariadb-fresh
   
   # Remove the container
   docker rm farm-admin-mariadb-fresh
   
   # Create a new container with different port
   docker run --name farm-admin-mariadb-fresh -e MYSQL_ROOT_PASSWORD=Sntioi004! -e MYSQL_DATABASE=farmboy_db -e MYSQL_USER=farmboy -e MYSQL_PASSWORD=Sntioi004! -p 3309:3306 -d mariadb:latest
   
   # Update config.env with new port
   # DATABASE_URL=mysql://root:Sntioi004!@localhost:3309/farmboy_db
   ```

## Solution 4: Reset and Restart Services

Sometimes a complete reset is needed:

1. Stop all containers:
   ```
   docker-compose down
   ```

2. Remove volumes (WARNING: This deletes all data):
   ```
   docker volume rm farm-admin-enablevnc_farm_data
   ```

3. Start services again:
   ```
   docker-compose up -d
   ```

## Solution 5: Use Portainer for Database Management

If you're using Portainer:

1. Go to your Portainer dashboard
2. Find the MariaDB container
3. Click on "Console" to access the container shell
4. Run MySQL commands:
   ```
   mysql -u root -pSntioi004!
   ```
5. Follow the manual database initialization steps from Solution 2

## Getting Help

If you continue to experience issues:

1. Check container logs:
   ```
   docker logs farm-admin-mariadb-fresh
   docker logs farm-admin-hybrid
   ```

2. Verify network connectivity:
   ```
   docker network inspect farm-network
   ```

3. Contact support with the following information:
   - Error messages from database refresh
   - Container logs
   - Network configuration
   - Database connection settings (with password masked) 