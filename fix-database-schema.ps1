# Database Schema Fix Script for Windows
Write-Host "🔧 Database Schema Fix Script" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Database configuration
$DB_USER = "farmboy"
$DB_PASSWORD = "Sntioi004!"
$DB_NAME = "farmboy_db"

Write-Host "📊 Checking database connectivity..." -ForegroundColor Yellow

# Create the SQL file
$sqlContent = @"
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
"@

# Save SQL to a temporary file
$sqlFile = "temp-fix-schema.sql"
$sqlContent | Out-File -FilePath $sqlFile -Encoding utf8

Write-Host ""
Write-Host "🔧 Fixing missing tables in database schema..." -ForegroundColor Yellow

# Execute the SQL script to fix the schema
try {
    docker exec farm-admin-mariadb-fresh /usr/bin/mariadb -u $DB_USER -p"$DB_PASSWORD" $DB_NAME < $sqlFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database schema fixed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔄 Restarting farm-admin container..." -ForegroundColor Yellow
        
        # Restart the farm-admin container
        docker-compose restart farm-admin-hybrid
        
        Write-Host "✅ Container restarted. Check the logs with:" -ForegroundColor Green
        Write-Host "   docker-compose logs -f farm-admin-hybrid" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to fix database schema" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 Try checking the database logs:" -ForegroundColor Yellow
        Write-Host "   docker-compose logs mariadb" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "❌ Error executing SQL: $_" -ForegroundColor Red
}

# Clean up temporary file
if (Test-Path $sqlFile) {
    Remove-Item $sqlFile
}

Write-Host ""
Write-Host "Script completed." -ForegroundColor Cyan
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 