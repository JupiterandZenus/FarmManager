#!/bin/bash

echo "🔧 Database Schema Fix Script"
echo "============================"
echo ""

# Database configuration
DB_HOST="mariadb"
DB_USER="farmboy"
DB_PASSWORD="Sntioi004!"
DB_NAME="farmboy_db"

echo "📊 Checking database connectivity..."

# Wait for database to be ready
for i in {1..30}; do
    if docker exec farm-admin-mariadb-fresh mysqladmin ping -h localhost -u "$DB_USER" -p"$DB_PASSWORD" --silent 2>/dev/null; then
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
echo "🔧 Fixing missing tables in database schema..."

# Execute the SQL script to fix the schema
docker exec farm-admin-mariadb-fresh /usr/bin/mariadb -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < fix-account-categories-table.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema fixed successfully!"
    echo ""
    echo "🔄 Restarting farm-admin container..."
    
    # Restart the farm-admin container
    docker-compose restart farm-admin-hybrid
    
    echo "✅ Container restarted. Check the logs with:"
    echo "   docker-compose logs -f farm-admin-hybrid"
else
    echo "❌ Failed to fix database schema"
    echo ""
    echo "💡 Try checking the database logs:"
    echo "   docker-compose logs mariadb"
fi

echo ""
echo "Script completed." 