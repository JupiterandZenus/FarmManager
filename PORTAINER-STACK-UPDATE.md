# Portainer Stack Update Guide

This guide explains how to update your Portainer stacks with the latest database refresh functionality.

## Overview

The updated stack configurations include:

1. Improved database initialization and health checks
2. Automatic database schema setup
3. Database refresh functionality
4. Prisma ORM integration

## Updating Your Stacks

### Method 1: Copy and Paste (Recommended)

1. Open your Portainer dashboard
2. Navigate to Stacks
3. Find your Farm Manager stack
4. Click on "Edit Stack"
5. Replace the content with the updated stack configuration from:
   - For full setup: `portainer-farmmanager-stack.yml`
   - For simplified setup: `portainer-farmmanager-simple.yml`
6. Click "Update" to apply the changes

### Method 2: Download and Upload

1. Download the updated stack file from the repository:
   - Full setup: `portainer-farmmanager-stack.yml`
   - Simplified setup: `portainer-farmmanager-simple.yml`
2. Open your Portainer dashboard
3. Navigate to Stacks
4. Find your Farm Manager stack
5. Click on "Edit Stack"
6. Click "Upload" and select the downloaded file
7. Click "Update" to apply the changes

## Important Changes

### Database Volumes

The updated stack adds two important volume mounts:

```yaml
volumes:
  - mariadb_data:/config
  - ./prisma:/prisma
  - ./setup_database.sql:/docker-entrypoint-initdb.d/setup_database.sql
```

These mounts ensure:

1. The database schema is automatically applied on container startup
2. Prisma ORM can manage your database schema

### Health Checks

Health checks have been added to ensure the database is properly initialized:

```yaml
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "127.0.0.1", "-u", "root", "-pSntioi004!"]
  timeout: 10s
  retries: 5
  interval: 30s
  start_period: 60s
```

This prevents the Farm Manager from starting before the database is ready.

## After Updating

After updating your stack:

1. Deploy the changes in Portainer
2. Wait for all containers to start (this may take a few minutes)
3. Verify the database is working by accessing the Farm Manager interface
4. If needed, run the database refresh script:
   ```
   docker exec -it <farm-admin-container-name> /app/refresh-database.sh
   ```

## Troubleshooting

If you encounter issues:

1. Check container logs in Portainer
2. Verify all containers are running
3. If database issues persist, try stopping and removing the mariadb container, then redeploy
4. Read the `DATABASE-REFRESH-FIX.md` guide for common solutions 