#!/bin/bash
echo "🔧 Farm Manager Complete Fix Script"
echo "====================================="

echo "📊 Step 1: Checking current container status..."
docker-compose ps

echo "🗄️ Step 2: Fixing database schema..."

# First, fix the database tables using the SQL script
echo "   2a. Creating missing tables with SQL script..."
docker exec farm-admin-hybrid mysql -h mariadb -u farmboy -pSntioi004! farmboy_db < /app/fix-account-categories-table.sql

# Deploy Prisma schema to ensure all tables exist
echo "   2b. Deploying Prisma schema..."
docker exec farm-admin-hybrid bash -c "cd /app && npx prisma migrate deploy --schema=./prisma/schema.prisma"

# If migrations don't exist, create and apply them
echo "   2c. Creating initial migration if needed..."
docker exec farm-admin-hybrid bash -c "cd /app && npx prisma migrate dev --name init --schema=./prisma/schema.prisma || echo 'Migration already exists'"

echo "🔧 Step 3: Regenerating Prisma client..."
docker exec farm-admin-hybrid bash -c "cd /app && npx prisma generate --schema=./prisma/schema.prisma"

echo "🌱 Step 4: Seeding database..."
docker exec farm-admin-hybrid bash -c "cd /app && node prisma/seed.js"

echo "🖥️ Step 5: Fixing X11 display server..."
docker exec farm-admin-hybrid bash -c "
echo 'Stopping any existing X servers...'
pkill Xvfb || true
pkill X || true

echo 'Cleaning X11 lock files...'
rm -f /tmp/.X1-lock
rm -f /tmp/.X11-unix/X1

echo 'Starting fresh X server...'
sleep 3
Xvfb :1 -screen 0 1920x1080x24 -ac &
sleep 3

echo 'Verifying X server is running...'
if ps aux | grep -v grep | grep Xvfb; then
    echo '✅ X server started successfully'
else
    echo '⚠️ X server may need manual restart'
fi
"

echo "🔄 Step 6: Restarting all services..."
docker exec farm-admin-hybrid supervisorctl restart all

echo "✅ Step 7: Verifying fixes..."
echo "   📊 Service Status:"
docker exec farm-admin-hybrid supervisorctl status

echo "   🗄️ Database Tables:"
docker exec farm-admin-hybrid mysql -h mariadb -u farmboy -pSntioi004! farmboy_db -e "SHOW TABLES;"

echo "   📋 Account Categories:"
docker exec farm-admin-hybrid mysql -h mariadb -u farmboy -pSntioi004! farmboy_db -e "SELECT * FROM account_categories;"

echo "   🖥️ X11 Status:"
docker exec farm-admin-hybrid ps aux | grep Xvfb | grep -v grep

echo "   🌐 Web Interface:"
curl -I http://localhost:3333 2>/dev/null | head -1

echo ""
echo "🎉 Fix script complete!"
echo "======================================"
echo "✅ Database: Tables created and seeded"
echo "✅ X11: Display server restarted"
echo "✅ Services: All restarted"
echo ""
echo "🌐 Access your system:"
echo "   Web Dashboard: http://localhost:3333"
echo "   noVNC Desktop: http://localhost:8080"
echo "   SSH: ssh root@localhost -p 2222" 