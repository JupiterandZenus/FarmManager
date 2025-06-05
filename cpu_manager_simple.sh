#!/bin/bash

# Use the correct DISPLAY for Docker setup
export DISPLAY=:1

echo "CPU Manager (Simplified Version)"
echo "==============================="
echo "Running as user: $(whoami)"
echo "DISPLAY is set to: $DISPLAY"

# Simplified version that doesn't fail and just logs information
echo "🖥️ CPU Manager is running in simplified mode"
echo "📊 System Stats:"
echo "  - Container CPU Architecture: $(uname -p)"
echo "  - Container Operating System: $(uname -s)"
echo "  - Available CPUs: $(nproc 2>/dev/null || echo 'Unknown')"

# Keep running and log stats periodically
while true; do
    echo "$(date): CPU Manager is healthy"
    
    # List running Java processes (DreamBot client)
    java_procs=$(ps aux | grep java | grep -v grep || echo "No Java processes")
    echo "🔍 Java Processes: "
    echo "$java_procs"
    
    # Get system load
    echo "📈 System Load: $(cat /proc/loadavg 2>/dev/null || echo 'Unknown')"
    
    # Sleep for 60 seconds
    sleep 60
done 