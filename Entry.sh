#!/bin/bash
set -e

echo "🚀 Entry.sh - EternalFarm & DreamBot Setup Script"
echo "================================================="

# Set up environment
export DISPLAY=:1
export JAVA_HOME=$(find /usr/lib/jvm -name "java-8-openjdk-*" | head -1)
export PATH=$JAVA_HOME/bin:$PATH

# Wait for X11 to be ready
echo "⏳ Waiting for X11 display server..."
for i in {1..30}; do
    if xset q &>/dev/null; then
        echo "✅ X11 display server is ready"
        break
    fi
    echo "   Attempt $i/30 - X11 not ready yet..."
    sleep 2
    if [ $i -eq 30 ]; then
        echo "❌ X11 display server not ready after 60 seconds"
        exit 1
    fi
done

# Create necessary directories with proper permissions
echo "📁 Creating directories..."
mkdir -p /root/DreamBot/BotData
mkdir -p /appdata/EternalFarm
mkdir -p /appdata/DreamBot/BotData
mkdir -p /root/Desktop

# Set proper permissions for directories
chmod 755 /root/DreamBot
chmod -R 755 /appdata/EternalFarm
chmod -R 755 /appdata/DreamBot

echo "✅ Directory setup complete"

# Create EternalFarm key files with proper permissions
echo "🔑 Setting up EternalFarm keys..."
echo "${AGENT_KEY}" > /appdata/EternalFarm/agent.key
echo "${CHECKER_KEY}" > /appdata/EternalFarm/checker.key
echo "${AUTOMATOR_KEY}" > /appdata/EternalFarm/api.key

# Set proper permissions for key files
chmod 600 /appdata/EternalFarm/agent.key
chmod 600 /appdata/EternalFarm/checker.key
chmod 600 /appdata/EternalFarm/api.key

echo "✅ Key files created with secure permissions"

# Download EternalFarm tools if not already present
echo "📥 Checking EternalFarm tools..."

AGENT_URL="https://eternalfarm.ams3.cdn.digitaloceanspaces.com/agent/2.1.3/linux-amd64/EternalFarmAgent"
CHECKER_URL="https://eternalfarm.ams3.cdn.digitaloceanspaces.com/checker/2.0.13/linux-amd64/EternalFarmChecker"
AUTOMATOR_URL="https://eternalfarm.ams3.cdn.digitaloceanspaces.com/browser-automator/2.4.5/linux-amd64/EternalFarmBrowserAutomator"

# Download EternalFarm Agent
if [ ! -f "/usr/local/bin/EternalFarmAgent" ]; then
    echo "📥 Downloading EternalFarm Agent..."
    curl -L -o /usr/local/bin/EternalFarmAgent "$AGENT_URL"
    chmod +x /usr/local/bin/EternalFarmAgent
    echo "✅ EternalFarm Agent downloaded"
else
    echo "✅ EternalFarm Agent already exists"
fi

# Download EternalFarm Checker
if [ ! -f "/usr/local/bin/EternalFarmChecker" ]; then
    echo "📥 Downloading EternalFarm Checker..."
    curl -L -o /usr/local/bin/EternalFarmChecker "$CHECKER_URL"
    chmod +x /usr/local/bin/EternalFarmChecker
    echo "✅ EternalFarm Checker downloaded"
else
    echo "✅ EternalFarm Checker already exists"
fi

# Download EternalFarm Browser Automator
if [ ! -f "/usr/local/bin/EternalFarmBrowserAutomator" ]; then
    echo "📥 Downloading EternalFarm Browser Automator..."
    curl -L -o /usr/local/bin/EternalFarmBrowserAutomator "$AUTOMATOR_URL"
    chmod +x /usr/local/bin/EternalFarmBrowserAutomator
    echo "✅ EternalFarm Browser Automator downloaded"
else
    echo "✅ EternalFarm Browser Automator already exists"
fi

# Generate DreamBot settings.json
echo "⚙️ Generating DreamBot settings..."
cat > /root/DreamBot/BotData/settings.json << EOF
{
    "username": "${DREAMBOT_USERNAME}",
    "password": "${DREAMBOT_PASSWORD}",
    "script": "${DREAMBOT_SCRIPT}",
    "world": ${DREAMBOT_WORLD:-301},
    "args": "${DREAMBOT_ARGS}",
    "fps": 20,
    "lowCpuMode": true,
    "lowMemoryMode": false,
    "covertMode": true,
    "developerMode": true
}
EOF

chmod 600 /root/DreamBot/BotData/settings.json
echo "✅ DreamBot settings.json created"

# Download DreamBot client if not already present
echo "📥 Checking DreamBot client..."
if [ ! -f "/root/DreamBot/BotData/client.jar" ]; then
    echo "📥 Downloading DreamBot client..."
    curl -L -o /root/DreamBot/BotData/client.jar "https://dreambot.org/DBLauncher.jar"
    chmod +x /root/DreamBot/BotData/client.jar
    echo "✅ DreamBot client downloaded"
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
echo "   Agent Key: $([ -f "/appdata/EternalFarm/agent.key" ] && echo "✅ Present" || echo "❌ Missing")"
echo "   Checker Key: $([ -f "/appdata/EternalFarm/checker.key" ] && echo "✅ Present" || echo "❌ Missing")"
echo "   Automator Key: $([ -f "/appdata/EternalFarm/api.key" ] && echo "✅ Present" || echo "❌ Missing")"

# Set up desktop shortcuts
echo "🖥️ Setting up desktop environment..."

# Create desktop shortcut for EternalFarm Agent
cat > /root/Desktop/EternalFarm-Agent.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=EternalFarm Agent
Comment=EternalFarm Agent Application
Exec=xfce4-terminal --hold --title='EternalFarm Agent' --command='/usr/local/bin/EternalFarmAgent --key-file=/appdata/EternalFarm/agent.key --show-gui'
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
Exec=xfce4-terminal --hold --title='EternalFarm Checker' --command='/usr/local/bin/EternalFarmChecker --key-file=/appdata/EternalFarm/checker.key --show-gui'
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
Exec=xfce4-terminal --hold --title='EternalFarm Browser Automator' --command='/usr/local/bin/EternalFarmBrowserAutomator --key-file=/appdata/EternalFarm/api.key --show-gui'
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
echo ""
echo "📋 Next Steps:"
echo "   - EternalFarm services will be started by supervisord"
echo "   - DreamBot instances can be launched via Farm Manager"
echo "   - Access VNC interface on port 8080"
echo "   - Access Farm Manager on port 3333"
echo ""
echo "🚀 Ready for bot farming operations!" 