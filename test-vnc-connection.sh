#!/bin/bash

echo "🔍 VNC Connection Test Script"
echo "=============================="

# Check if Xvfb is running
echo "📺 Checking Xvfb (Virtual Display)..."
if pgrep -f "Xvfb :1" > /dev/null; then
    echo "✅ Xvfb is running on display :1"
else
    echo "❌ Xvfb is not running"
fi

# Check if x11vnc is running
echo "🖥️ Checking x11vnc (VNC Server)..."
if pgrep -f "x11vnc" > /dev/null; then
    echo "✅ x11vnc is running"
    echo "📊 VNC Server Details:"
    ps aux | grep x11vnc | grep -v grep
else
    echo "❌ x11vnc is not running"
fi

# Check if noVNC websockify is running
echo "🌐 Checking noVNC (Web Interface)..."
if pgrep -f "websockify" > /dev/null; then
    echo "✅ noVNC websockify is running"
    echo "📊 noVNC Details:"
    ps aux | grep websockify | grep -v grep
else
    echo "❌ noVNC websockify is not running"
fi

# Check port availability
echo "🔌 Checking Port Status..."
echo "Port 5900 (VNC): $(netstat -ln | grep :5900 && echo "LISTENING" || echo "NOT LISTENING")"
echo "Port 8080 (noVNC): $(netstat -ln | grep :8080 && echo "LISTENING" || echo "NOT LISTENING")"

# Test VNC connection
echo "🧪 Testing VNC Connection..."
if command -v vncviewer > /dev/null; then
    echo "VNC viewer available, testing connection..."
    timeout 5 vncviewer -passwd /root/.vnc/passwd localhost:5900 2>&1 | head -5
else
    echo "VNC viewer not available, skipping connection test"
fi

# Check noVNC files
echo "📁 Checking noVNC Installation..."
if [ -d "/usr/share/novnc" ]; then
    echo "✅ noVNC directory exists"
    echo "📄 noVNC files:"
    ls -la /usr/share/novnc/ | head -10
    
    if [ -f "/usr/share/novnc/app/custom.js" ]; then
        echo "✅ Custom JavaScript file exists"
        echo "📝 Custom JS file size: $(wc -l < /usr/share/novnc/app/custom.js) lines"
    else
        echo "❌ Custom JavaScript file missing"
    fi
else
    echo "❌ noVNC directory not found"
fi

# Check display environment
echo "🖼️ Display Environment:"
echo "DISPLAY: $DISPLAY"
echo "X11 socket: $(ls -la /tmp/.X11-unix/ 2>/dev/null || echo "Not found")"

# Test X11 connection
echo "🔗 Testing X11 Connection..."
if command -v xdpyinfo > /dev/null; then
    xdpyinfo -display :1 2>&1 | head -5
else
    echo "xdpyinfo not available"
fi

echo "=============================="
echo "�� VNC Test Complete" 