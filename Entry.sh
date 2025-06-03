#!/bin/bash

# DreamBot Automation Script with Enhanced Features
# Author: Farm Management Team
# Version: 2.2
# Last Updated: 2025-01-28

echo "🚀 Starting Enhanced DreamBot with Entry.sh..."
echo "🕐 Start time: $(date)"

# Set strict error handling
set -euo pipefail

# Configuration
export HOSTNAME=$(hostname)
export START_TIME=$(date +%s)

# Environment Variables
EF_API_KEY="${ETERNALFARM_AGENT_KEY:-P52FE7-I2G19W-C2S4R8-BQZZFP-1FADWV-V3}"
ETERNAL_FARM_KEY="${ETERNAL_FARM_KEY:-}"
ETERNAL_AUTH_KEY="${ETERNAL_AUTH_KEY:-}"
AUTH_AGENT_KEY="${ETERNALFARM_AGENT_KEY:-P52FE7-I2G19W-C2S4R8-BQZZFP-1FADWV-V3}"

# Application URLs (always download latest)
DREAMBOT_URL="https://dreambot.org/DBLauncher.jar"
ETERNALFARM_AGENT_URL="https://eternalfarm.ams3.cdn.digitaloceanspaces.com/agent/2.1.3/linux-amd64/EternalFarmAgent"
ETERNALFARM_CHECKER_URL="https://eternalfarm.ams3.cdn.digitaloceanspaces.com/checker/2.0.13/linux-amd64/EternalFarmChecker"
ETERNALFARM_BROWSER_URL="https://eternalfarm.ams3.cdn.digitaloceanspaces.com/browser-automator/2.4.5/linux-amd64/EternalFarmBrowserAutomator"

# Display configuration
echo "📋 Configuration:"
echo "   Hostname: $HOSTNAME"
echo "   Display: ${DISPLAY:-:1}"
echo "   EF API Key: ${EF_API_KEY:0:10}..."
echo "   Auth Agent Key: ${AUTH_AGENT_KEY:0:10}..."
echo "   Environment: ${NODE_ENV:-production}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for a process to be ready
wait_for_process() {
    local process_name="$1"
    local timeout="${2:-30}"
    local count=0
    
    echo "⏳ Waiting for $process_name to be ready..."
    while [ $count -lt $timeout ]; do
        if pgrep -f "$process_name" > /dev/null; then
            echo "✅ $process_name is ready"
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    
    echo "❌ Timeout waiting for $process_name"
    return 1
}

# Function to check if port is in use
port_in_use() {
    netstat -tuln | grep -q ":$1 "
}

# Function to check display
check_display() {
    if [ -z "${DISPLAY:-}" ]; then
        export DISPLAY=":1"
        echo "🖥️ Set DISPLAY to :1"
    fi
    
    echo "🖥️ Using display: $DISPLAY"
}

# Function to setup directories
setup_directories() {
    echo "📁 Setting up directories..."
    
    # Create all necessary directories
    mkdir -p /var/run/dbus /tmp/.X11-unix /var/log /root/.vnc /root/.config/autostart /root/Desktop /root/DreamBot/BotData
    
    # Set proper permissions
    chmod 1777 /tmp/.X11-unix
    chmod 755 /root/Desktop
    chmod 755 /root/DreamBot/BotData
}

# Function to download and install DreamBot (always fresh download)
download_and_install_dreambot() {
    echo "🤖 Downloading latest DreamBot client..."
    
    DREAMBOT_DIR="/root/DreamBot/BotData"
    CLIENT_JAR="${DREAMBOT_DIR}/client.jar"
    
    # Always download fresh copy
    echo "📥 Downloading DreamBot from: $DREAMBOT_URL"
    if curl -L -f -o "$CLIENT_JAR" "$DREAMBOT_URL"; then
        echo "✅ DreamBot client downloaded successfully"
        
        # Set proper permissions
        chmod 755 "$CLIENT_JAR"
        chown root:root "$CLIENT_JAR"
        
        # Verify download
        if [ -f "$CLIENT_JAR" ] && [ -s "$CLIENT_JAR" ]; then
            echo "✅ DreamBot client verified: $(ls -la "$CLIENT_JAR")"
            echo "📊 DreamBot client size: $(du -h "$CLIENT_JAR" | cut -f1)"
        else
            echo "❌ DreamBot client download verification failed"
            return 1
        fi
    else
        echo "❌ Failed to download DreamBot client from $DREAMBOT_URL"
        return 1
    fi
}

