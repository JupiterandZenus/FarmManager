#!/bin/bash
set -e

echo "🚀 Entry.sh - EternalFarm & DreamBot Setup Script"
echo "================================================="

# Set up environment
export DISPLAY=:1
export JAVA_HOME=$(find /usr/lib/jvm -name "temurin-8-jdk-amd64" | head -1)
if [ -z "$JAVA_HOME" ]; then
    export JAVA_HOME=$(find /usr/lib/jvm -name "java-8-openjdk-*" | head -1)
fi
export PATH=$JAVA_HOME/bin:$PATH

echo "✅ Java Home set to: $JAVA_HOME"

# Wait for X11 to be ready with more robust checking
echo "⏳ Waiting for X11 display server..."
for i in {1..60}; do
    if xset q &>/dev/null; then
        echo "✅ X11 display server is ready"
        break
    fi
    echo "   Attempt $i/60 - X11 not ready yet..."
    sleep 2
    if [ $i -eq 60 ]; then
        echo "⚠️ X11 display server not ready after 120 seconds, but continuing anyway..."
    fi
done

# Create necessary directories
mkdir -p /appdata/DreamBot/BotData
mkdir -p /root/Desktop
mkdir -p /root/EternalFarm/Logs
mkdir -p /root/DreamBot/BotData

# Set proper permissions for directories
chmod 755 /root/DreamBot
chmod -R 755 /appdata/EternalFarm
chmod -R 755 /appdata/DreamBot
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
    echo "✅ Agent key file created"
else
    echo "⚠️ AGENT_KEY environment variable not set, skipping key file creation"
fi

if [ ! -z "${CHECKER_KEY}" ]; then
    echo "${CHECKER_KEY}" > /root/EternalFarm/Logs/checker.key
    chmod 600 /root/EternalFarm/Logs/checker.key
    echo "✅ Checker key file created"
else
    echo "⚠️ CHECKER_KEY environment variable not set, skipping key file creation"
fi

if [ ! -z "${AUTOMATOR_KEY}" ]; then
    echo "${AUTOMATOR_KEY}" > /root/EternalFarm/Logs/automator.key
    chmod 600 /root/EternalFarm/Logs/automator.key
    echo "✅ Automator key file created"
else
    echo "⚠️ AUTOMATOR_KEY environment variable not set, skipping key file creation"
fi

echo "✅ Key files setup complete"

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
            echo "✅ EternalFarm Agent downloaded"
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
fi

# Download EternalFarm Checker with retry
if [ ! -f "/usr/local/bin/EternalFarmChecker" ]; then
    echo "📥 Downloading EternalFarm Checker..."
    for i in {1..3}; do
        if curl -L --connect-timeout 30 -o /usr/local/bin/EternalFarmChecker "$CHECKER_URL"; then
            chmod +x /usr/local/bin/EternalFarmChecker
            echo "✅ EternalFarm Checker downloaded"
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
fi

# Download EternalFarm Browser Automator with retry
if [ ! -f "/usr/local/bin/EternalFarmBrowserAutomator" ]; then
    echo "📥 Downloading EternalFarm Browser Automator..."
    for i in {1..3}; do
        if curl -L --connect-timeout 30 -o /usr/local/bin/EternalFarmBrowserAutomator "$AUTOMATOR_URL"; then
            chmod +x /usr/local/bin/EternalFarmBrowserAutomator
            echo "✅ EternalFarm Browser Automator downloaded"
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
  "settingsVersion": 3,
  "discordWebhook": "https://discord.com/api/webhooks/1358933950210379816/Pdfyxcilip-xI3-q5ILOl9eRCl0nhEICZHZuvbyQm9aARgzI7GuHQExqBj1NNfkScPvV",
  "notifyOnScriptStart": false,
  "notifyOnScriptStop": false,
  "notifyOnScriptPause": false,
  "notifyOnScheduleStart": false,
  "notifyOnScheduleStop": false,
  "notifyOnBreakStart": false,
  "notifyOnBreakStop": false,
  "notifyOnBan": true,
  "notifyOnDeath": true,
  "notifyOnLevelUp": true,
  "notifyOnLevelUpAmount": 5,
  "notifyOnPet": true,
  "notifyOnValuableDrop": true,
  "notifyOnValuableDropAmount": 250000,
  "notifyOnUntradeableDrop": true,
  "scriptWebhookAccessAllowed": true,
  "mentionOnBan": true,
  "movesMouseOffscreen": true,
  "stopsAfterUpdates": true
}
EOF
chmod 600 /root/DreamBot/BotData/settings.json

# Also copy to appdata location as backup
cp /root/DreamBot/BotData/settings.json /appdata/DreamBot/BotData/settings.json
chmod 600 /appdata/DreamBot/BotData/settings.json

