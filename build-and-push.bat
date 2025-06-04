@echo off
echo ====================================================
echo Farm Manager - Complete Pipeline Deployment Script
echo ====================================================
echo.

REM Configuration Variables
set GIT_BRANCH=Farmboy
set DOCKER_TAG=supscotty/farmboy:latest
set COMMIT_MESSAGE=🚀 Production Pipeline Update: Database + Environment + Deployment

REM Environment Setup Check
echo Checking environment setup...
where git >nul 2>nul && (
    echo ✓ Git installed
) || (
    echo ✗ Git not found - Please install from https://git-scm.com/
    goto :environment_error
)

where docker >nul 2>nul && (
    echo ✓ Docker installed
) || (
    echo ✗ Docker not found - Please install Docker Desktop
    goto :environment_error
)

REM Database Schema Validation
echo.
echo Running database schema validation...
call fix-database-schema.bat
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Database schema validation failed
    goto :error
)
echo ✓ Database schema validated

REM Run Tests
echo.
echo Running validation tests...
call run-full-test.bat
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Validation tests failed
    goto :error
)
echo ✓ All tests passed

REM Git Operations
echo.
echo Starting Git operations...

REM Initialize git if needed
if not exist .git (
    git init
    echo ✓ Git repository initialized
)

REM Configure git
git config --global user.name "SupScotty"
git config --global user.email "supscotty@example.com"

REM Create detailed commit message
set DETAILED_COMMIT_MESSAGE=%COMMIT_MESSAGE%

✅ Updates Include:
- Database: Authentication and schema fixes
- Environment: Production-ready configuration
- Tests: All validation tests passing
- Docker: Updated container configuration
- Documentation: Updated deployment guides

REM Add and commit
git add .
git commit -m "%DETAILED_COMMIT_MESSAGE%"
echo ✓ Changes committed

REM Branch management
git checkout -b %GIT_BRANCH% 2>nul || git checkout %GIT_BRANCH%
echo ✓ On branch %GIT_BRANCH%

REM Docker Build
echo.
echo Building Docker image...
docker build -t %DOCKER_TAG% .
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Docker build failed
    goto :error
)
echo ✓ Docker image built successfully

REM Push to Docker Hub
echo.
set /p PUSH_DOCKER=Push to Docker Hub? (y/n): 
if /i "%PUSH_DOCKER%"=="y" (
    docker login
    docker push %DOCKER_TAG%
    echo ✓ Docker image pushed
)

REM Push to Git
echo.
set /p PUSH_GIT=Push to Git? (y/n): 
if /i "%PUSH_GIT%"=="y" (
    git push -u origin %GIT_BRANCH%
    echo ✓ Git changes pushed
)

REM Deployment Check
echo.
echo Running final deployment checks...
call quick-status-check.js
if %ERRORLEVEL% NEQ 0 (
    echo ⚠ Deployment check warnings - Review logs
) else (
    echo ✓ Deployment checks passed
)

echo.
echo ====================================================
echo Pipeline Execution Complete
echo ====================================================
echo ✓ Database validated
echo ✓ Tests passed
echo ✓ Code committed
echo ✓ Docker image built
if /i "%PUSH_DOCKER%"=="y" echo ✓ Docker image pushed
if /i "%PUSH_GIT%"=="y" echo ✓ Git changes pushed
echo.
goto :end

:environment_error
echo.
echo ❌ Environment setup incomplete - Please install required tools
goto :end

:error
echo.
echo ❌ Pipeline failed - Check the logs above for details
goto :end

:end
pause