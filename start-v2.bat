@echo off
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo Starting FarmBoy v0.2 server on port 3007...
echo Open browser to: http://localhost:3007
echo.
node test-simple-server.js 