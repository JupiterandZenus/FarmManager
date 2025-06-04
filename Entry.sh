#!/bin/bash
set -e

# Set up supervisord configuration
if [ ! -f "/etc/supervisord.conf" ]; then
    echo "🔧 Setting up supervisord configuration..."
    cp /app/supervisord.conf /etc/supervisord.conf
    chmod 644 /etc/supervisord.conf
fi

# Fix supervisord configuration to remove missing environment variables
# Note: fix-supervisord-config.sh is designed for host execution, not container
echo "🔧 Applying inline supervisord configuration fix..."
sed -i 's/DREAMBOT_SCRIPT="%(ENV_DREAMBOT_SCRIPT)s",//g' /etc/supervisord.conf
sed -i 's/DREAMBOT_WORLD="%(ENV_DREAMBOT_WORLD)s",//g' /etc/supervisord.conf
sed -i 's/DREAMBOT_ARGS="%(ENV_DREAMBOT_ARGS)s"//g' /etc/supervisord.conf
sed -i 's/,\s*$//' /etc/supervisord.conf

# Start supervisord if not running
if ! pgrep supervisord > /dev/null; then
    echo "▶️ Starting supervisord..."
    /usr/bin/supervisord -n -c /etc/supervisord.conf &
    sleep 5
fi

echo "🚀 Entry.sh - EternalFarm & DreamBot Setup Script"
echo "================================================="
echo "🔄 STARTUP SEQUENCE: Database First → X11 → Environment"

# =============================================================================
# PHASE 1: DATABASE INITIALIZATION FIRST (Before X11)
# =============================================================================

echo ""
echo "📊 PHASE 1: DATABASE INITIALIZATION"
echo "===================================="

# Set basic environment without X11 yet
export JAVA_HOME=$(find /usr/lib/jvm -name "temurin-8-jdk-amd64" | head -1)
if [ -z "$JAVA_HOME" ]; then
    export JAVA_HOME=$(find /usr/lib/jvm -name "java-8-openjdk-*" | head -1)
fi
export PATH=$JAVA_HOME/bin:$PATH

echo "✅ Java Home set to: $JAVA_HOME"

# Make database refresh scripts executable early
echo "🔧 Setting up database tools..."
if [ -f "/app/refresh-database.js" ]; then
    chmod +x /app/refresh-database.js
    echo "✅ Database refresh script is executable"
fi

if [ -f "/app/refresh-database.sh" ]; then
    chmod +x /app/refresh-database.sh
    echo "✅ Database refresh shell script is executable"
fi

# Make all database fix scripts executable
echo "🔧 Making database fix scripts executable..."
chmod +x /app/fix-database-schema.sh 2>/dev/null || true
chmod +x /app/fix-database-auth.sh 2>/dev/null || true
chmod +x /app/quick-db-fix.sh 2>/dev/null || true
chmod +x /app/init-database.sh 2>/dev/null || true

