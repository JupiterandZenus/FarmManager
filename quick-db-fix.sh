#!/bin/bash

echo "🚀 Quick Database Authentication Fix"
echo "===================================="

# Check if containers are running
if ! docker ps | grep -q "farm-admin-mariadb-fresh"; then
    echo "❌ MariaDB container is not running"
    echo "Starting containers..."
    docker-compose up -d mariadb
    sleep 10
fi

# Fix database permissions directly
echo "🔧 Fixing database user permissions..."

docker exec farm-admin-mariadb-fresh mysql -u root -pSntioi004! -e "
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'Sntioi004!';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
CREATE USER IF NOT EXISTS 'farmboy'@'%' IDENTIFIED BY 'Sntioi004!';
GRANT ALL PRIVILEGES ON farmboy_db.* TO 'farmboy'@'%';
FLUSH PRIVILEGES;
"

if [ $? -eq 0 ]; then
    echo "✅ Database permissions fixed!"
    echo "🔄 Restarting farm-admin container..."
    docker-compose restart farm-admin-hybrid
    echo "✅ Container restarted. Check the logs with:"
    echo "   docker-compose logs -f farm-admin-hybrid"
else
    echo "❌ Failed to fix permissions. Try restarting all containers:"
    echo "   docker-compose down && docker-compose up -d"
fi 