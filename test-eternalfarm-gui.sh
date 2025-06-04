#!/bin/bash

echo "🧪 EternalFarm Agent GUI Test Script"
echo "===================================="

# Test 1: Check if settings.json exists in expected locations
echo ""
echo "1. Testing settings.json file locations:"
echo "----------------------------------------"

if [ -f "/app/settings.json" ]; then
    echo "✅ /app/settings.json - EXISTS"
else
    echo "❌ /app/settings.json - MISSING"
fi

if [ -f "/root/DreamBot/BotData/settings.json" ]; then
    echo "✅ /root/DreamBot/BotData/settings.json - EXISTS"
else
    echo "❌ /root/DreamBot/BotData/settings.json - MISSING"
fi

if [ -f "/appdata/DreamBot/BotData/settings.json" ]; then
    echo "✅ /appdata/DreamBot/BotData/settings.json - EXISTS"
else
    echo "❌ /appdata/DreamBot/BotData/settings.json - MISSING"
fi

# Test 2: Check EternalFarm agent.key file
echo ""
echo "2. Testing EternalFarm agent.key file:"
echo "--------------------------------------"

if [ -f "/appdata/EternalFarm/agent.key" ]; then
    echo "✅ /appdata/EternalFarm/agent.key - EXISTS"
    
    # Check file permissions
    if [ -r "/appdata/EternalFarm/agent.key" ]; then
        echo "✅ agent.key is readable"
        
        # Check if file has content
        if [ -s "/appdata/EternalFarm/agent.key" ]; then
            echo "✅ agent.key has content"
            echo "   Key preview: $(head -c 20 /appdata/EternalFarm/agent.key)..."
        else
            echo "❌ agent.key is empty"
        fi
    else
        echo "❌ agent.key is not readable"
    fi
else
    echo "❌ /appdata/EternalFarm/agent.key - MISSING"
fi

# Test 3: Check X11 display setup
echo ""
echo "3. Testing X11 Display Setup:"
echo "-----------------------------"

if [ -n "$DISPLAY" ]; then
    echo "✅ DISPLAY environment variable set: $DISPLAY"
else
    echo "❌ DISPLAY environment variable not set"
fi

if [ -f "/root/.Xauthority" ]; then
    echo "✅ X11 authority file exists"
else
    echo "❌ X11 authority file missing"
fi

# Test 4: Check if xfce4-terminal is available
echo ""
echo "4. Testing Terminal Availability:"
echo "--------------------------------"

if command -v xfce4-terminal >/dev/null 2>&1; then
    echo "✅ xfce4-terminal is available"
else
    echo "❌ xfce4-terminal not found"
fi

# Test 5: Check EternalFarm Agent binary
echo ""
echo "5. Testing EternalFarm Agent Binary:"
echo "-----------------------------------"

if [ -f "/usr/local/bin/EternalFarmAgent" ]; then
    echo "✅ EternalFarmAgent binary exists"
    echo "   Location: /usr/local/bin/EternalFarmAgent"
    
    # Check if it's executable
    if [ -x "/usr/local/bin/EternalFarmAgent" ]; then
        echo "✅ EternalFarmAgent is executable"
    else
        echo "❌ EternalFarmAgent is not executable"
    fi
else
    echo "❌ EternalFarmAgent binary not found"
fi

# Test 6: Check supervisord configuration
echo ""
echo "6. Testing Supervisord Configuration:"
echo "------------------------------------"

if [ -f "/etc/supervisor/conf.d/supervisord.conf" ] || [ -f "/app/supervisord.conf" ]; then
    echo "✅ Supervisord configuration found"
    
    # Check if EternalFarm Agent is configured
    if grep -q "eternalfarm-agent" /app/supervisord.conf 2>/dev/null; then
        echo "✅ EternalFarm Agent configured in supervisord"
        
        # Check if using key file
        if grep -q "key-file=/appdata/EternalFarm/agent.key" /app/supervisord.conf 2>/dev/null; then
            echo "✅ EternalFarm Agent configured to use key file"
        else
            echo "❌ EternalFarm Agent not configured to use key file"
        fi
    else
        echo "❌ EternalFarm Agent not found in supervisord config"
    fi
else
    echo "❌ Supervisord configuration not found"
fi

# Test 7: Check environment variables
echo ""
echo "7. Testing Environment Variables:"
echo "--------------------------------"

if [ -n "$AUTH_AGENT_KEY" ]; then
    echo "✅ AUTH_AGENT_KEY is set: ${AUTH_AGENT_KEY:0:10}..."
else
    echo "❌ AUTH_AGENT_KEY not set"
fi

if [ -n "$JAVA_HOME" ]; then
    echo "✅ JAVA_HOME is set: $JAVA_HOME"
else
    echo "❌ JAVA_HOME not set"
fi

# Test 8: Test GUI launch command (dry run)
echo ""
echo "8. Testing GUI Launch Command (Dry Run):"
echo "----------------------------------------"

echo "Command that will be executed:"
echo "xfce4-terminal --hold --title='EternalFarm Agent' --command='/usr/local/bin/EternalFarmAgent --key-file=/appdata/EternalFarm/agent.key --show-gui'"

# Summary
echo ""
echo "========================================"
echo "📋 TEST SUMMARY"
echo "========================================"

echo ""
echo "🔧 EXPECTED BEHAVIOR AFTER DEPLOYMENT:"
echo "- EternalFarm Agent will launch in a terminal window"
echo "- Terminal window will be titled 'EternalFarm Agent'"
echo "- GUI will be visible in VNC (port 8080)"
echo "- Settings.json will be available in DreamBot directories"
echo "- Agent will load key from /appdata/EternalFarm/agent.key"

echo ""
echo "🌐 TO VIEW THE GUI:"
echo "1. Deploy the container in Portainer"
echo "2. Open VNC web interface: http://your-server:8080"
echo "3. Look for terminal windows titled 'EternalFarm Agent'"
echo "4. The agent GUI should be visible within the terminal"

echo ""
echo "✅ Test script completed!" 