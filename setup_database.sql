-- Farm Manager Database Setup Script for Docker MariaDB

-- Create the database with proper character set
CREATE DATABASE IF NOT EXISTS farm_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Drop existing users if they exist to recreate with proper permissions
DROP USER IF EXISTS 'farmboy'@'%';
DROP USER IF EXISTS 'farmboy'@'localhost';

-- Create the user with permissions for any host
CREATE USER 'farmboy'@'%' IDENTIFIED BY 'Sntioi004!';
CREATE USER 'farmboy'@'localhost' IDENTIFIED BY 'Sntioi004!';

-- Grant ALL privileges (including administrative ones) to farmboy
GRANT ALL PRIVILEGES ON *.* TO 'farmboy'@'%' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'farmboy'@'localhost' WITH GRANT OPTION;

-- Specifically grant all privileges on farm_admin database
GRANT ALL PRIVILEGES ON farm_admin.* TO 'farmboy'@'%';
GRANT ALL PRIVILEGES ON farm_admin.* TO 'farmboy'@'localhost';

-- Ensure root can connect from anywhere
UPDATE mysql.user SET Host='%' WHERE User='root' AND Host='localhost';

-- Flush privileges to ensure changes take effect immediately
FLUSH PRIVILEGES;

-- Use the database
USE farm_admin;

-- Show that setup is complete
SELECT 'Database and user setup complete' as status;

-- Add sync-related fields to Agent table for API collector and updater system
-- These columns support bi-directional synchronization with EternalFarm API

-- Add eternal_farm_id to link local agents with EternalFarm API agents
ALTER TABLE Agent ADD COLUMN eternal_farm_id VARCHAR(255) NULL AFTER id;

-- Add sync tracking fields
ALTER TABLE Agent ADD COLUMN needs_sync BOOLEAN DEFAULT FALSE AFTER updated_at;
ALTER TABLE Agent ADD COLUMN last_synced TIMESTAMP NULL AFTER needs_sync;

-- Add performance monitoring fields
ALTER TABLE Agent ADD COLUMN cpu_usage FLOAT NULL AFTER last_seen;
ALTER TABLE Agent ADD COLUMN memory_usage FLOAT NULL AFTER cpu_usage;
ALTER TABLE Agent ADD COLUMN disk_usage FLOAT NULL AFTER memory_usage;

-- Add authentication key for EternalFarm agents
ALTER TABLE Agent ADD COLUMN auth_key VARCHAR(255) NULL AFTER disk_usage;

-- Create indexes for better performance on sync operations
CREATE INDEX idx_agent_eternal_farm_id ON Agent(eternal_farm_id);
CREATE INDEX idx_agent_needs_sync ON Agent(needs_sync);
CREATE INDEX idx_agent_last_synced ON Agent(last_synced);

-- Show that database is ready
SHOW TABLES;
DESCRIBE Agent; 