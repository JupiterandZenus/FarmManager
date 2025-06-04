#!/bin/bash
set -e

echo "🔧 Fixing VNC and EternalFarm Logs Issue"
echo "========================================"

# Create necessary EternalFarm directories
mkdir -p /root/EternalFarm/Logs
mkdir -p /root/DreamBot/BotData
mkdir -p /appdata/DreamBot/BotData

# Create empty log files if they don't exist
touch /root/EternalFarm/Logs/agent.log
touch /root/EternalFarm/Logs/checker.log
touch /root/EternalFarm/Logs/automator.log

# Fix permissions
chmod 755 /root/EternalFarm
chmod 755 /root/EternalFarm/Logs
chmod 644 /root/EternalFarm/Logs/agent.log
chmod 644 /root/EternalFarm/Logs/checker.log
chmod 644 /root/EternalFarm/Logs/automator.log
chmod 755 /root/DreamBot
chmod 755 /root/DreamBot/BotData

# Copy keys to the expected locations
echo "🔑 Copying keys to new locations..."
AGENT_KEY="${AGENT_KEY:-${ETERNALFARM_AGENT_KEY:-${API_KEY:-}}}"
CHECKER_KEY="${CHECKER_KEY:-${ETERNALFARM_AGENT_KEY:-${API_KEY:-}}}"
AUTOMATOR_KEY="${AUTOMATOR_KEY:-${ETERNALFARM_AGENT_KEY:-${API_KEY:-}}}"

# Copy from existing locations if available
if [ -f /appdata/EternalFarm/agent.key ]; then
  cat /appdata/EternalFarm/agent.key > /root/EternalFarm/Logs/agent.key
else
  echo "${AGENT_KEY}" > /root/EternalFarm/Logs/agent.key
fi

if [ -f /appdata/EternalFarm/checker.key ]; then
  cat /appdata/EternalFarm/checker.key > /root/EternalFarm/Logs/checker.key
else
  echo "${CHECKER_KEY}" > /root/EternalFarm/Logs/checker.key
fi

if [ -f /appdata/EternalFarm/api.key ]; then
  cat /appdata/EternalFarm/api.key > /root/EternalFarm/Logs/automator.key
else
  echo "${AUTOMATOR_KEY}" > /root/EternalFarm/Logs/automator.key
fi

# Set proper permissions for keys
chmod 600 /root/EternalFarm/Logs/agent.key
chmod 600 /root/EternalFarm/Logs/checker.key
chmod 600 /root/EternalFarm/Logs/automator.key

# Fix VNC service if needed
if [ -d /etc/services.d/x11vnc ]; then
  echo "🖥️ Ensuring VNC service is properly configured..."
  mkdir -p /etc/services.d/x11vnc/log
  if [ ! -f /etc/services.d/x11vnc/run ]; then
    cat > /etc/services.d/x11vnc/run << 'EOF'
#!/usr/bin/with-contenv bash
exec 2>&1
DISPLAY=:1 exec s6-setuidgid root x11vnc -display :1 -rfbauth /root/.vnc/passwd -rfbport 5900 -forever -shared -repeat -xkb
EOF
    chmod +x /etc/services.d/x11vnc/run
  fi
fi

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

# Copy DreamBot settings to appdata location as backup
cp /root/DreamBot/BotData/settings.json /appdata/DreamBot/BotData/settings.json
chmod 600 /appdata/DreamBot/BotData/settings.json

echo "✅ VNC and EternalFarm Logs fix completed"
echo "========================================"
echo "The following files have been created/updated:"
echo "  - /root/EternalFarm/Logs/agent.log"
echo "  - /root/EternalFarm/Logs/checker.log"
echo "  - /root/EternalFarm/Logs/automator.log"
echo "  - /root/EternalFarm/Logs/agent.key"
echo "  - /root/EternalFarm/Logs/checker.key"
echo "  - /root/EternalFarm/Logs/automator.key"
echo "  - /root/DreamBot/BotData/settings.json"
echo "  - /appdata/DreamBot/BotData/settings.json"
echo ""
echo "Please restart the container or services now."
exit 0 