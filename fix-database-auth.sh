#!/bin/bash

echo "🔧 Database Authentication Fix Script"
echo "====================================="
echo ""

# Database configuration
DB_HOST="mariadb"
DB_ROOT_PASSWORD="Sntioi004!"
DB_NAME="farmboy_db"
DB_USER="farmboy"
DB_PASSWORD="Sntioi004!"

echo "📊 Checking database connectivity..."

# Wait for database to be ready
for i in {1..30}; do
    if docker exec farm-admin-mariadb-fresh mysqladmin ping -h localhost -u root -p"$DB_ROOT_PASSWORD" --silent 2>/dev/null; then
        echo "✅ Database is responding"
        break
    fi
    echo "   Attempt $i/30 - Waiting for database..."
    sleep 2
    if [ $i -eq 30 ]; then
        echo "❌ Database is not responding after 60 seconds"
        exit 1
    fi
done

echo ""
echo "🔧 Fixing database authentication..."

# Execute database fixes directly in the container
docker exec farm-admin-mariadb-fresh mysql -u root -p"$DB_ROOT_PASSWORD" << EOF
-- Drop existing problematic users if they exist
DROP USER IF EXISTS 'root'@'farmboyhybrid-farm-admin-1.farmboyhybrid_farm-network';
DROP USER IF EXISTS 'farmboy'@'%';
DROP USER IF EXISTS 'root'@'%';

-- Create users with proper permissions
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY '$DB_ROOT_PASSWORD';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

CREATE USER IF NOT EXISTS 'farmboy'@'%' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO 'farmboy'@'%';

-- Update any existing root users
UPDATE mysql.user SET Host='%' WHERE User='root' AND Host='localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Show users to verify
SELECT User, Host FROM mysql.user WHERE User IN ('root', 'farmboy');
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database authentication fixed successfully!"
    echo ""
    echo "🔄 Testing connection from farm-admin container..."
    
    # Test connection from the farm-admin container
    if docker exec farmboyhybrid-farm-admin-1 mysqladmin ping -h mariadb -u root -p"$DB_ROOT_PASSWORD" --silent 2>/dev/null; then
        echo "✅ Connection test successful!"
        echo ""
        echo "🎉 Database authentication is now working correctly."
        echo ""
        echo "You can now restart your containers with:"
        echo "   docker-compose restart farm-admin-hybrid"
    else
        echo "⚠️ Connection test failed. You may need to restart the containers:"
        echo "   docker-compose down"
        echo "   docker-compose up -d"
    fi
else
    echo "❌ Failed to fix database authentication"
    echo ""
    echo "💡 Try restarting the database container:"
    echo "   docker-compose restart mariadb"
    echo ""
    echo "If that doesn't work, you may need to reset the database:"
    echo "   docker-compose down"
    echo "   docker volume rm farmboyhybrid_mariadb_data (if volume exists)"
    echo "   docker-compose up -d"
fi

echo ""
echo "Script completed." 