#!/bin/bash
set -e

echo "🚀 Starting Farm Admin Application..."

# Set up X11 and display environment
export DISPLAY=:1
export XAUTHORITY=/root/.Xauthority

# PRIORITY 1: Create EternalFarm key files FIRST (before any services launch)
echo "🔑 PRIORITY: Setting up EternalFarm key files..."

# Create all necessary directories first
echo "📁 Creating key directories..."
mkdir -p /appdata/EternalFarm
mkdir -p /root/.eternalfarm
mkdir -p /app/data
mkdir -p /root/DreamBot/BotData
mkdir -p /appdata/DreamBot/BotData

# Set proper permissions on directories
chmod 755 /appdata/EternalFarm
chmod 755 /root/.eternalfarm

# Function to create and validate key file
create_key_file() {
    local service_name=$1
    local env_var_name=$2
    local file_name=$3
    local key_value=${!env_var_name}
    
    if [ -n "$key_value" ]; then
        local key_file="/appdata/EternalFarm/$file_name"
        echo "$key_value" > "$key_file"
        chmod 600 "$key_file"
        
        # Validate the key was written correctly
        if [ -f "$key_file" ] && [ -s "$key_file" ]; then
            echo "✅ EternalFarm $service_name key created: $key_file"
            echo "   Key length: $(wc -c < "$key_file") chars"
        else
            echo "❌ Failed to create $service_name key file: $key_file"
        fi
    else
        echo "⚠️ $env_var_name not set - $service_name key not created"
    fi
}

# Create individual key files for each service with validation
echo "🔐 Creating individual service keys..."
create_key_file "Agent" "AGENT_KEY" "agent.key"
create_key_file "Checker" "CHECKER_KEY" "checker.key"
create_key_file "Automator" "AUTOMATOR_KEY" "api.key"

# Also create legacy key file for backward compatibility
if [ -n "$ETERNALFARM_AGENT_KEY" ]; then
    echo "$ETERNALFARM_AGENT_KEY" > /root/.eternalfarm/key
    chmod 600 /root/.eternalfarm/key
    echo "✅ Legacy EternalFarm key created: /root/.eternalfarm/key"
fi

# Create necessary directories for DreamBot
echo "📁 Creating DreamBot directories..."
mkdir -p /root/DreamBot/BotData
mkdir -p /appdata/DreamBot/BotData

# Generate DreamBot settings.json from environment variables
echo "📋 Generating DreamBot settings from environment variables..."
if [ -f "/app/generate-dreambot-settings.js" ]; then
    # Run the dynamic settings generator
    node /app/generate-dreambot-settings.js
    echo "✅ Dynamic DreamBot settings generated successfully"
else
    echo "⚠️ Dynamic settings generator not found, using static fallback..."
    
    # Copy static settings if generator not available
    if [ -f "/app/settings.json" ]; then
        # Copy to both locations
        cp /app/settings.json /root/DreamBot/BotData/settings.json
        cp /app/settings.json /appdata/DreamBot/BotData/settings.json
        
        # Validate copies
        for settings_file in "/root/DreamBot/BotData/settings.json" "/appdata/DreamBot/BotData/settings.json"; do
            if [ -f "$settings_file" ] && [ -s "$settings_file" ]; then
                echo "✅ Settings.json copied to: $settings_file"
            else
                echo "❌ Failed to copy settings.json to: $settings_file"
            fi
        done
    else
        echo "⚠️ No settings.json found, creating minimal version..."
        
        # Create a minimal settings.json if nothing else is available
        cat > /app/settings.json << 'EOF'
{
  "breaks": [],
  "cpuSaver": true,
  "disableCPUSaverWhenNotRunning": false,
  "enableCPUSaverWhenMinimized": false,
  "fps": 20,
  "renderDistance": 25,
  "developerMode": false,
  "freshStart": false,
  "sdnIntegration": true,
  "covertMode": true,
  "mouseSpeed": 100,
  "autoAddAccounts": true,
  "settingsVersion": 3,
  "discordWebhook": "",
  "notifyOnBan": true,
  "notifyOnDeath": true,
  "notifyOnLevelUp": true,
  "movesMouseOffscreen": true,
  "stopsAfterUpdates": true
}
EOF
        
        # Copy the created settings.json
        cp /app/settings.json /root/DreamBot/BotData/settings.json
        cp /app/settings.json /appdata/DreamBot/BotData/settings.json
        echo "✅ Created and copied minimal settings.json"
    fi
fi

# Set up X11 permissions for GUI applications
echo "🖥️ Setting up X11 permissions..."
touch /root/.Xauthority
xhost + 2>/dev/null || echo "⚠️ xhost not available yet (will be set later)"

# Verify key setup
echo "🔍 Verifying EternalFarm key setup..."
for key_file in "/appdata/EternalFarm/agent.key" "/appdata/EternalFarm/checker.key" "/appdata/EternalFarm/api.key"; do
    if [ -f "$key_file" ]; then
        echo "✅ Key file exists: $key_file ($(wc -c < "$key_file") chars)"
    else
        echo "❌ Key file missing: $key_file"
    fi
done

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until npx prisma db push --accept-data-loss 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 5
done

echo "✅ Database connection established"

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma db push --accept-data-loss

# Generate Prisma client (in case it's not already generated)
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🎉 Database setup complete!"

# Final verification and summary
echo "📊 Final Setup Summary:"
echo "   Agent Key: $([ -f '/appdata/EternalFarm/agent.key' ] && echo '✅ Ready' || echo '❌ Missing')"
echo "   Checker Key: $([ -f '/appdata/EternalFarm/checker.key' ] && echo '✅ Ready' || echo '❌ Missing')"
echo "   Automator Key: $([ -f '/appdata/EternalFarm/api.key' ] && echo '✅ Ready' || echo '❌ Missing')"
echo "   Settings.json: $([ -f '/root/DreamBot/BotData/settings.json' ] && echo '✅ Ready' || echo '❌ Missing')"

# Execute the main command
echo "🚀 Starting server..."
exec "$@" 