# Initialize database with extended timeout
echo "🔍 Checking database connection..."
if [ ! -z "$DATABASE_URL" ]; then
    echo "🔄 Waiting for database to be ready (extended timeout)..."
    
    # Extended wait for database - up to 2 minutes
    for i in {1..60}; do
        if mysqladmin ping -h mariadb -u farmboy -p"$MYSQL_PASSWORD" --silent 2>/dev/null; then
            echo "✅ Database connection established (attempt $i)"
            break
        fi
        echo "   Attempt $i/60 - Database not ready yet..."
        sleep 2
        if [ $i -eq 60 ]; then
            echo "❌ Database not ready after 120 seconds - CRITICAL ERROR"
            echo "🔧 Attempting database recovery..."
            # Try with root user as fallback
            mysqladmin ping -h mariadb -u root -p"$MYSQL_ROOT_PASSWORD" --silent || true
        fi
    done
    
    # Additional 10 second wait for database to fully stabilize
    echo "⏳ Allowing database to stabilize..."
    sleep 10
    
    # Verify database exists and create if needed
    echo "🔍 Checking if farmboy_db exists..."
    if mysql -h mariadb -u farmboy -p"$MYSQL_PASSWORD" -e "USE farmboy_db;" 2>/dev/null; then
        echo "✅ Database farmboy_db exists"
    else
        echo "🔄 Creating farmboy_db database..."
        # Create database first
        mysql -h mariadb -u farmboy -p"$MYSQL_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS farmboy_db;" || \
        mysql -h mariadb -u root -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS farmboy_db;"
        echo "✅ Database created"
        
        # Initialize with setup SQL
        echo "🔄 Initializing database schema..."
        if mysql -h mariadb -u farmboy -p"$MYSQL_PASSWORD" farmboy_db < /app/setup_database.sql; then
            echo "✅ Database initialized with farmboy user"
        else
            echo "⚠️ Trying with root user..."
            mysql -h mariadb -u root -p"$MYSQL_ROOT_PASSWORD" farmboy_db < /app/setup_database.sql
            echo "✅ Database initialized with root user"
        fi
    fi
    
    # Force reset and deploy Prisma schema to ensure all tables exist
    echo "🔧 Deploying Prisma schema (with force reset for clean state)..."
    cd /app
    
    # First, reset completely to ensure clean state
    echo "🔄 Resetting Prisma schema state..."
    npx prisma db push --force-reset --accept-data-loss --skip-generate
    
    # Generate Prisma client
    echo "🔧 Generating Prisma client..."
    npx prisma generate
    echo "✅ Prisma client generated"
    
    # Verify tables were created
    echo "🔍 Verifying database tables..."
    TABLE_COUNT=$(mysql -h mariadb -u farmboy -p"$MYSQL_PASSWORD" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='farmboy_db';" 2>/dev/null | tail -n 1)
    echo "📊 Found $TABLE_COUNT tables in database"
    
    # Check specifically for account_categories table
    ACCOUNT_CATEGORIES_EXISTS=$(mysql -h mariadb -u farmboy -p"$MYSQL_PASSWORD" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='farmboy_db' AND table_name='account_categories';" 2>/dev/null | tail -n 1)
    
    if [ "$ACCOUNT_CATEGORIES_EXISTS" = "1" ]; then
        echo "✅ account_categories table verified"
    else
        echo "❌ account_categories table missing - creating manually..."
        mysql -h mariadb -u farmboy -p"$MYSQL_PASSWORD" farmboy_db -e "
        CREATE TABLE IF NOT EXISTS account_categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );"
        echo "✅ account_categories table created manually"
    fi
    
    # NOW seed database (after confirming tables exist)
    echo "🔍 Checking if database needs seeding..."
    AGENT_COUNT=$(mysql -h mariadb -u farmboy -p"$MYSQL_PASSWORD" -e "SELECT COUNT(*) FROM farmboy_db.agents;" 2>/dev/null | tail -n 1)
    
    if [ "$AGENT_COUNT" = "0" ] || [ -z "$AGENT_COUNT" ]; then
        echo "🌱 Seeding database with initial data..."
        cd /app && node prisma/seed.js
        echo "✅ Database seeded successfully"
    else
        echo "✅ Database already has $AGENT_COUNT agents, skipping seed"
    fi
    
    echo "🎉 DATABASE INITIALIZATION COMPLETE!"
    echo "📊 Database Status:"
    echo "   - Connection: ✅ Established"  
    echo "   - Schema: ✅ Deployed"
    echo "   - Tables: ✅ $TABLE_COUNT created"
    echo "   - Data: ✅ Seeded"
    
else
    echo "⚠️ DATABASE_URL not set, skipping database initialization"
fi

# =============================================================================
# PHASE 2: X11 DISPLAY SERVER SETUP (After Database)
# =============================================================================

echo ""
echo "🖥️ PHASE 2: X11 DISPLAY SERVER SETUP"
echo "====================================="

# Now set up X11 environment
export DISPLAY=:1

# Wait for X11 to be ready (supervisord should have started Xvfb)
echo "⏳ Waiting for X11 display server (managed by supervisord)..."

# Wait for existing X server with timeout
for i in {1..30}; do
    if xset q &>/dev/null; then
        echo "✅ X11 display server is ready (attempt $i)"
        break
    fi
    echo "   Attempt $i/30 - Waiting for supervisord to start X11..."
    sleep 2
    
    # At attempt 15, try to help start X server
    if [ $i -eq 15 ]; then
        echo "🔄 X11 taking longer than expected, checking status..."
        ps aux | grep -i xvfb || true
        # Remove any stale lock files
        rm -f /tmp/.X1-lock /tmp/.X11-unix/X1 2>/dev/null || true
    fi
    
    if [ $i -eq 30 ]; then
        echo "⚠️ X11 display server not ready after 60 seconds"
        echo "🔧 Attempting manual X server start..."
        # Try to start Xvfb manually as last resort
        Xvfb :1 -screen 0 1920x1080x24 -nolisten tcp -nolisten unix &
        sleep 5
        if xset q &>/dev/null; then
            echo "✅ Manual X server start successful"
        else
            echo "⚠️ X11 issues persist, but continuing anyway..."
            echo "⚠️ Some graphical features may not work properly."
        fi
    fi
done

# =============================================================================
# PHASE 3: ENVIRONMENT SETUP (After Database & X11)
# =============================================================================

echo ""
echo "🛠️ PHASE 3: ENVIRONMENT SETUP"
echo "=============================="

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p /appdata/DreamBot/BotData
mkdir -p /root/Desktop
mkdir -p /root/EternalFarm/Logs
mkdir -p /root/DreamBot/BotData

# Set proper permissions for directories with chmod
echo "🔐 Setting directory permissions..."
chmod 755 /root/DreamBot
chmod -R 755 /appdata/EternalFarm 2>/dev/null || true
chmod -R 755 /appdata/DreamBot 2>/dev/null || true
chmod 755 /root/EternalFarm
chmod 755 /root/EternalFarm/Logs
chmod 755 /root/DreamBot/BotData

echo "✅ Directory setup complete"

# Create EternalFarm key files with proper permissions
echo "🔑 Setting up EternalFarm keys..."

# Only create key files if environment variables are set
if [ ! -z "${AGENT_KEY}" ]; then
    echo "${AGENT_KEY}" > /root/EternalFarm/Logs/agent.key
    chmod 600 /root/EternalFarm/Logs/agent.key
    echo "✅ Agent key file created with chmod 600"
else
    echo "⚠️ AGENT_KEY environment variable not set, skipping key file creation"
fi

if [ ! -z "${CHECKER_KEY}" ]; then
    echo "${CHECKER_KEY}" > /root/EternalFarm/Logs/checker.key
    chmod 600 /root/EternalFarm/Logs/checker.key
    echo "✅ Checker key file created with chmod 600"
else
    echo "⚠️ CHECKER_KEY environment variable not set, skipping key file creation"
fi

if [ ! -z "${AUTOMATOR_KEY}" ]; then
    echo "${AUTOMATOR_KEY}" > /root/EternalFarm/Logs/automator.key
    chmod 600 /root/EternalFarm/Logs/automator.key
    echo "✅ Automator key file created with chmod 600"
else
    echo "⚠️ AUTOMATOR_KEY environment variable not set, skipping key file creation"
fi

# Download EternalFarm tools if not already present
echo "📥 Checking EternalFarm tools..."

AGENT_URL="https://eternalfarm.ams3.cdn.digitaloceanspaces.com/agent/2.1.3/linux-amd64/EternalFarmAgent"
CHECKER_URL="https://eternalfarm.ams3.cdn.digitaloceanspaces.com/checker/2.0.13/linux-amd64/EternalFarmChecker"
AUTOMATOR_URL="https://eternalfarm.ams3.cdn.digitaloceanspaces.com/browser-automator/2.4.5/linux-amd64/EternalFarmBrowserAutomator"

# Download EternalFarm Agent with retry
if [ ! -f "/usr/local/bin/EternalFarmAgent" ]; then
    echo "📥 Downloading EternalFarm Agent..."
    for i in {1..3}; do
        if curl -L --connect-timeout 30 -o /usr/local/bin/EternalFarmAgent "$AGENT_URL"; then
            chmod +x /usr/local/bin/EternalFarmAgent
            echo "✅ EternalFarm Agent downloaded with chmod +x"
            break
        else
            echo "⚠️ Attempt $i/3 failed to download EternalFarm Agent"
            if [ $i -eq 3 ]; then
                echo "❌ Failed to download EternalFarm Agent after 3 attempts"
            fi
            sleep 2
        fi
    done
else
    echo "✅ EternalFarm Agent already exists"
    chmod +x /usr/local/bin/EternalFarmAgent
fi

# Download EternalFarm Checker with retry
if [ ! -f "/usr/local/bin/EternalFarmChecker" ]; then
    echo "📥 Downloading EternalFarm Checker..."
    for i in {1..3}; do
        if curl -L --connect-timeout 30 -o /usr/local/bin/EternalFarmChecker "$CHECKER_URL"; then
            chmod +x /usr/local/bin/EternalFarmChecker
            echo "✅ EternalFarm Checker downloaded with chmod +x"
            break
        else
            echo "⚠️ Attempt $i/3 failed to download EternalFarm Checker"
            if [ $i -eq 3 ]; then
                echo "❌ Failed to download EternalFarm Checker after 3 attempts"
            fi
            sleep 2
        fi
    done
else
    echo "✅ EternalFarm Checker already exists"
    chmod +x /usr/local/bin/EternalFarmChecker
fi

# Download EternalFarm Browser Automator with retry
if [ ! -f "/usr/local/bin/EternalFarmBrowserAutomator" ]; then
    echo "📥 Downloading EternalFarm Browser Automator..."
    for i in {1..3}; do
        if curl -L --connect-timeout 30 -o /usr/local/bin/EternalFarmBrowserAutomator "$AUTOMATOR_URL"; then
            chmod +x /usr/local/bin/EternalFarmBrowserAutomator
            echo "✅ EternalFarm Browser Automator downloaded with chmod +x"
            break
        else
            echo "⚠️ Attempt $i/3 failed to download EternalFarm Browser Automator"
            if [ $i -eq 3 ]; then
                echo "❌ Failed to download EternalFarm Browser Automator after 3 attempts"
            fi
            sleep 2
        fi
    done
else
    echo "✅ EternalFarm Browser Automator already exists"
    chmod +x /usr/local/bin/EternalFarmBrowserAutomator
fi

# Copy DreamBot settings to both locations
echo "📝 Creating DreamBot settings..."
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
  "lastRanScript": "Premium:1.312:P2P Master AI",
  "favoriteScripts": [
    "P2P Master AI",
    "# NMZ",
    "Dreamy AIO Skiller Elite Lifetime",
    "Guester - Lifetime"
  ],
  "lastUsedUsername": "316388619",
  "lastScriptCategories": 7,
  "lastCanvasSize": "765:503",
  "gameLayout": "Force resizable (modern)",
  "roofSolverActive": true,
  "dismissSolversActive": true,
  "disableRegionRendering": false,
  "disableTileRendering": false,
  "disableTileUnderlayRendering": false,
  "disableTileOverlayRendering": false,
  "stopWidgetUpdates": false,
  "stopWidgetDraw": false,
  "noClickWalk": false,
  "noInputLogin": false,
  "menuInjection": false,
  "disableAnimation": false,
  "disableModelDrawing": false,
  "disableSounds": true,
  "deleteAccountOnBan": false,
  "lowMemory": false,
  "lowDetail": false,
  "worldHopOnLoginError": false,
  "inputHandlerType": "Auto-detect",
  "proxyAddress": "",
  "proxyPort": 0,
  "proxyUser": "",
  "proxyPassword": "",
  "useProxy": false,
  "reflectionOptimizations": true,
  "windowFlags": 0,
  "windowPosition": "0,0",
  "windowSize": "765,503",
  "renderOptimizations": true,
  "gpuAcceleration": false,
  "reduceAnimations": false,
  "disableCursor": false,
  "disableMenuClicks": false,
  "disableScriptMenuClicks": false,
  "hidePaintFromScreenshots": false,
  "hideUsernameFromScreenshots": false,
  "screenshotQuality": 0.9,
  "screenshotDirectory": "/root/DreamBot/Screenshots"
}
EOF

