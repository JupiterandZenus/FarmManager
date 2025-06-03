-- Connect to MariaDB as root and run these commands

-- Create the database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS farmboy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user for the application (optional, but recommended)
CREATE USER IF NOT EXISTS 'farmboy_user'@'%' IDENTIFIED BY 'Sntioi004!';

-- Grant all privileges on the farmboy_db database to the user
GRANT ALL PRIVILEGES ON farmboy_db.* TO 'farmboy_user'@'%';

-- Also grant to localhost
GRANT ALL PRIVILEGES ON farmboy_db.* TO 'farmboy_user'@'localhost';

-- Grant root access (since you're using root in your connection)
GRANT ALL PRIVILEGES ON farmboy_db.* TO 'root'@'%';

-- Flush privileges to ensure changes take effect
FLUSH PRIVILEGES;

-- Show grants to verify
SHOW GRANTS FOR 'farmboy_user'@'%';
SHOW GRANTS FOR 'root'@'%';

-- Use the database
USE farmboy_db;

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