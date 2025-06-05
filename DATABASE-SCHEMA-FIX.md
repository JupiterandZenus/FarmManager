# Database Schema & X11 Display Fixes

## Overview

This document explains two critical fixes implemented for the Farm Manager deployment:

1. **Database Schema Fix**: Resolves the missing `account_categories` table issue causing Prisma seeding errors
2. **X11 Display Fix**: Resolves the X11 display server startup issues causing the container to hang

## Problem 1: Missing Database Table

### Symptoms
```
Error seeding database: PrismaClientKnownRequestError: 
Invalid `prisma.accountCategory.upsert()` invocation:
The table `account_categories` does not exist in the current database.
```

### Root Cause
The Prisma schema includes an `AccountCategory` model, but the corresponding `account_categories` table was not created in the MariaDB database during initialization.

### Solution
The fix creates the missing table with the correct schema and populates it with default categories:

```sql
CREATE TABLE IF NOT EXISTS `account_categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `account_categories_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Fix Files
- `fix-account-categories-table.sql` - SQL script to create the missing table
- `fix-database-schema.sh` - Bash script to apply the fix (Linux/Mac)
- `fix-database-schema.ps1` - PowerShell script to apply the fix (Windows)
- `fix-database-schema.bat` - Batch wrapper for Windows users

## Problem 2: X11 Display Server Hanging

### Symptoms
```
⏳ Waiting for X11 display server...
   Attempt 53/60 - X11 not ready yet...
```

### Root Cause
The X11 display server (`Xvfb`) is not starting properly or is not responding, causing the container to hang during initialization.

### Solution
The fix modifies the `Entry.sh` script to:

1. Proactively start the X11 server if not running
2. Reduce wait time from 60 attempts (120 seconds) to 20 attempts (40 seconds)
3. Add a restart attempt halfway through if still not responding
4. Continue execution even if X11 is not ready, with a warning

```bash
# Try to start X11 if not running
if ! xset q &>/dev/null; then
    echo "🔄 X11 not running, attempting to start X server..."
    Xvfb :1 -screen 0 1920x1080x24 -ac &
    export DISPLAY=:1
    sleep 5
fi

# Check if X11 is now running
for i in {1..20}; do
    if xset q &>/dev/null; then
        echo "✅ X11 display server is ready"
        break
    fi
    echo "   Attempt $i/20 - X11 not ready yet..."
    sleep 2
    if [ $i -eq 10 ]; then
        echo "🔄 Trying to restart X server..."
        pkill Xvfb || true
        Xvfb :1 -screen 0 1920x1080x24 -ac &
        export DISPLAY=:1
        sleep 5
    fi
    if [ $i -eq 20 ]; then
        echo "⚠️ X11 display server not ready after 40 seconds, but continuing anyway..."
        echo "⚠️ Some graphical features may not work properly."
    fi
done
```

### Fix Files
- `Entry.sh` - Updated X11 initialization logic

## Additional Improvements

### 1. Updated Database User in supervisord.conf
Changed the database connection in supervisord.conf from:
```
DATABASE_URL="mysql://root:Sntioi004!@mariadb:3306/farmboy_db"
```
to:
```
DATABASE_URL="mysql://farmboy:Sntioi004!@mariadb:3306/farmboy_db"
```

### 2. Added Database Environment Variables
Added full set of database environment variables to supervisord.conf:
```
MYSQL_USER="farmboy"
MYSQL_PASSWORD="Sntioi004!"
MYSQL_HOST="mariadb"
MYSQL_PORT="3306"
MYSQL_DATABASE="farmboy_db"
```

## Applying the Fixes

### For Windows Users
1. Run `fix-database-schema.bat`
2. Restart the containers with `docker-compose restart`

### For Linux/Mac Users
1. Make the script executable: `chmod +x fix-database-schema.sh`
2. Run the script: `./fix-database-schema.sh`

### Manual Fix
1. Execute the SQL in `fix-account-categories-table.sql` against your database
2. Update `Entry.sh` with the improved X11 initialization logic
3. Restart the containers with `docker-compose restart`

## Verification

After applying the fixes, check the container logs:
```
docker-compose logs -f farm-admin-hybrid
```

You should see:
- ✅ Database is ready
- ✅ Database seeding completed successfully (no errors)
- ✅ X11 display server is ready (or continuing despite issues)

## Troubleshooting

### If Database Issues Persist
1. Check database connectivity: `docker exec farm-admin-mariadb-fresh /usr/bin/mariadb -u farmboy -pSntioi004! -e "SHOW TABLES;"`
2. Verify account_categories table: `docker exec farm-admin-mariadb-fresh /usr/bin/mariadb -u farmboy -pSntioi004! farmboy_db -e "DESCRIBE account_categories;"`
3. Check database logs: `docker-compose logs mariadb`

### If X11 Issues Persist
1. Check X11 processes: `docker exec farm-admin-hybrid ps aux | grep X`
2. Check X11 logs: `docker exec farm-admin-hybrid cat /var/log/xvfb.log`
3. Try rebuilding the container: `docker-compose build --no-cache farm-admin-hybrid` 