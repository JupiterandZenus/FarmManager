# Database Refresh Guide

This guide will help you refresh the Farm Manager database when you're experiencing issues with database connectivity or data synchronization.

## Overview

The database refresh process will:

1. Reset the existing database
2. Apply the latest schema migrations
3. Seed the database with initial data
4. Verify the database is working correctly

## Prerequisites

- Farm Manager must be installed and running
- Access to command line interface (CLI)
- Node.js and npm must be installed

## Using the Scripts

### Windows Users

1. Navigate to your Farm Manager installation directory
2. Run the batch file:
   ```
   refresh-database.bat
   ```
3. Follow the on-screen prompts (you will be asked to confirm)
4. Wait for the process to complete
5. Restart the Farm Manager application

### Linux/Mac Users

1. Navigate to your Farm Manager installation directory
2. Run the shell script:
   ```
   ./refresh-database.sh
   ```
3. Follow the on-screen prompts (you will be asked to confirm)
4. Wait for the process to complete
5. Restart the Farm Manager application

### Docker Users

If you're running Farm Manager in Docker:

1. Access the container:
   ```
   docker exec -it farm-admin-hybrid bash
   ```
2. Navigate to the app directory:
   ```
   cd /app
   ```
3. Run the refresh script:
   ```
   ./refresh-database.sh
   ```
4. Follow the on-screen prompts
5. Restart the container:
   ```
   docker restart farm-admin-hybrid
   ```

### Using npm Scripts Directly

If you prefer to use npm scripts directly:

1. Navigate to your Farm Manager installation directory
2. Run the refresh command:
   ```
   npm run db:refresh
   ```
3. Wait for the process to complete
4. Restart the Farm Manager application

## Troubleshooting

If you encounter issues during the database refresh:

1. Check the MariaDB service is running:
   - In Docker: `docker ps | grep mariadb`
   - In Linux: `systemctl status mariadb`
   - In Windows: Check Services app for MariaDB or MySQL service

2. Verify your database connection string in `config.env`:
   - It should look like: `DATABASE_URL=mysql://root:password@mariadb:3306/farmboy_db`
   - For local installations: `DATABASE_URL=mysql://root:password@localhost:3306/farmboy_db`

3. Make sure you have sufficient permissions:
   - The user running the script must have write access to the project directory
   - The database user must have admin privileges

4. Check for port conflicts:
   - Default MariaDB port is 3306
   - Make sure no other service is using this port

## Manual Reset

If the automated scripts don't work, you can manually reset the database:

1. Connect to MariaDB:
   ```
   mysql -u root -p
   ```

2. Drop and recreate the database:
   ```sql
   DROP DATABASE IF EXISTS farmboy_db;
   CREATE DATABASE farmboy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. Apply the schema:
   ```
   mysql -u root -p farmboy_db < setup_database.sql
   ```

4. Generate Prisma client:
   ```
   npx prisma generate
   ```

5. Seed the database:
   ```
   node prisma/seed.js
   ```

## Getting Help

If you continue to experience database issues after following this guide, please:

1. Check the application logs in the `logs` directory
2. Run diagnostics: `node test-basic-api-check.js`
3. Contact support with the error details 