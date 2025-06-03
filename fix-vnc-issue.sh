#!/bin/bash

echo "🔧 VNC Issue Fix Script"
echo "======================="

echo "🛑 Stopping VNC services..."
supervisorctl stop x11vnc
supervisorctl stop novnc

echo "⏳ Waiting 3 seconds..."
sleep 3

echo "🧹 Cleaning up old processes..."
pkill -f x11vnc
pkill -f websockify

echo "🔍 Checking if display is available..."
export DISPLAY=:1
if ! xdpyinfo >/dev/null 2>&1; then
    echo "⚠️ Display :1 not available, restarting Xvfb..."
    supervisorctl restart xvfb
    sleep 3
fi

echo "🚀 Restarting VNC services..."
supervisorctl start x11vnc
sleep 5
supervisorctl start novnc

echo "⏳ Waiting for services to stabilize..."
sleep 5

echo "📊 Checking service status..."
supervisorctl status x11vnc novnc

echo "🔍 Testing port connectivity..."
if netstat -ln | grep :5900; then
    echo "✅ VNC port 5900 is active"
else
    echo "❌ VNC port 5900 is not active"
fi

if netstat -ln | grep :8080; then
    echo "✅ noVNC port 8080 is active"
else
    echo "❌ noVNC port 8080 is not active"
fi

echo ""
echo "🎯 Try connecting again:"
echo "- noVNC: http://your-server:8080"
echo "- VNC Client: your-server:5900" 