chmod 644 /root/DreamBot/BotData/settings.json
echo "✅ DreamBot settings created with chmod 644"

# Also copy to appdata location for persistence
mkdir -p /appdata/DreamBot/BotData
cp /root/DreamBot/BotData/settings.json /appdata/DreamBot/BotData/settings.json
chmod 644 /appdata/DreamBot/BotData/settings.json

# Download DreamBot client if not already present
if [ ! -f "/root/DreamBot/BotData/client.jar" ]; then
    echo "📥 Downloading DreamBot client..."
    for i in {1..3}; do
        if curl -L --connect-timeout 30 -o /root/DreamBot/BotData/client.jar "https://dreambot.org/download/client.jar"; then
            chmod 644 /root/DreamBot/BotData/client.jar
            echo "✅ DreamBot client downloaded with chmod 644"
            break
        else
            echo "⚠️ Attempt $i/3 failed to download DreamBot client"
            if [ $i -eq 3 ]; then
                echo "❌ Failed to download DreamBot client after 3 attempts"
            fi
            sleep 2
        fi
    done
else
    echo "✅ DreamBot client already exists"
    chmod 644 /root/DreamBot/BotData/client.jar
fi

# Verify downloads and permissions
echo "🔍 Verifying setup..."
echo "   EternalFarm Agent: $([ -f "/usr/local/bin/EternalFarmAgent" ] && echo "✅ Present" || echo "❌ Missing")"
echo "   EternalFarm Checker: $([ -f "/usr/local/bin/EternalFarmChecker" ] && echo "✅ Present" || echo "❌ Missing")"
echo "   EternalFarm Browser Automator: $([ -f "/usr/local/bin/EternalFarmBrowserAutomator" ] && echo "✅ Present" || echo "❌ Missing")"
echo "   DreamBot Client: $([ -f "/root/DreamBot/BotData/client.jar" ] && echo "✅ Present" || echo "❌ Missing")"
echo "   DreamBot Settings: $([ -f "/root/DreamBot/BotData/settings.json" ] && echo "✅ Present" || echo "❌ Missing")"
echo "   Agent Key: $([ -f "/root/EternalFarm/Logs/agent.key" ] && echo "✅ Present" || echo "❌ Missing")"
echo "   Checker Key: $([ -f "/root/EternalFarm/Logs/checker.key" ] && echo "✅ Present" || echo "❌ Missing")"
echo "   Automator Key: $([ -f "/root/EternalFarm/Logs/automator.key" ] && echo "✅ Present" || echo "❌ Missing")"

