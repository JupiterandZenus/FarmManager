#!/bin/bash
set -e

echo "🔧 Fix Auto-Login Script for EternalFarm and DreamBot"
echo "==================================================="

# Create necessary directories
mkdir -p /appdata/DreamBot/BotData

# Copy DreamBot settings.json to both locations to ensure it's found
echo "📝 Copying DreamBot settings to all potential locations..."
cp /root/DreamBot/BotData/settings.json /appdata/DreamBot/BotData/settings.json
chmod 600 /appdata/DreamBot/BotData/settings.json

# Create agent config to auto-login
echo "📝 Creating EternalFarm Agent auto-login config..."
mkdir -p /root/.eternalfarm
cat > /root/.eternalfarm/agent.config << EOF
{
  "key_path": "/appdata/EternalFarm/agent.key",
  "remember_key": true,
  "auto_login": true
}
EOF
chmod 600 /root/.eternalfarm/agent.config

# Create checker config to auto-login
echo "📝 Creating EternalFarm Checker auto-login config..."
cat > /root/.eternalfarm/checker.config << EOF
{
  "key_path": "/appdata/EternalFarm/checker.key",
  "remember_key": true,
  "auto_login": true
}
EOF
chmod 600 /root/.eternalfarm/checker.config

# Create browser automator config to auto-login
echo "📝 Creating EternalFarm Browser Automator auto-login config..."
cat > /root/.eternalfarm/browser-automator.config << EOF
{
  "key_path": "/appdata/EternalFarm/api.key",
  "remember_key": true,
  "auto_login": true
}
EOF
chmod 600 /root/.eternalfarm/browser-automator.config

# Update desktop shortcuts to use the auto-login
echo "🖥️ Updating desktop shortcuts..."

# Update EternalFarm Agent desktop shortcut (keep visible in terminal)
cat > /root/Desktop/EternalFarm-Agent.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=EternalFarm Agent
Comment=EternalFarm Agent Application
Exec=xfce4-terminal --hold --title='EternalFarm Agent' --command='/usr/local/bin/EternalFarmAgent --auto-login --key-file=/appdata/EternalFarm/agent.key --show-gui'
Icon=utilities-terminal
Terminal=false
Categories=Utility;
EOF

# Update EternalFarm Checker desktop shortcut (run in background)
cat > /root/Desktop/EternalFarm-Checker.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=EternalFarm Checker
Comment=EternalFarm Checker Application
Exec=/usr/local/bin/EternalFarmChecker --auto-login --key-file=/appdata/EternalFarm/checker.key --headless
Icon=utilities-terminal
Terminal=false
Categories=Utility;
EOF

# Update EternalFarm Browser Automator desktop shortcut (run in background)
cat > /root/Desktop/EternalFarm-Automator.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=EternalFarm Browser Automator
Comment=EternalFarm Browser Automator Application
Exec=/usr/local/bin/EternalFarmBrowserAutomator --auto-login --key-file=/appdata/EternalFarm/api.key --headless
Icon=utilities-terminal
Terminal=false
Categories=Utility;
EOF

# Make desktop files executable
chmod +x /root/Desktop/*.desktop

# Ensure all keys exist and have content
echo "🔑 Checking EternalFarm keys..."
AGENT_KEY="${AGENT_KEY:-${ETERNALFARM_AGENT_KEY:-${API_KEY:-}}}"
CHECKER_KEY="${CHECKER_KEY:-${ETERNALFARM_AGENT_KEY:-${API_KEY:-}}}"
AUTOMATOR_KEY="${AUTOMATOR_KEY:-${ETERNALFARM_AGENT_KEY:-${API_KEY:-}}}"

echo "${AGENT_KEY}" > /appdata/EternalFarm/agent.key
echo "${CHECKER_KEY}" > /appdata/EternalFarm/checker.key
echo "${AUTOMATOR_KEY}" > /appdata/EternalFarm/api.key

chmod 600 /appdata/EternalFarm/agent.key
chmod 600 /appdata/EternalFarm/checker.key
chmod 600 /appdata/EternalFarm/api.key

# Echo status
echo "✅ Auto-login fix completed"
echo "==================================================="
echo "The following files have been updated:"
echo "  - /appdata/DreamBot/BotData/settings.json"
echo "  - /root/.eternalfarm/agent.config"
echo "  - /root/.eternalfarm/checker.config" 
echo "  - /root/.eternalfarm/browser-automator.config"
echo "  - Desktop shortcuts updated with auto-login parameter"
echo ""
echo "Please restart the EternalFarm applications and DreamBot client"

exit 0 