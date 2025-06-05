@echo off
echo 🚀 Starting Farm Manager Test Server...

REM Kill any existing Node.js processes first
taskkill /f /im node.exe 2>nul >nul

REM Wait a moment for processes to stop
timeout /t 2 /nobreak >nul

REM Set a unique port to avoid conflicts
set PORT=3005

echo 🌐 Starting server on port %PORT%...
echo 📱 Server will be available at: http://localhost:%PORT%
echo.
echo 🔧 Features:
echo    ✅ Discord Hooks Management
echo    ✅ Proxy Checker
echo    ✅ Mock Database
echo    ✅ WebSocket Support
echo.

REM Start the server
node test-server-local.js

pause 