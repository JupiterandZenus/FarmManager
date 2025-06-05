#!/bin/bash

# Fix permissions script for Farm Manager
echo "🔧 Fixing permissions..."

# Set ownership and permissions for key directories
chmod -R 755 /app
chmod -R 755 /root/DreamBot
chmod -R 755 /appdata

# Make sure Entry.sh is executable
chmod +x /app/Entry.sh
chmod +x /root/Entry.sh
chmod +x /root/cpu_manager.sh

echo "✅ Permissions fixed successfully"
exit 0 