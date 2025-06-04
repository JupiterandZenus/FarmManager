-- Fix for missing account_categories table
-- Based on Prisma schema

-- Create account_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS `account_categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `account_categories_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default categories if table is empty
INSERT IGNORE INTO `account_categories` (`name`, `description`) VALUES 
('Main', 'Primary accounts'),
('F2P', 'Free to play accounts'),
('P2P', 'Members accounts'),
('Mule', 'Storage/trading accounts'),
('Skiller', 'Skill-focused accounts');

-- Verify table creation
SELECT 'account_categories table created successfully' as status;
SELECT COUNT(*) as category_count FROM `account_categories`; 