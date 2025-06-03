#!/bin/bash

# Make script executable
chmod +x /app/fix-permissions.sh

# Set permissions for desktop and DreamBot directories
chmod -R 755 /root/Desktop
chmod -R 755 /root/DreamBot
chmod -R 755 /root/.config

# Set ownership
chown -R root:root /root/Desktop
chown -R root:root /root/DreamBot
chown -R root:root /root/.config

# Specific permissions for EternalFarm files
chmod 644 /root/Desktop/EternalFarmChecker.jar
chmod 644 /root/Desktop/EternalFarmAgent.jar
chmod 644 /root/Desktop/EternalFarmBrowserAutomator.jar

# Make scripts executable
chmod +x /root/Desktop/*.sh
chmod +x /root/DreamBot/*.sh

# Set specific permissions for config directories
chmod 755 /root/.config/EternalFarm
chmod 644 /root/.config/EternalFarm/*

echo "✅ Permissions have been set successfully!" 