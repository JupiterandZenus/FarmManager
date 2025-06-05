@echo off
echo ==========================================
echo Restarting Farm Manager
echo ==========================================
echo.
echo Step 1: Stopping all Node.js processes...
taskkill /f /im node.exe >nul 2>&1
echo ✅ Node.js processes stopped
echo.
echo Step 2: Waiting 3 seconds...
timeout /t 3 /nobreak >nul
echo.
echo Step 3: Starting test server on port 3002...
echo.
cd /d "C:\Users\SupScotty\Downloads\farm-admin-enablevnc"
echo 🚀 Starting Farm Manager Test Server...
echo.
node test-server-local.js 