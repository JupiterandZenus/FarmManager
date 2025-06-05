@echo off
title FarmBoy v0.2 - Force Start

echo.
echo ⚔️ FarmBoy v0.2 - Force Process Cleanup & Start ⚔️
echo ===============================================
echo.

echo 🧹 Force killing all Node.js processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im nodejs.exe >nul 2>&1

echo 🔄 Waiting for processes to terminate...
timeout /t 3 /nobreak >nul

echo 📱 Killing any processes using ports 3004-3007...
for /l %%x in (3004, 1, 3007) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%%x') do (
        echo Killing process %%a on port %%x
        taskkill /f /pid %%a >nul 2>&1
    )
)

echo ⏱️ Final wait...
timeout /t 2 /nobreak >nul

echo.
echo 🚀 Starting FarmBoy v0.2 server on port 3007...
echo 📱 URL: http://localhost:3007
echo.

node test-simple-server.js

echo.
echo 🛑 Server stopped. Press any key to exit...
pause >nul 