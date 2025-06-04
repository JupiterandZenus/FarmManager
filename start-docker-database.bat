@echo off
echo 🚀 Starting Docker Desktop and MariaDB Database...
echo.

echo 📋 Step 1: Starting Docker Desktop...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

echo ⏳ Waiting for Docker Desktop to start (30 seconds)...
timeout /t 30 /nobreak

echo 📋 Step 2: Starting MariaDB database container...
docker run -d --name farm-mariadb-quick -e MYSQL_ROOT_PASSWORD=Sntioi004! -e MYSQL_DATABASE=farmboy_db -e MYSQL_USER=farmboy -e MYSQL_PASSWORD=Sntioi004! -p 3307:3306 mariadb:latest

if %ERRORLEVEL% == 0 (
    echo ✅ MariaDB database started successfully!
    echo 🌐 Database available at: localhost:3307
    echo 📊 Database: farmboy_db
    echo 👤 User: farmboy
    echo 🔑 Password: Sntioi004!
    echo.
    echo ⏳ Waiting for database to be ready (30 seconds)...
    timeout /t 30 /nobreak
    echo.
    echo 🎯 Now you can start your Farm Manager server:
    echo    node server.js
) else (
    echo ❌ Failed to start MariaDB database
    echo 💡 Make sure Docker Desktop is running
    echo 💡 Try running: docker ps
)

pause 