-- Fix all updated_at columns to have proper default values
-- This script fixes the "Field 'updated_at' doesn't have a default value" errors

USE farmboy_db;

-- Fix accounts table
ALTER TABLE accounts MODIFY COLUMN updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Fix account_categories table
ALTER TABLE account_categories MODIFY COLUMN updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Fix agents table
ALTER TABLE agents MODIFY COLUMN updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Fix proxies table
ALTER TABLE proxies MODIFY COLUMN updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Fix proxy_categories table
ALTER TABLE proxy_categories MODIFY COLUMN updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Fix bots table
ALTER TABLE bots MODIFY COLUMN updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Fix tasks table
ALTER TABLE tasks MODIFY COLUMN updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Verify the changes
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLUMN_DEFAULT,
    EXTRA
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'farmboy_db' 
AND COLUMN_NAME = 'updated_at'; 