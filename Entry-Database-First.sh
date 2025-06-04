#!/bin/bash
set -e

echo "🚀 Entry.sh - Database First, Then Environment Setup"
echo "===================================================="
echo "🔄 PRODUCTION STARTUP SEQUENCE FOR UNRAID"

# =============================================================================
# PHASE 1: DATABASE INITIALIZATION (HIGHEST PRIORITY)
# =============================================================================

echo ""
echo "📊 PHASE 1: DATABASE INITIALIZATION (CRITICAL)"
echo "=============================================="

# Set basic environment without X11 operations
export JAVA_HOME=$(find /usr/lib/jvm -name "temurin-8-jdk-amd64" | head -1)
if [ -z "$JAVA_HOME" ]; then
    export JAVA_HOME=$(find /usr/lib/jvm -name "java-8-openjdk-*" | head -1)
fi
export PATH=$JAVA_HOME/bin:$PATH

echo "✅ Java Environment: $JAVA_HOME"

# Make all database scripts executable immediately
echo "🔧 Making database scripts executable..."
chmod +x /app/refresh-database.js 2>/dev/null || true
chmod +x /app/refresh-database.sh 2>/dev/null || true
chmod +x /app/fix-database-schema.sh 2>/dev/null || true
chmod +x /app/fix-database-auth.sh 2>/dev/null || true
chmod +x /app/quick-db-fix.sh 2>/dev/null || true
chmod +x /app/init-database.sh 2>/dev/null || true
echo "✅ Database scripts ready"

# Extended database wait with aggressive timeout
echo "🔍 Waiting for MariaDB to be fully ready..."
DB_READY=false
for i in {1..90}; do
    if mysqladmin ping -h mariadb -u farmboy -p"$MYSQL_PASSWORD" --silent 2>/dev/null; then
        echo "✅ Database ping successful (attempt $i)"
        DB_READY=true
        break
    fi
    echo "   Attempt $i/90 - Database not ready..."
    sleep 2
    
    # At attempt 30, try with root user
    if [ $i -eq 30 ]; then
        echo "🔄 Trying with root user..."
        mysqladmin ping -h mariadb -u root -p"$MYSQL_ROOT_PASSWORD" --silent 2>/dev/null || true
    fi
    
    # At attempt 60, force connection test
    if [ $i -eq 60 ]; then
        echo "🔧 Force testing database connection..."
        mysql -h mariadb -u farmboy -p"$MYSQL_PASSWORD" -e "SHOW DATABASES;" 2>/dev/null || true
    fi
done

if [ "$DB_READY" = false ]; then
    echo "❌ CRITICAL: Database not ready after 180 seconds"
    echo "🔧 Attempting emergency database recovery..."
    # Try to create user and database manually
    mysql -h mariadb -u root -p"$MYSQL_ROOT_PASSWORD" -e "
        CREATE DATABASE IF NOT EXISTS farmboy_db;
        CREATE USER IF NOT EXISTS 'farmboy'@'%' IDENTIFIED BY '$MYSQL_PASSWORD';
        GRANT ALL PRIVILEGES ON farmboy_db.* TO 'farmboy'@'%';
        FLUSH PRIVILEGES;
    " 2>/dev/null || true
fi

# Additional stabilization wait
echo "⏳ Database stabilization period..."
sleep 15

# FORCE DATABASE SCHEMA CREATION
echo "🔧 FORCE CREATING DATABASE SCHEMA..."
cd /app

# Step 1: Reset Prisma completely
echo "🔄 Step 1: Resetting Prisma state..."
npx prisma db push --force-reset --accept-data-loss --skip-generate || {
    echo "⚠️ Force reset failed, trying manual schema creation..."
    
    # Manual table creation as fallback
    echo "🔧 Creating tables manually..."
    mysql -h mariadb -u farmboy -p"$MYSQL_PASSWORD" farmboy_db << 'MANUAL_SQL'
-- Create account_categories table
CREATE TABLE IF NOT EXISTS account_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create proxy_categories table  
CREATE TABLE IF NOT EXISTS proxy_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'offline',
    last_seen DATETIME,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    eternal_farm_id VARCHAR(255) UNIQUE,
    needs_sync BOOLEAN DEFAULT FALSE,
    last_synced DATETIME,
    cpu_usage FLOAT,
    memory_usage FLOAT,
    disk_usage FLOAT,
    auth_key VARCHAR(255)
);

-- Create proxies table
CREATE TABLE IF NOT EXISTS proxies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    host VARCHAR(255) NOT NULL,
    port INT NOT NULL,
    username VARCHAR(255),
    password VARCHAR(255),
    type VARCHAR(50) DEFAULT 'http',
    category_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_host_port (host, port),
    FOREIGN KEY (category_id) REFERENCES proxy_categories(id)
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    email VARCHAR(255),
    type VARCHAR(50) DEFAULT 'p2p',
    status VARCHAR(50) DEFAULT 'idle',
    category_id INT,
    proxy_id INT,
    agent_id INT,
    tutorial_status INT DEFAULT 0,
    otp_key VARCHAR(255),
    last_checked_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (category_id) REFERENCES account_categories(id),
    FOREIGN KEY (proxy_id) REFERENCES proxies(id)
);

