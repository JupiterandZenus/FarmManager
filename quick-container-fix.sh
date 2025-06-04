#!/bin/bash
echo "🔧 Farm Manager Container Fix Script"
echo "==================================="

# Fix 1: Database Schema
echo "📊 Fixing database schema..."
docker exec farm-admin-hybrid mysql -h mariadb -u farmboy -pSntioi004! farmboy_db < fix-account-categories-table.sql

# Fix 2: Run Prisma migrations
echo "🔄 Running Prisma migrations..."
docker exec farm-admin-hybrid bash -c "cd /app && npx prisma migrate deploy"

# Fix 3: Generate Prisma client
echo "🔧 Generating Prisma client..."
docker exec farm-admin-hybrid bash -c "cd /app && npx prisma generate"

# Fix 4: Seed database
echo "🌱 Seeding database..."
docker exec farm-admin-hybrid bash -c "cd /app && npx prisma db seed"

# Fix 5: Clear X11 lock and restart X server
echo "🖥️ Fixing X11 display server..."
docker exec farm-admin-hybrid bash -c "
rm -f /tmp/.X1-lock
rm -f /tmp/.X11-unix/X1
pkill Xvfb || true
sleep 3
Xvfb :1 -screen 0 1920x1080x24 -ac &
sleep 2
"

# Fix 6: Restart supervisord services
echo "🔄 Restarting services..."
docker exec farm-admin-hybrid supervisorctl restart all

echo "✅ All fixes applied! Checking status..."
docker exec farm-admin-hybrid supervisorctl status 