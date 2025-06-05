#!/bin/bash
echo "🔧 PRODUCTION FIX - Farm Manager"
echo "==============================="

echo "📊 Step 1: Fix database schema..."
# Create the missing table directly
docker exec farm-admin-hybrid mysql -h mariadb -u farmboy -pSntioi004! farmboy_db -e "
CREATE TABLE IF NOT EXISTS account_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO account_categories (name, description) VALUES 
('Main', 'Main accounts'),
('Mule', 'Mule accounts'), 
('Farm', 'Farming accounts'),
('Tutorial', 'Accounts in tutorial island');

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS process_id INT NULL;
"

echo "🔧 Step 2: Deploy Prisma schema..."
docker exec farm-admin-hybrid bash -c "cd /app && npx prisma db push --accept-data-loss"

echo "🔧 Step 3: Generate Prisma client..."
docker exec farm-admin-hybrid bash -c "cd /app && npx prisma generate"

echo "🖥️ Step 4: Fix X11 display conflict..."
docker exec farm-admin-hybrid bash -c "
# Kill all X processes and clean locks
pkill Xvfb || true
pkill X || true
rm -f /tmp/.X1-lock
rm -f /tmp/.X11-unix/X1
sleep 3

# Let supervisord handle X server (don't start manually)
echo 'X11 cleaned - supervisord will manage X server'
"

echo "🔄 Step 5: Restart container services..."
docker-compose restart farm-admin-hybrid

echo "✅ PRODUCTION FIX COMPLETE!"
echo "Monitoring startup..."
docker-compose logs -f farm-admin-hybrid --tail=20 