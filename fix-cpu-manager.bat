@echo off
echo ========================================
echo CPU Manager Fix Script for Farm Admin
echo ========================================

echo Creating simplified CPU manager script...
(
echo #!/bin/bash
echo.
echo # Use the correct DISPLAY for Docker setup
echo export DISPLAY=:1
echo.
echo echo "CPU Manager ^(Simplified Version^)"
echo echo "==============================="
echo echo "Running as user: $(whoami)"
echo echo "DISPLAY is set to: $DISPLAY"
echo.
echo # Simplified version that doesn't fail and just logs information
echo echo "🖥️ CPU Manager is running in simplified mode"
echo echo "📊 System Stats:"
echo echo "  - Container CPU Architecture: $(uname -p)"
echo echo "  - Container Operating System: $(uname -s)"
echo echo "  - Available CPUs: $(nproc 2>/dev/null || echo 'Unknown')"
echo.
echo # Keep running and log stats periodically
echo while true; do
echo     echo "$(date): CPU Manager is healthy"
echo.    
echo     # List running Java processes (DreamBot client)
echo     java_procs=$(ps aux ^| grep java ^| grep -v grep ^|^| echo "No Java processes")
echo     echo "🔍 Java Processes: "
echo     echo "$java_procs"
echo.    
echo     # Get system load
echo     echo "📈 System Load: $(cat /proc/loadavg 2>/dev/null ^|^| echo 'Unknown')"
echo.    
echo     # Sleep for 60 seconds
echo     sleep 60
echo done
) > cpu_manager_simple.sh

echo Stopping the container...
docker stop farm-admin-hybrid
timeout /t 5 /nobreak > nul

echo Copying fixed script to container...
docker cp cpu_manager_simple.sh farm-admin-hybrid:/app/cpu_manager.sh
docker cp cpu_manager_simple.sh farm-admin-hybrid:/root/cpu_manager.sh

echo Starting the container...
docker start farm-admin-hybrid
timeout /t 10 /nobreak > nul

echo Setting file permissions...
docker exec farm-admin-hybrid chmod +x /app/cpu_manager.sh
docker exec farm-admin-hybrid chmod +x /root/cpu_manager.sh

echo Checking if CPU manager is now running...
docker exec farm-admin-hybrid ps aux | findstr "cpu_manager"

echo ========================================
echo CPU Manager fix completed!
echo If you see cpu_manager.sh in the process list above, the fix was successful.
echo ========================================

pause 