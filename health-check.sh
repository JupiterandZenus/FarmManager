#!/bin/bash

echo "🏥 Farm Admin Health Check"
echo "=========================="

# Check if supervisord is running
echo "📋 Supervisord Status:"
if pgrep supervisord > /dev/null; then
    echo "✅ Supervisord is running"
else
    echo "❌ Supervisord is not running"
    exit 1
fi

# Check individual services
echo ""
echo "🔍 Service Status:"
supervisorctl status

# Check ports
echo ""
echo "🌐 Port Status:"
echo "VNC (5900): $(netstat -ln | grep :5900 && echo '✅ Open' || echo '❌ Closed')"
echo "noVNC (8080): $(netstat -ln | grep :8080 && echo '✅ Open' || echo '❌ Closed')"
echo "Farm Manager (3333): $(netstat -ln | grep :3333 && echo '✅ Open' || echo '❌ Closed')"
echo "SSH (22): $(netstat -ln | grep :22 && echo '✅ Open' || echo '❌ Closed')"

# Check database connection
echo ""
echo "🗄️ Database Status:"
if node -e "
const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();
prisma.\$connect().then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
}).catch((err) => {
    console.log('❌ Database connection failed:', err.message);
    process.exit(1);
});
" 2>/dev/null; then
    echo "Database is accessible"
else
    echo "Database connection issues detected"
fi

# Check log files for errors
echo ""
echo "📝 Recent Errors in Logs:"
echo "noVNC errors:"
tail -n 3 /var/log/novnc.err 2>/dev/null || echo "No noVNC error log found"

echo "Farm Manager errors:"
tail -n 3 /var/log/farm-manager.err.log 2>/dev/null || echo "No Farm Manager error log found"

echo ""
echo "🎯 Health Check Complete!" 