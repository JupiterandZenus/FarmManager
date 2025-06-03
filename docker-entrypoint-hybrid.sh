#!/bin/bash
set -e

echo "🚀 Starting Hybrid Farm Manager + DreamBot Container..."

# Set environment variables for Entry.sh
export HOSTNAME=$(hostname)
export START_TIME=$(date +%s)
export EF_API_KEY="${ETERNALFARM_AGENT_KEY:-P52FE7-I2G19W-C2S4R8-BQZZFP-1FADWV-V3}"
export ETERNAL_FARM_KEY="${ETERNAL_FARM_KEY:-}"
export ETERNAL_AUTH_KEY="${ETERNAL_AUTH_KEY:-}"
export AUTH_AGENT_KEY="${AUTH_AGENT_KEY:-${ETERNALFARM_AGENT_KEY:-P52FE7-I2G19W-C2S4R8-BQZZFP-1FADWV-V3}}"

# VNC password setup DISABLED - using -nopw in supervisord.conf
# echo "🔐 Setting up VNC password..."
# mkdir -p /root/.vnc
# if [ -n "$VNC_PASSWORD" ]; then
#     echo "Using custom VNC password"
#     # Use x11vnc's built-in password method
#     echo "$VNC_PASSWORD" > /root/.vnc/passwd_plain
#     x11vnc -storepasswd "$VNC_PASSWORD" /root/.vnc/passwd
# else
#     echo "Using default VNC password: vncpass"
#     echo "vncpass" > /root/.vnc/passwd_plain
#     x11vnc -storepasswd "vncpass" /root/.vnc/passwd
# fi
# chmod 600 /root/.vnc/passwd
# chmod 600 /root/.vnc/passwd_plain

echo "✅ VNC configured for passwordless access"

# Create farmboy user for running the Farm Manager
if ! id "farmboy" &>/dev/null; then
    useradd -m -s /bin/bash farmboy
    echo "farmboy:farmboy" | chpasswd
fi

# Set up SSH
mkdir -p /var/run/sshd
echo "root:farmboy" | chpasswd
echo "PermitRootLogin yes" >> /etc/ssh/sshd_config
echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config

# Copy application files to /app
mkdir -p /app
cp -r /root/farm-manager/* /app/ 2>/dev/null || true
chown -R farmboy:farmboy /app

# Install Node.js dependencies if needed
if [ -f /app/package.json ]; then
    cd /app
    npm install --production
fi

# Wait for database to be ready (simple connection test)
echo "⏳ Waiting for database connection..."
until mysqladmin ping -h mariadb -u farmboy -pSntioi004! --silent; do
  echo "Database is unavailable - sleeping"
  sleep 5
done

echo "✅ Database connection established"

# Handle database schema - use proper migration approach
echo "🔄 Setting up database schema..."
cd /app

# First, ensure we have the latest schema
echo "📋 Checking Prisma schema..."
npx prisma format

# Reset and apply migrations properly
echo "🔄 Syncing database schema..."
if npx prisma db push --accept-data-loss --skip-generate; then
    echo "✅ Database schema synced successfully"
else
    echo "⚠️ Database push failed, trying migration reset..."
    npx prisma migrate reset --force --skip-generate || true
    npx prisma db push --accept-data-loss --skip-generate || true
fi

# Generate Prisma client (ensure it's up to date)
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🎉 Database setup complete!"

# Ensure proper ownership
chown -R farmboy:farmboy /app

# Kill any processes that might be using port 3000
echo "🔧 Checking for port conflicts..."
if lsof -ti:3000 2>/dev/null; then
    echo "⚠️ Port 3000 is in use, killing processes..."
    kill -9 $(lsof -ti:3000) 2>/dev/null || true
    sleep 2
fi

echo "🎯 Starting supervisord to manage all services..."

# Debug: Show which supervisord config we're using
echo "📋 Supervisord configuration check:"
echo "Config file: /etc/supervisord.conf"
echo "Config exists: $(test -f /etc/supervisord.conf && echo 'YES' || echo 'NO')"
echo "Programs defined:"
grep "^\[program:" /etc/supervisord.conf | head -10

# Set up basic directories (X11 auth will be handled by supervisord after Xvfb starts)
mkdir -p /tmp/.X11-unix /root/.vnc
chmod 1777 /tmp/.X11-unix
touch /root/.Xauthority

echo "🚀 Starting all services via supervisord..."

# Start supervisord (will start Xvfb first, then VNC, then desktop)
/usr/bin/supervisord -n -c /etc/supervisord.conf 