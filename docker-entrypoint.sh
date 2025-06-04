#!/bin/bash
set -e

echo "🚀 Starting Farm Admin Application..."

# Set up X11 and display environment
export DISPLAY=:1
export XAUTHORITY=/root/.Xauthority

# PRIORITY 1: Create EternalFarm key files FIRST (before any services launch)
echo "🔑 PRIORITY: Setting up EternalFarm key files..."
mkdir -p /appdata/EternalFarm
mkdir -p /root/.eternalfarm

# Create individual key files for each service
if [ -n "$AGENT_KEY" ]; then
    echo "$AGENT_KEY" > /appdata/EternalFarm/agent.key
    chmod 600 /appdata/EternalFarm/agent.key
    echo "✅ EternalFarm agent.key created"
else
    echo "⚠️ AGENT_KEY not set - agent.key not created"
fi

if [ -n "$CHECKER_KEY" ]; then
    echo "$CHECKER_KEY" > /appdata/EternalFarm/checker.key
    chmod 600 /appdata/EternalFarm/checker.key
    echo "✅ EternalFarm checker.key created"
else
    echo "⚠️ CHECKER_KEY not set - checker.key not created"
fi

if [ -n "$AUTOMATOR_KEY" ]; then
    echo "$AUTOMATOR_KEY" > /appdata/EternalFarm/api.key
    chmod 600 /appdata/EternalFarm/api.key
    echo "✅ EternalFarm api.key (automator) created"
else
    echo "⚠️ AUTOMATOR_KEY not set - api.key not created"
fi

# Create necessary directories
echo "📁 Creating DreamBot directories..."
mkdir -p /root/DreamBot/BotData
mkdir -p /appdata/DreamBot/BotData

# Copy settings.json to DreamBot directories
echo "📋 Copying DreamBot settings..."
if [ -f "/app/settings.json" ]; then
    cp /app/settings.json /root/DreamBot/BotData/settings.json
    cp /app/settings.json /appdata/DreamBot/BotData/settings.json
    echo "✅ Settings.json copied to DreamBot directories"
else
    echo "⚠️ settings.json not found in /app/"
fi

# Set up X11 permissions for GUI applications
echo "🖥️ Setting up X11 permissions..."
touch /root/.Xauthority
xhost + 2>/dev/null || echo "⚠️ xhost not available yet (will be set later)"

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

# Execute the main command
echo "🚀 Starting server..."
exec "$@" 