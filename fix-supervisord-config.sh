#!/bin/bash
set -e

echo "🔧 Fix Supervisord Configuration Script"
echo "======================================"

# Copy the fixed supervisord.conf to the container
echo "📋 Copying fixed supervisord.conf to container..."
docker cp supervisord.conf farm-admin-hybrid:/app/supervisord.conf

# Make sure the config is readable
echo "🔐 Setting permissions on supervisord.conf..."
docker exec farm-admin-hybrid chmod 644 /app/supervisord.conf

# Create a symlink to make sure the CPU manager can be found at the expected location
echo "🔗 Creating symlink for cpu_manager.sh..."
docker exec farm-admin-hybrid bash -c "ln -sf /app/cpu_manager.sh /root/cpu_manager.sh 2>/dev/null || true"
docker exec farm-admin-hybrid chmod +x /app/cpu_manager.sh
docker exec farm-admin-hybrid chmod +x /root/cpu_manager.sh 2>/dev/null || true

# Restart supervisord
echo "🔄 Restarting supervisord service..."
docker exec farm-admin-hybrid bash -c "pkill supervisord || true"
docker exec farm-admin-hybrid bash -c "sleep 2 && supervisord -c /app/supervisord.conf"

echo "✅ Supervisord configuration fixed and service restarted!"
echo "📊 Check logs with: docker logs farm-admin-hybrid" 