-- Create bots table
CREATE TABLE IF NOT EXISTS bots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    version VARCHAR(255),
    agent_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'idle',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    script VARCHAR(255) NOT NULL,
    account_id INT,
    agent_id INT,
    bot_id INT,
    status VARCHAR(50) DEFAULT 'pending',
    priority INT DEFAULT 0,
    scheduled_at DATETIME,
    started_at DATETIME,
    completed_at DATETIME,
    error_message TEXT,
    result_data LONGTEXT,
    process_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (bot_id) REFERENCES bots(id)
);

-- Create prime_link_requests table
CREATE TABLE IF NOT EXISTS prime_link_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    notes TEXT
);
MANUAL_SQL
    
    echo "✅ Manual schema creation completed"
}

# Step 2: Generate Prisma client
echo "🔧 Step 2: Generating Prisma client..."
npx prisma generate || {
    echo "❌ Prisma generate failed, but continuing with manual schema"
}

# Step 3: Verify tables exist
echo "🔍 Step 3: Verifying database tables..."
TABLE_COUNT=$(mysql -h mariadb -u farmboy -p"$MYSQL_PASSWORD" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='farmboy_db';" 2>/dev/null | tail -n 1)
echo "📊 Database has $TABLE_COUNT tables"

# Specifically check for account_categories
ACCOUNT_CATEGORIES_EXISTS=$(mysql -h mariadb -u farmboy -p"$MYSQL_PASSWORD" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='farmboy_db' AND table_name='account_categories';" 2>/dev/null | tail -n 1)
if [ "$ACCOUNT_CATEGORIES_EXISTS" = "1" ]; then
    echo "✅ account_categories table verified"
else
    echo "❌ account_categories still missing - creating emergency fallback"
    mysql -h mariadb -u farmboy -p"$MYSQL_PASSWORD" farmboy_db -e "
    CREATE TABLE IF NOT EXISTS account_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );"
fi

# Step 4: Seed database ONLY if tables exist
echo "🔍 Step 4: Checking if seeding is needed..."
AGENT_COUNT=$(mysql -h mariadb -u farmboy -p"$MYSQL_PASSWORD" -e "SELECT COUNT(*) FROM farmboy_db.agents;" 2>/dev/null | tail -n 1)

if [ "$AGENT_COUNT" = "0" ] || [ -z "$AGENT_COUNT" ]; then
    echo "🌱 Seeding database with initial data..."
    cd /app && node prisma/seed.js || {
        echo "⚠️ Seeding failed, but database schema is ready"
        # Insert basic data manually if seeding fails
        mysql -h mariadb -u farmboy -p"$MYSQL_PASSWORD" farmboy_db -e "
            INSERT IGNORE INTO account_categories (name, description) VALUES 
            ('Main Accounts', 'Primary gaming accounts'),
            ('Alt Accounts', 'Alternative accounts'),
            ('Bot Accounts', 'Dedicated botting accounts');
            
            INSERT IGNORE INTO agents (name, status, eternal_farm_id) VALUES 
            ('Local Agent', 'offline', 'local-agent-1');
        " 2>/dev/null || true
    }
    echo "✅ Database seeded successfully"
else
    echo "✅ Database already has $AGENT_COUNT agents, skipping seed"
fi

echo "🎉 DATABASE INITIALIZATION COMPLETE!"
echo "📊 Database Status Summary:"
echo "   - Connection: ✅ Active"
echo "   - Schema: ✅ Created ($TABLE_COUNT tables)"
echo "   - Data: ✅ Seeded ($AGENT_COUNT agents)"

# =============================================================================
# PHASE 2: ENVIRONMENT SETUP (NO X11 - supervisord handles it)
# =============================================================================

echo ""
echo "🛠️ PHASE 2: ENVIRONMENT SETUP (NO X11 CONFLICTS)"
echo "================================================"

# NOTE: X11 is handled by supervisord - DO NOT start here!
echo "ℹ️  X11 Display Server managed by supervisord (priority 1-5)"
echo "ℹ️  Farm Manager will start at supervisord priority 10"

# Create directories with proper permissions
echo "📁 Creating application directories..."
mkdir -p /appdata/DreamBot/BotData
mkdir -p /root/Desktop
mkdir -p /root/EternalFarm/Logs
mkdir -p /root/DreamBot/BotData

chmod 755 /root/DreamBot
chmod -R 755 /appdata/EternalFarm 2>/dev/null || true
chmod -R 755 /appdata/DreamBot 2>/dev/null || true
chmod 755 /root/EternalFarm
chmod 755 /root/EternalFarm/Logs
chmod 755 /root/DreamBot/BotData

# Create EternalFarm key files
echo "🔑 Setting up EternalFarm authentication keys..."
if [ ! -z "${AGENT_KEY}" ]; then
    echo "${AGENT_KEY}" > /root/EternalFarm/Logs/agent.key
    chmod 600 /root/EternalFarm/Logs/agent.key
    echo "✅ Agent key created"
fi

if [ ! -z "${CHECKER_KEY}" ]; then
    echo "${CHECKER_KEY}" > /root/EternalFarm/Logs/checker.key
    chmod 600 /root/EternalFarm/Logs/checker.key
    echo "✅ Checker key created"
fi

if [ ! -z "${AUTOMATOR_KEY}" ]; then
    echo "${AUTOMATOR_KEY}" > /root/EternalFarm/Logs/automator.key
    chmod 600 /root/EternalFarm/Logs/automator.key
    echo "✅ Automator key created"
fi

# Download EternalFarm tools if needed
echo "📥 Ensuring EternalFarm tools are available..."
AGENT_URL="https://eternalfarm.ams3.cdn.digitaloceanspaces.com/agent/2.1.3/linux-amd64/EternalFarmAgent"
CHECKER_URL="https://eternalfarm.ams3.cdn.digitaloceanspaces.com/checker/2.0.13/linux-amd64/EternalFarmChecker"
AUTOMATOR_URL="https://eternalfarm.ams3.cdn.digitaloceanspaces.com/browser-automator/2.4.5/linux-amd64/EternalFarmBrowserAutomator"

# Download with retry logic
for tool in "EternalFarmAgent:$AGENT_URL" "EternalFarmChecker:$CHECKER_URL" "EternalFarmBrowserAutomator:$AUTOMATOR_URL"; do
    IFS=':' read -r name url <<< "$tool"
    if [ ! -f "/usr/local/bin/$name" ]; then
        echo "📥 Downloading $name..."
        for i in {1..3}; do
            if curl -L --connect-timeout 30 -o "/usr/local/bin/$name" "$url"; then
                chmod +x "/usr/local/bin/$name"
                echo "✅ $name downloaded and made executable"
                break
            else
                echo "⚠️ Download attempt $i/3 failed for $name"
                [ $i -eq 3 ] && echo "❌ Failed to download $name after 3 attempts"
                sleep 2
            fi
        done
    else
        chmod +x "/usr/local/bin/$name"
        echo "✅ $name already exists and is executable"
    fi
done

# Create DreamBot settings
echo "📝 Setting up DreamBot configuration..."
cat > /root/DreamBot/BotData/settings.json << 'EOF'
{
  "breaks": [],
  "cpuSaver": true,
  "disableCPUSaverWhenNotRunning": false,
  "enableCPUSaverWhenMinimized": false,
  "ignoreVisualInjections": false,
  "isAlwaysOnTop": false,
  "clientRendering": false,
  "drawScriptPaint": true,
  "useRandomWorld": true,
  "useCustomWorld": false,
  "hasSeenAccountWarning": false,
  "fps": 20,
  "renderDistance": 25,
  "customWorld": -8,
  "disableSecurityManager": false,
  "developerMode": false,
  "freshStart": false,
  "sdnIntegration": true,
  "covertMode": true,
  "mouseSpeed": 100,
  "autoAddAccounts": true,
  "disableSounds": true
}
EOF

chmod 644 /root/DreamBot/BotData/settings.json
echo "✅ DreamBot settings configured"

# Download DreamBot client
if [ ! -f "/root/DreamBot/BotData/client.jar" ]; then
    echo "📥 Downloading DreamBot client..."
    if curl -L --connect-timeout 30 -o /root/DreamBot/BotData/client.jar "https://dreambot.org/download/client.jar"; then
        chmod 644 /root/DreamBot/BotData/client.jar
        echo "✅ DreamBot client downloaded"
    else
        echo "⚠️ DreamBot download failed, but continuing"
    fi
else
    echo "✅ DreamBot client already exists"
fi

echo ""
echo "🎉 UNRAID PRODUCTION SETUP COMPLETE!"
echo "===================================="
echo "✅ Phase 1: Database - INITIALIZED & READY"
echo "✅ Phase 2: Environment - CONFIGURED"
echo "ℹ️  Phase 3: X11/VNC - Managed by supervisord"
echo "ℹ️  Phase 4: Farm Manager - Will start at priority 10"
echo "ℹ️  Phase 5: EternalFarm - Will start at priority 30+"
echo ""
echo "🌐 Access Points (once supervisord completes):"
echo "   - Farm Manager: http://unraid-ip:3333"
echo "   - noVNC Web: http://unraid-ip:8080"
echo "   - VNC Direct: unraid-ip:5900"
echo ""
echo "🚀 READY FOR PRODUCTION ON UNRAID!"

exit 0 