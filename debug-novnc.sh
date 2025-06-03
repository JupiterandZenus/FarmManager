#!/bin/bash

echo "🔍 noVNC Debug Information"
echo "========================="

echo "📁 Checking noVNC installation:"
if [ -d "/usr/share/novnc" ]; then
    echo "✅ /usr/share/novnc directory exists"
    ls -la /usr/share/novnc/ | head -10
else
    echo "❌ /usr/share/novnc directory not found"
fi

echo ""
echo "🐍 Checking Python and websockify:"
echo "Python version: $(python3 --version 2>/dev/null || echo 'Python3 not found')"

echo "Checking websockify module:"
python3 -c "import websockify; print('✅ websockify module available')" 2>/dev/null || echo "❌ websockify module not available"

echo "Checking websockify command:"
which websockify 2>/dev/null && echo "✅ websockify command found" || echo "❌ websockify command not found"

echo ""
echo "📂 Checking websockify paths:"
[ -f "/usr/share/novnc/utils/websockify/websockify.py" ] && echo "✅ websockify.py found in utils" || echo "❌ websockify.py not in utils"
[ -f "/usr/share/novnc/utils/launch.sh" ] && echo "✅ launch.sh found" || echo "❌ launch.sh not found"

echo ""
echo "🌐 Checking VNC connection:"
if netstat -ln | grep :5900 > /dev/null; then
    echo "✅ VNC server listening on port 5900"
else
    echo "❌ VNC server not listening on port 5900"
fi

echo ""
echo "📝 Recent noVNC logs:"
if [ -f "/var/log/novnc.err" ]; then
    echo "Error log:"
    tail -5 /var/log/novnc.err
else
    echo "No error log found"
fi

if [ -f "/var/log/novnc.log" ]; then
    echo "Output log:"
    tail -5 /var/log/novnc.log
else
    echo "No output log found"
fi

echo ""
echo "🧪 Testing manual websockify:"
echo "Try running: cd /usr/share/novnc && python3 -m websockify --web . 8080 localhost:5900" 