@echo off
echo ==========================================
echo Force Restart Farm Manager (Test Server)
echo ==========================================
echo.
echo Stopping all Node.js processes...
taskkill /f /im node.exe >nul 2>&1
echo.
echo Waiting 5 seconds...
timeout /t 5 /nobreak >nul
echo.
echo Starting Test Server (with Discord integration)...
echo This server works WITHOUT database!
echo.
cd /d "C:\Users\SupScotty\Downloads\farm-admin-enablevnc"
node test-server-local.js 