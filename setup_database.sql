-- Farm Manager Database Setup Script for Docker MariaDB

-- Create the database with proper character set
CREATE DATABASE IF NOT EXISTS farmboy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE farmboy_db;

-- Create Agent table if it doesn't exist
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_eternal_farm_id ON Agent(eternal_farm_id);
CREATE INDEX IF NOT EXISTS idx_agent_needs_sync ON Agent(needs_sync);
CREATE INDEX IF NOT EXISTS idx_agent_last_synced ON Agent(last_synced);
CREATE INDEX IF NOT EXISTS idx_agent_status ON Agent(status);
CREATE INDEX IF NOT EXISTS idx_agent_last_seen ON Agent(last_seen);

-- Create farmboy user if it doesn't exist and grant all privileges
CREATE USER IF NOT EXISTS 'farmboy'@'%' IDENTIFIED BY 'Sntioi004!';
GRANT ALL PRIVILEGES ON farmboy_db.* TO 'farmboy'@'%';

-- Ensure root user can connect from any host
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'Sntioi004!';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

-- Update existing root user host if it exists
UPDATE mysql.user SET Host='%' WHERE User='root' AND Host='localhost';
FLUSH PRIVILEGES;

-- Show that setup is complete
SELECT 'Database setup complete' as status;
SHOW TABLES;
DESCRIBE Agent; 