-- Database initialization script for Farm Manager
-- This ensures proper user permissions for container connections

-- Create farmboy user with access from any host
CREATE USER IF NOT EXISTS 'farmboy'@'%' IDENTIFIED BY 'farmpass123';

-- Grant all privileges on farmmanager database
GRANT ALL PRIVILEGES ON farmmanager.* TO 'farmboy'@'%';

-- Ensure root can connect from any host
ALTER USER 'root'@'localhost' IDENTIFIED BY 'farmrootpass123';
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'farmrootpass123';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

-- Flush privileges to ensure changes take effect
FLUSH PRIVILEGES;

-- Create farmmanager database if it doesn't exist
CREATE DATABASE IF NOT EXISTS farmmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Agent (
    id VARCHAR(255) PRIMARY KEY,
    eternal_farm_id VARCHAR(255) NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'offline',
    ip_address VARCHAR(45) NULL,
    last_seen TIMESTAMP NULL,
    cpu_usage FLOAT NULL,
    memory_usage FLOAT NULL,
    disk_usage FLOAT NULL,
    auth_key VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    needs_sync BOOLEAN DEFAULT FALSE,
    last_synced TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_eternal_farm_id ON Agent(eternal_farm_id);
CREATE INDEX IF NOT EXISTS idx_agent_needs_sync ON Agent(needs_sync);
CREATE INDEX IF NOT EXISTS idx_agent_last_synced ON Agent(last_synced);
CREATE INDEX IF NOT EXISTS idx_agent_status ON Agent(status);
CREATE INDEX IF NOT EXISTS idx_agent_last_seen ON Agent(last_seen); 