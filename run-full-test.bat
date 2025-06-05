@echo off
echo 🎯 FarmBoy v0.2 - Complete System Test
echo ===================================
echo.

echo 📋 Step 1: Checking Node.js...
node --version
if errorlevel 1 (
    echo ❌ Node.js not found!
    pause
    exit /b 1
)

echo.
echo 📋 Step 2: Checking files...
if not exist test-simple-server.js (
    echo ❌ test-simple-server.js not found!
    pause
    exit /b 1
)

echo ✅ All required files found.

echo.
echo 📋 Step 3: Killing any existing Node processes...
taskkill /f /im node.exe >nul 2>&1
echo ✅ Cleanup complete.

echo.
echo 📋 Step 4: Starting FarmBoy v0.2 Test Server...
echo 🚀 Starting server...
start /min "FarmBoy-Server" node test-simple-server.js

echo ⏳ Waiting 5 seconds for server to start...
timeout /t 5 /nobreak >nul

echo.
echo 📋 Step 5: Testing server health...
curl -s http://localhost:3007/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Server health check failed
) else (
    echo ✅ Server is responding
)

echo.
echo 📋 Step 6: Testing Tasks API...
curl -s http://localhost:3007/api/v1/tasks >nul 2>&1
if errorlevel 1 (
    echo ❌ Tasks API test failed
) else (
    echo ✅ Tasks API is working
)

echo.
echo 🎯 Manual Testing Required:
echo ===========================
echo 1. Open: http://localhost:3007
echo 2. Check all navigation tabs work
echo 3. Try Discord quick actions
echo 4. Verify no 404 errors
echo.
echo 📋 Server is running in background window
echo 🛑 Close the server window when done testing
echo.
pause 