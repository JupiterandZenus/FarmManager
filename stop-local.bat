@echo off
echo Stopping Farm Manager Local Development Environment...
echo.

REM Stop and remove containers
docker-compose -f docker-compose.local.yml down

echo.
echo Containers stopped successfully!
echo.

REM Show any remaining containers
echo Remaining containers:
docker ps

echo.
echo To clean up volumes (WARNING: This will delete all data):
echo   docker-compose -f docker-compose.local.yml down -v
echo.
pause 