# Function to download and install EternalFarm Agent (always fresh download)
download_and_install_eternalfarm_agent() {
    echo "🌐 Downloading latest EternalFarm Agent..."
    
    # Always download fresh copy
    echo "📥 Downloading EternalFarm Agent from: $ETERNALFARM_AGENT_URL"
    if curl -L -f -o /usr/local/bin/EternalFarmAgent "$ETERNALFARM_AGENT_URL"; then
        echo "✅ EternalFarm Agent downloaded successfully"
        
        # Set proper permissions
        chmod 755 /usr/local/bin/EternalFarmAgent
        chown root:root /usr/local/bin/EternalFarmAgent
        
        # Verify
        if [ -x "/usr/local/bin/EternalFarmAgent" ]; then
            echo "✅ EternalFarm Agent verified: $(ls -la /usr/local/bin/EternalFarmAgent)"
        else
            echo "❌ EternalFarm Agent verification failed"
            return 1
        fi
    else
        echo "❌ Failed to download EternalFarm Agent"
        return 1
    fi
}

# Function to download and install EternalFarm Checker (always fresh download)
download_and_install_eternalfarm_checker() {
    echo "🔍 Downloading latest EternalFarm Checker..."
    
    # Always download fresh copy
    echo "📥 Downloading EternalFarm Checker from: $ETERNALFARM_CHECKER_URL"
    if curl -L -f -o /usr/local/bin/EternalFarmChecker "$ETERNALFARM_CHECKER_URL"; then
        echo "✅ EternalFarm Checker downloaded successfully"
        
        # Set proper permissions
        chmod 755 /usr/local/bin/EternalFarmChecker
        chown root:root /usr/local/bin/EternalFarmChecker
        
        # Verify
        if [ -x "/usr/local/bin/EternalFarmChecker" ]; then
            echo "✅ EternalFarm Checker verified: $(ls -la /usr/local/bin/EternalFarmChecker)"
        else
            echo "❌ EternalFarm Checker verification failed"
            return 1
        fi
    else
        echo "❌ Failed to download EternalFarm Checker"
        return 1
    fi
}

# Function to download and install EternalFarm Browser Automator (always fresh download)
download_and_install_eternalfarm_browser_automator() {
    echo "🌐 Downloading latest EternalFarm Browser Automator..."
    
    # Always download fresh copy
    echo "📥 Downloading EternalFarm Browser Automator from: $ETERNALFARM_BROWSER_URL"
    if curl -L -f -o /usr/local/bin/EternalFarmBrowserAutomator "$ETERNALFARM_BROWSER_URL"; then
        echo "✅ EternalFarm Browser Automator downloaded successfully"
        
        # Set proper permissions
        chmod 755 /usr/local/bin/EternalFarmBrowserAutomator
        chown root:root /usr/local/bin/EternalFarmBrowserAutomator
        
        # Verify
        if [ -x "/usr/local/bin/EternalFarmBrowserAutomator" ]; then
            echo "✅ EternalFarm Browser Automator verified: $(ls -la /usr/local/bin/EternalFarmBrowserAutomator)"
        else
            echo "❌ EternalFarm Browser Automator verification failed"
            return 1
        fi
    else
        echo "❌ Failed to download EternalFarm Browser Automator"
        return 1
    fi
}

