@echo off
echo.
echo ===================================
echo  Farm Manager Database Schema Fix
echo ===================================
echo.
echo This script will fix the missing account_categories table
echo in your database that's causing the seeding error.
echo.
echo Press any key to continue or CTRL+C to cancel...
pause > nul

powershell -ExecutionPolicy Bypass -File fix-database-schema.ps1

echo.
echo Script completed.
echo.
pause 