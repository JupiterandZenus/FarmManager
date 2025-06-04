@echo off
echo 🧹 Farm Manager v0.2 - Cache Clear & Launch
echo ========================================

REM Get the port from environment or use default
set PORT=3005
if defined PORT (
    echo 🌐 Using port: %PORT%
) else (
    set PORT=3004
    echo 🌐 Using default port: %PORT%
)

set URL=http://localhost:%PORT%

echo.
echo 📋 Instructions to see the new FarmBoy v0.2:
echo    1. Close all browser windows
echo    2. Press any key to open the new interface
echo    3. Press Ctrl+F5 to force refresh if needed
echo    4. Or use Ctrl+Shift+R to hard refresh
echo.
echo 🔧 If you still see the old interface:
echo    - Press F12 to open Developer Tools
echo    - Right-click the refresh button and select "Empty Cache and Hard Reload"
echo.

pause

echo 🚀 Opening FarmBoy v0.2 at %URL%...
start "" "%URL%"

echo.
echo ✅ FarmBoy v0.2 should now be open in your browser!
echo 📋 New features:
echo    • Modern navigation with Overview, Agents, Discord, Proxies, Config sections
echo    • Live dashboard with status cards and metrics
echo    • Integrated Discord management
echo    • Quick action buttons
echo    • Responsive design for mobile/tablet
echo.
echo 💡 Tip: Use the navigation tabs at the top to switch between sections
echo.
pause 