# Function to create desktop shortcuts
create_desktop_shortcuts() {
    echo "📝 Creating desktop shortcuts..."
    
    # Clean existing shortcuts
    rm -f /root/Desktop/*.desktop
    
    # Text Editor shortcut
    cat > /root/Desktop/Text-Editor.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Text Editor
Comment=Mousepad Text Editor
Exec=bash -c "DISPLAY=:1 mousepad"
Icon=accessories-text-editor
Terminal=false
Categories=Utility;TextEditor;
EOF
    chmod +x /root/Desktop/Text-Editor.desktop

    # DreamBot Launcher shortcut
    cat > /root/Desktop/DreamBot-Launcher.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=DreamBot Launcher
Comment=Launch DreamBot Client
Exec=bash -c "DISPLAY=:1 cd /root/DreamBot/BotData && java -jar client.jar"
Path=/root/DreamBot/BotData
Icon=applications-java
Terminal=false
Categories=Game;
EOF
    chmod +x /root/Desktop/DreamBot-Launcher.desktop
    
    # EternalFarm Agent shortcut
    cat > /root/Desktop/EternalFarm-Agent.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=EternalFarm Agent
Comment=Launch EternalFarm Agent
Exec=bash -c "DISPLAY=:1 /usr/local/bin/EternalFarmAgent --auth-agent-key='$AUTH_AGENT_KEY' --show-gui"
Path=/root
Icon=system-run
Terminal=false
Categories=Network;
EOF
    chmod +x /root/Desktop/EternalFarm-Agent.desktop

    # EternalFarm Checker shortcut
    cat > /root/Desktop/EternalFarm-Checker.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=EternalFarm Checker
Comment=Launch EternalFarm Checker
Exec=bash -c "DISPLAY=:1 /usr/local/bin/EternalFarmChecker --auth-agent-key='$AUTH_AGENT_KEY' --show-gui"
Path=/root
Icon=system-search
Terminal=false
Categories=Network;
EOF
    chmod +x /root/Desktop/EternalFarm-Checker.desktop

    # EternalFarm Browser Automator shortcut
    cat > /root/Desktop/EternalFarm-Browser-Automator.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=EternalFarm Browser Automator
Comment=Launch EternalFarm Browser Automator
Exec=bash -c "DISPLAY=:1 /usr/local/bin/EternalFarmBrowserAutomator --auth-agent-key='$AUTH_AGENT_KEY' --show-gui"
Path=/root
Icon=web-browser
Terminal=false
Categories=Network;
EOF
    chmod +x /root/Desktop/EternalFarm-Browser-Automator.desktop

    # Chromium Browser shortcut
    cat > /root/Desktop/Chromium-Browser.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Chromium Browser
Comment=Web Browser
Exec=bash -c "DISPLAY=:1 chromium --no-sandbox --disable-dev-shm-usage --disable-gpu --remote-debugging-port=9222"
Icon=chromium
Terminal=false
Categories=Network;WebBrowser;
EOF
    chmod +x /root/Desktop/Chromium-Browser.desktop

    # Terminal shortcut
    cat > /root/Desktop/Terminal.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Terminal
Comment=Terminal Emulator
Exec=bash -c "DISPLAY=:1 xfce4-terminal"
Icon=utilities-terminal
Terminal=false
Categories=Utility;TerminalEmulator;
EOF
    chmod +x /root/Desktop/Terminal.desktop

    echo "✅ Desktop shortcuts created successfully"
}

# Function to setup display and VNC
setup_display_and_vnc() {
    echo "🖥️ Setting up X11 display and VNC..."
    
    check_display
    setup_directories

    # Kill any existing VNC or X processes
    echo "🔄 Cleaning up existing processes..."
    pkill -f x11vnc || true
    pkill -f Xvfb || true
    
    # Wait a moment for cleanup
    sleep 2
    
    # Start Xvfb (Virtual Frame Buffer)
    echo "🖥️ Starting Xvfb virtual display..."
    if ! pgrep -f "Xvfb.*:1" > /dev/null; then
        Xvfb :1 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset -nolisten tcp &
        XVFB_PID=$!
        echo "✅ Xvfb started with PID: $XVFB_PID"
        
        # Wait for X server to initialize
        sleep 5
        
        # Verify X server is running
        if pgrep -f "Xvfb.*:1" > /dev/null; then
            echo "✅ Xvfb is running successfully"
        else
            echo "❌ Xvfb failed to start"
            return 1
        fi
    else
        echo "✅ Xvfb already running"
    fi
    
    # Start VNC server (x11vnc)
    echo "🔐 Starting VNC server..."
    if ! pgrep -f "x11vnc" > /dev/null; then
        x11vnc -display :1 -forever -nopw -shared -rfbport 5900 -bg -o /var/log/x11vnc.log
        
        # Wait for VNC to start
        sleep 3
        
        # Verify VNC server is running
        if pgrep -f "x11vnc" > /dev/null; then
            echo "✅ VNC server started successfully on port 5900"
            echo "🔧 VNC configured for passwordless access"
        else
            echo "❌ VNC server failed to start"
            return 1
        fi
    else
        echo "✅ VNC server already running"
    fi
    
    # Start XFCE desktop environment
    echo "🖥️ Starting XFCE desktop environment..."
    if ! pgrep -f "xfce4-session" > /dev/null; then
        DISPLAY=:1 startxfce4 &
        XFCE_PID=$!
        echo "✅ XFCE started with PID: $XFCE_PID"
        
        # Wait for desktop to initialize
        sleep 10
        
        # Verify XFCE is running
        if pgrep -f "xfce4-session" > /dev/null; then
            echo "✅ XFCE desktop is running successfully"
        else
            echo "⚠️ XFCE desktop may not have started properly"
        fi
    else
        echo "✅ XFCE desktop already running"
    fi
    
    # Start noVNC for web access
    echo "🌐 Starting noVNC web interface..."
    if ! pgrep -f "websockify" > /dev/null; then
        # Give VNC server a moment to be fully ready
        sleep 2
        
        # Start noVNC websockify
        websockify --web=/usr/share/novnc/ --log-file=/var/log/websockify.log 80 localhost:5900 &
        NOVNC_PID=$!
        echo "✅ noVNC started with PID: $NOVNC_PID"
        
        # Wait for noVNC to start
        sleep 3
        
        # Verify noVNC is running
        if pgrep -f "websockify" > /dev/null; then
            echo "✅ noVNC web interface is running on port 80"
        else
            echo "⚠️ noVNC web interface may not have started properly"
        fi
    else
        echo "✅ noVNC web interface already running"
    fi
    
    echo "✅ VNC setup completed successfully!"
    echo "📊 VNC Connection Info:"
    echo "   VNC Port: 5900 (no password required)"
    echo "   noVNC Web: http://localhost:80/vnc.html"
    echo "   Display: :1 (1920x1080)"
}

# Function to setup DreamBot environment
setup_dreambot() {
    echo "🤖 Setting up DreamBot environment..."
    
    # Set DreamBot-specific environment variables
    export JAVA_HOME="/usr/lib/jvm/adoptopenjdk-8-hotspot-amd64"
    export PATH="$JAVA_HOME/bin:$PATH"
    
    echo "✅ DreamBot environment ready"
    echo "   Java Home: $JAVA_HOME"
    echo "   Java Version: $(java -version 2>&1 | head -1)"
}

# Function to test internet connectivity
test_internet_connectivity() {
    echo "🌐 Testing internet connectivity..."
    
    # Test basic connectivity
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        echo "✅ Internet connectivity: OK"
    else
        echo "❌ Internet connectivity: FAILED"
        return 1
    fi
    
    # Test DNS resolution
    if nslookup google.com >/dev/null 2>&1; then
        echo "✅ DNS resolution: OK"
    else
        echo "❌ DNS resolution: FAILED"
        return 1
    fi
    
    # Test HTTPS connectivity
    if curl -s --max-time 10 https://google.com >/dev/null; then
        echo "✅ HTTPS connectivity: OK"
    else
        echo "❌ HTTPS connectivity: FAILED"
        return 1
    fi
    
    echo "✅ All connectivity tests passed"
}

# Function to monitor services
monitor_services() {
    echo "📊 Service monitoring started..."
    
    while true; do
        sleep 60
        
        # Check X server
        if ! pgrep -f "Xvfb.*:1" > /dev/null; then
            echo "⚠️ X server not running"
        fi
        
        # Check VNC server
        if ! pgrep -f "x11vnc" > /dev/null; then
            echo "⚠️ VNC server not running"
        fi
        
        # Update status
        echo "$(date): Services check completed" >> /var/log/entry-monitor.log
    done
}

# Main execution
main() {
    echo "🎯 Starting main Entry.sh execution..."
    
    # Test internet connectivity first
    test_internet_connectivity
    
    # Setup display and VNC
    setup_display_and_vnc
    
    # Download and install all components (fresh downloads)
    echo "📥 Downloading latest versions of all applications..."
    download_and_install_dreambot
    download_and_install_eternalfarm_agent
    download_and_install_eternalfarm_checker
    download_and_install_eternalfarm_browser_automator
    
    # Create desktop shortcuts
    create_desktop_shortcuts
    
    # Setup DreamBot environment
    setup_dreambot
    
    echo "✅ Entry.sh startup completed successfully!"
    echo "🕐 Startup time: $(($(date +%s) - START_TIME)) seconds"
    echo "📊 Latest versions downloaded and configured:"
    echo "   - DreamBot Launcher: /root/DreamBot/BotData/client.jar"
    echo "   - EternalFarm Agent: /usr/local/bin/EternalFarmAgent"
    echo "   - EternalFarm Checker: /usr/local/bin/EternalFarmChecker"
    echo "   - EternalFarm Browser Automator: /usr/local/bin/EternalFarmBrowserAutomator"
    echo "   - Chromium Browser: Available"
    echo "   - All desktop shortcuts created"
    
    # Start monitoring in background
    monitor_services &

    # Keep the script running
    echo "🔄 Entry.sh monitoring active..."
    while true; do
        sleep 30
        # Basic health check - just keep running
    done
}

# Error handling
trap 'echo "❌ Entry.sh encountered an error on line $LINENO"; exit 1' ERR
trap 'echo "🛑 Entry.sh interrupted"; exit 0' INT TERM

# Start main execution
main "$@" 