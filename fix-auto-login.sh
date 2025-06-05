#!/bin/bash
set -e

echo "🔧 Fix Auto-Login Script for EternalFarm and DreamBot"
echo "==================================================="

# Create necessary directories
mkdir -p /appdata/DreamBot/BotData
mkdir -p /root/DreamBot/BotData
mkdir -p /root/EternalFarm/Logs

# Create empty log files if they don't exist
touch /root/EternalFarm/Logs/agent.log
touch /root/EternalFarm/Logs/checker.log
touch /root/EternalFarm/Logs/automator.log

# Set proper permissions
chmod 755 /root/EternalFarm
chmod 755 /root/EternalFarm/Logs
chmod 644 /root/EternalFarm/Logs/agent.log
chmod 644 /root/EternalFarm/Logs/checker.log
chmod 644 /root/EternalFarm/Logs/automator.log
chmod 755 /root/DreamBot
chmod 755 /root/DreamBot/BotData

# Create DreamBot settings
echo "📝 Creating DreamBot settings file..."
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
  "auto_login": true,
  "log_file": "/root/EternalFarm/Logs/agent.log"
}
EOF
chmod 600 /root/.eternalfarm/agent.config

# Pre-populate the key directly into the EternalFarm app's expected location
AGENT_KEY="${AGENT_KEY:-${ETERNALFARM_AGENT_KEY:-${API_KEY:-}}}"
echo "${AGENT_KEY}" > /root/EternalFarm/Logs/agent.key
chmod 600 /root/EternalFarm/Logs/agent.key

# Create checker config to auto-login
echo "📝 Creating EternalFarm Checker auto-login config..."
cat > /root/.eternalfarm/checker.config << EOF
{
  "key_path": "/appdata/EternalFarm/checker.key",
  "remember_key": true,
  "auto_login": true,
  "log_file": "/root/EternalFarm/Logs/checker.log"
}
EOF
chmod 600 /root/.eternalfarm/checker.config

# Pre-populate the key directly into the EternalFarm app's expected location
CHECKER_KEY="${CHECKER_KEY:-${ETERNALFARM_AGENT_KEY:-${API_KEY:-}}}"
echo "${CHECKER_KEY}" > /root/EternalFarm/Logs/checker.key
chmod 600 /root/EternalFarm/Logs/checker.key

# Create browser automator config to auto-login
echo "📝 Creating EternalFarm Browser Automator auto-login config..."
cat > /root/.eternalfarm/browser-automator.config << EOF
{
  "key_path": "/appdata/EternalFarm/api.key",
  "remember_key": true,
  "auto_login": true,
  "log_file": "/root/EternalFarm/Logs/automator.log"
}
EOF
chmod 600 /root/.eternalfarm/browser-automator.config

# Pre-populate the key directly into the EternalFarm app's expected location
AUTOMATOR_KEY="${AUTOMATOR_KEY:-${ETERNALFARM_AGENT_KEY:-${API_KEY:-}}}"
echo "${AUTOMATOR_KEY}" > /root/EternalFarm/Logs/automator.key
chmod 600 /root/EternalFarm/Logs/automator.key

# Update desktop shortcuts to use the auto-login
echo "🖥️ Updating desktop shortcuts..."

# Update EternalFarm Agent desktop shortcut (keep visible in terminal)
cat > /root/Desktop/EternalFarm-Agent.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=EternalFarm Agent
Comment=EternalFarm Agent Application
Exec=xfce4-terminal --hold --title='EternalFarm Agent' --command='/usr/local/bin/EternalFarmAgent --auto-login --key-file=/root/EternalFarm/Logs/agent.key --show-gui'
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
Exec=/usr/local/bin/EternalFarmChecker --auto-login --key-file=/root/EternalFarm/Logs/checker.key --headless
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
Exec=/usr/local/bin/EternalFarmBrowserAutomator --auto-login --key-file=/root/EternalFarm/Logs/automator.key --headless
Icon=utilities-terminal
Terminal=false
Categories=Utility;
EOF

# Make desktop files executable
chmod +x /root/Desktop/*.desktop

# Ensure all keys exist and have content
echo "🔑 Checking EternalFarm keys..."
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
echo "  - /root/DreamBot/BotData/settings.json"
echo "  - /root/.eternalfarm/agent.config"
echo "  - /root/.eternalfarm/checker.config" 
echo "  - /root/.eternalfarm/browser-automator.config"
echo "  - /root/EternalFarm/Logs/agent.key"
echo "  - /root/EternalFarm/Logs/checker.key"
echo "  - /root/EternalFarm/Logs/automator.key"
echo "  - Desktop shortcuts updated with auto-login parameter"
echo ""
echo "Please restart the EternalFarm applications and DreamBot client"

exit 0 