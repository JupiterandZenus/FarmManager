@echo off
title FarmBoy v0.2 - Server Startup

echo.
echo ⚔️ FarmBoy v0.2 - EternalFarm Command Center ⚔️
echo =============================================
echo.

REM Kill any existing node processes
echo 🧹 Cleaning up any existing processes...
taskkill /f /im node.exe >nul 2>&1

REM Wait a moment
timeout /t 2 /nobreak >nul

echo 🚀 Starting FarmBoy v0.2 server...
echo.

REM Start the simple server
node test-simple-server.js

pause 