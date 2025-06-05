@echo off
echo ===================================
echo Farm Manager Database Refresh Tool
echo ===================================
echo.
echo This script will refresh your database by:
echo 1. Resetting all data
echo 2. Applying migrations
echo 3. Seeding with fresh data
echo.
echo WARNING: All existing data will be lost!
echo.
set /p confirm=Are you sure you want to continue? (y/n): 

if /i "%confirm%" neq "y" (
    echo.
    echo Database refresh cancelled.
    goto :end
)

echo.
echo Starting database refresh process...
echo.

call npm run db:refresh

echo.
if %ERRORLEVEL% EQU 0 (
    echo Database refresh completed successfully!
    echo.
    echo Please restart your Farm Manager application to use the refreshed database.
) else (
    echo Database refresh encountered errors. Please check the output above.
)

:end
echo.
pause 