#!/bin/bash

echo "🔍 VNC Connection Diagnostics"
echo "============================"

echo "📡 Checking VNC Server Status:"
if netstat -ln | grep :5900; then
    echo "✅ VNC server is listening on port 5900"
else
    echo "❌ VNC server not listening on port 5900"
fi

echo ""
echo "🌐 Checking noVNC Status:"
if netstat -ln | grep :8080; then
    echo "✅ noVNC server is listening on port 8080"
else
    echo "❌ noVNC server not listening on port 8080"
fi

echo ""
echo "🖥️ Checking Display Status:"
export DISPLAY=:1
if xdpyinfo >/dev/null 2>&1; then
    echo "✅ X display :1 is active"
    echo "Screen info:"
    xdpyinfo | grep dimensions
else
    echo "❌ X display :1 is not accessible"
fi

echo ""
echo "📊 Process Status:"
echo "VNC processes:"
ps aux | grep vnc | grep -v grep

echo ""
echo "noVNC/websockify processes:"
ps aux | grep websockify | grep -v grep

echo ""
echo "📝 Recent VNC Logs:"
echo "x11vnc logs (last 5 lines):"
tail -5 /var/log/x11vnc.log 2>/dev/null || echo "No x11vnc log found"

echo ""
echo "x11vnc error logs (last 5 lines):"
tail -5 /var/log/x11vnc.err 2>/dev/null || echo "No x11vnc error log found"

echo ""
echo "noVNC logs (last 5 lines):"
tail -5 /var/log/novnc.log 2>/dev/null || echo "No noVNC log found"

echo ""
echo "noVNC error logs (last 5 lines):"
tail -5 /var/log/novnc.err 2>/dev/null || echo "No noVNC error log found"

echo ""
echo "🧪 Testing Local VNC Connection:"
if command -v vncviewer >/dev/null 2>&1; then
    echo "Testing local VNC connection..."
    timeout 5 vncviewer localhost:5900 -SecurityTypes None -passwd /dev/null >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Local VNC connection successful"
    else
        echo "❌ Local VNC connection failed"
    fi
else
    echo "vncviewer not available for testing"
fi

echo ""
echo "🔧 Suggested Actions:"
echo "1. Try: http://your-server-ip:8080 for noVNC"
echo "2. Try: your-server-ip:5900 with VNC client"
echo "3. Check firewall settings on server"
echo "4. Verify network connectivity to server" 