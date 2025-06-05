@echo off
echo 🚀 Building and pushing Farm Manager Docker image...
echo ===================================================

REM Set image details
set IMAGE_NAME=supscotty/farmboy
set TAG=latest

echo 🔧 Building Docker image %IMAGE_NAME%:%TAG%...
docker build -t %IMAGE_NAME%:%TAG% .

IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker build failed! Please check the error messages above.
    exit /b %ERRORLEVEL%
)

echo ✅ Docker image built successfully

echo 🔄 Pushing image to Docker Hub...
docker push %IMAGE_NAME%:%TAG%

IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker push failed! Make sure you're logged in to Docker Hub:
    echo    docker login
    exit /b %ERRORLEVEL%
)

echo ✅ Image pushed successfully to Docker Hub

echo 🚀 Ready for deployment with docker-compose!
echo    docker-compose up -d