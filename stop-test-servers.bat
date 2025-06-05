@echo off
echo Stopping any running Node.js processes...

REM Kill all Node.js processes
taskkill /f /im node.exe 2>nul
if %errorlevel%==0 (
    echo ✅ Node.js processes stopped
) else (
    echo ℹ️  No Node.js processes were running
)

REM Wait a moment
timeout /t 2 /nobreak >nul

echo ✅ Ready to start fresh test server
pause 