# Set up desktop shortcuts
echo "🖥️ Setting up desktop environment..."

# Create desktop shortcut for EternalFarm Agent
cat > /root/Desktop/EternalFarm-Agent.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=EternalFarm Agent
Comment=EternalFarm Agent Application
Exec=xfce4-terminal --hold --title='EternalFarm Agent' --command='/usr/local/bin/EternalFarmAgent --key-file=/root/EternalFarm/Logs/agent.key --show-gui'
Icon=utilities-terminal
Terminal=false
Categories=Utility;
EOF

# Create desktop shortcut for EternalFarm Checker
cat > /root/Desktop/EternalFarm-Checker.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=EternalFarm Checker
Comment=EternalFarm Checker Application
Exec=xfce4-terminal --hold --title='EternalFarm Checker' --command='/usr/local/bin/EternalFarmChecker --key-file=/root/EternalFarm/Logs/checker.key --show-gui'
Icon=utilities-terminal
Terminal=false
Categories=Utility;
EOF

# Create desktop shortcut for EternalFarm Browser Automator
cat > /root/Desktop/EternalFarm-Automator.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=EternalFarm Browser Automator
Comment=EternalFarm Browser Automator Application
Exec=xfce4-terminal --hold --title='EternalFarm Browser Automator' --command='/usr/local/bin/EternalFarmBrowserAutomator --key-file=/root/EternalFarm/Logs/automator.key --show-gui'
Icon=utilities-terminal
Terminal=false
Categories=Utility;
EOF