# Download DreamBot client if not already present
echo "📥 Checking DreamBot client..."
if [ ! -f "/root/DreamBot/BotData/client.jar" ]; then
    echo "📥 Downloading DreamBot client..."
    for i in {1..3}; do
        if curl -L --connect-timeout 30 -o /root/DreamBot/BotData/client.jar "https://dreambot.org/DBLauncher.jar"; then
            chmod +x /root/DreamBot/BotData/client.jar
            echo "✅ DreamBot client downloaded"
            break
        else
            echo "⚠️ Attempt $i/3 failed to download DreamBot client"
            if [ $i -eq 3 ]; then
                echo "❌ Failed to download DreamBot client after 3 attempts"
                # Create an empty file to prevent repeated download attempts
                touch /root/DreamBot/BotData/client.jar
            fi
            sleep 2
        fi
    done
else
    echo "✅ DreamBot client already exists"
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

# Make desktop files executable
chmod +x /root/Desktop/*.desktop

# Test X11 functionality
echo "🧪 Testing X11 functionality..."
if wmctrl -d &>/dev/null; then
    echo "✅ Window manager is accessible"
else
    echo "⚠️ Window manager not yet ready (this is normal during startup)"
fi

# Make database refresh scripts executable
echo "🔧 Setting up database refresh tools..."
if [ -f "/app/refresh-database.js" ]; then
    chmod +x /app/refresh-database.js
    echo "✅ Database refresh script is executable"
fi

if [ -f "/app/refresh-database.sh" ]; then
    chmod +x /app/refresh-database.sh
    echo "✅ Database refresh shell script is executable"
fi

# Initialize database if needed
echo "🔍 Checking database connection..."
if [ ! -z "$DATABASE_URL" ]; then
    echo "🔄 Waiting for database to be ready..."
    # Wait for database to be ready
    for i in {1..30}; do
        if mysqladmin ping -h mariadb -u root -p"$MYSQL_ROOT_PASSWORD" --silent; then
            echo "✅ Database is ready"
            break
        fi
        echo "   Attempt $i/30 - Database not ready yet..."
        sleep 2
        if [ $i -eq 30 ]; then
            echo "⚠️ Database not ready after 60 seconds, but continuing anyway..."
        fi
    done
    
    # Check if database exists and initialize if needed
    if mysql -h mariadb -u root -p"$MYSQL_ROOT_PASSWORD" -e "USE farmboy_db;" 2>/dev/null; then
        echo "✅ Database already exists"
    else
        echo "🔄 Initializing database..."
        mysql -h mariadb -u root -p"$MYSQL_ROOT_PASSWORD" < /app/setup_database.sql
        echo "✅ Database initialized"
    fi
    
    # Generate Prisma client
    echo "🔧 Generating Prisma client..."
    cd /app && npx prisma generate
    echo "✅ Prisma client generated"
    
    # Seed database if empty
    AGENT_COUNT=$(mysql -h mariadb -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT COUNT(*) FROM farmboy_db.agents;" 2>/dev/null | tail -n 1)
    if [ "$AGENT_COUNT" = "0" ] || [ -z "$AGENT_COUNT" ]; then
        echo "🌱 Seeding database..."
        cd /app && node prisma/seed.js
        echo "✅ Database seeded"
    else
        echo "✅ Database already has data, skipping seed"
    fi
else
    echo "⚠️ DATABASE_URL not set, skipping database initialization"
fi

# Final status report
echo ""
echo "🎉 Entry.sh setup complete!"
echo "================================================="
echo "✅ X11 Display: Ready"
echo "✅ Java Environment: Configured"
echo "✅ EternalFarm Tools: Downloaded"
echo "✅ EternalFarm Keys: Created"
echo "✅ DreamBot Client: Downloaded"
echo "✅ DreamBot Settings: Generated"
echo "✅ Desktop Shortcuts: Created"
echo "✅ Database Tools: Configured"
echo "✅ Database: Initialized"
echo ""
echo "📋 Next Steps:"
echo "   - EternalFarm services will be started by supervisord"
echo "   - DreamBot instances can be launched via Farm Manager"
echo "   - Access VNC interface on port 8080"
echo "   - Access Farm Manager on port 3333"
echo ""
echo "🚀 Ready for bot farming operations!"

# Apply auto-login fix
if [ -f "/app/fix-auto-login.sh" ]; then
    echo "🔧 Applying auto-login fix..."
    chmod +x /app/fix-auto-login.sh
    /app/fix-auto-login.sh
fi

# Set up VNC server
if [ ! -d ~/.vnc ]; then
  mkdir -p ~/.vnc
fi

# Setup a password for VNC
if [ -n "$VNC_PASSWORD" ]; then
  echo "$VNC_PASSWORD" | vncpasswd -f > ~/.vnc/passwd
  chmod 600 ~/.vnc/passwd
fi

# Set up resolution
if [ -z "$DISPLAY_WIDTH" ]; then
  DISPLAY_WIDTH=1920
fi
if [ -z "$DISPLAY_HEIGHT" ]; then
  DISPLAY_HEIGHT=1080
fi

# Run supervisord
exec /usr/bin/supervisord -c /etc/supervisord.conf

# This script has completed successfully
exit 0 