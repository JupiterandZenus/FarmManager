@echo off
echo Starting Farm Manager Local Development Environment...
echo.

REM Check if Docker Desktop is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Desktop is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Docker Desktop is running...
echo.

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

REM Stop any existing containers
echo Stopping any existing containers...
docker-compose -f docker-compose.local.yml down

REM Pull latest images
echo Pulling latest images...
docker-compose -f docker-compose.local.yml pull

REM Build and start the services
echo Building and starting services...
docker-compose -f docker-compose.local.yml up --build -d

REM Wait a moment for services to start
echo.
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Show container status
echo.
echo Container Status:
docker-compose -f docker-compose.local.yml ps

echo.
echo ===============================================
echo Farm Manager Local Testing Environment Started!
echo ===============================================
echo.
echo Access URLs:
echo   Web Interface: http://localhost:3334
echo   noVNC (Browser): http://localhost:8081
echo   VNC Direct: localhost:5901
echo   Database: localhost:3307
echo.
echo Commands:
echo   View logs: docker-compose -f docker-compose.local.yml logs -f
echo   Stop: docker-compose -f docker-compose.local.yml down
echo   Restart: docker-compose -f docker-compose.local.yml restart
echo.
pause 