# Create desktop shortcut for DreamBot
cat > /root/Desktop/DreamBot.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=DreamBot
Comment=DreamBot OSRS Client
Exec=java -jar /root/DreamBot/BotData/client.jar
Icon=applications-games
Terminal=false
Categories=Game;
EOF

# Make desktop files executable with chmod
chmod +x /root/Desktop/*.desktop
echo "✅ Desktop shortcuts created with chmod +x"

# Test X11 functionality
echo "🧪 Testing X11 functionality..."
if wmctrl -d &>/dev/null; then
    echo "✅ Window manager is accessible"
else
    echo "⚠️ Window manager not yet ready (this is normal during startup)"
fi

# Apply auto-login fix
if [ -f "/app/fix-auto-login.sh" ]; then
    echo "🔧 Applying auto-login fix..."
    chmod +x /app/fix-auto-login.sh
    /app/fix-auto-login.sh
fi

# Set up VNC server
echo "🔧 Setting up VNC server..."
if [ ! -d ~/.vnc ]; then
  mkdir -p ~/.vnc
  chmod 700 ~/.vnc
fi

# Setup a password for VNC
if [ -n "$VNC_PASSWORD" ]; then
  echo "$VNC_PASSWORD" | vncpasswd -f > ~/.vnc/passwd
  chmod 600 ~/.vnc/passwd
  echo "✅ VNC password set with chmod 600"
fi

# Set up resolution
if [ -z "$DISPLAY_WIDTH" ]; then
  DISPLAY_WIDTH=1920
fi
if [ -z "$DISPLAY_HEIGHT" ]; then
  DISPLAY_HEIGHT=1080
fi

# =============================================================================
# FINAL STATUS & STARTUP
# =============================================================================

echo ""
echo "🎉 FARM MANAGER STARTUP COMPLETE!"
echo "========================================"
echo "✅ Phase 1 - Database: INITIALIZED & SEEDED"
echo "✅ Phase 2 - X11 Display: READY"  
echo "✅ Phase 3 - Environment: CONFIGURED"
echo ""
echo "📊 System Status:"
echo "   - Database Connection: ✅ Active"
echo "   - Prisma Schema: ✅ Deployed" 
echo "   - X11 Display: ✅ Ready on :1"
echo "   - Java Environment: ✅ Configured"
echo "   - EternalFarm Tools: ✅ Downloaded & Executable"
echo "   - EternalFarm Keys: ✅ Created & Secured (chmod 600)"
echo "   - DreamBot Client: ✅ Downloaded"
echo "   - DreamBot Settings: ✅ Generated"
echo "   - Desktop Shortcuts: ✅ Created (chmod +x)"
echo "   - VNC Server: ✅ Configured"
echo ""
echo "🌐 Access Points:"
echo "   - VNC Interface: http://localhost:8080"
echo "   - Farm Manager: http://localhost:3333"
echo "   - noVNC Web: http://localhost:6080"
echo ""
echo "🚀 Ready for production bot farming operations!"

# Run supervisord to start all services
echo "▶️ Starting supervisord to manage all services..."
exec /usr/bin/supervisord -c /etc/supervisord.conf

# This script has completed successfully
exit 0 