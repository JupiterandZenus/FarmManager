@echo off
echo ===================================
echo Farm Manager Build and Git Push Tool
echo ===================================
echo.

set GIT_BRANCH=Farmboy
set COMMIT_MESSAGE=Database refresh functionality implementation
set DOCKER_TAG=supscotty/farmboy:latest

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Git is not installed or not in your PATH.
    echo Please install Git from https://git-scm.com/
    goto :docker_build
)

echo Starting Git operations...

REM Check if we're in a git repository
if not exist .git (
    echo Initializing Git repository...
    git init
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to initialize Git repository.
        goto :docker_build
    )
)

REM Add all files
echo Adding files to Git...
git add .
if %ERRORLEVEL% NEQ 0 (
    echo Failed to add files to Git.
    goto :docker_build
)

REM Commit changes
echo Committing changes with message: "%COMMIT_MESSAGE%"
git commit -m "%COMMIT_MESSAGE%"
if %ERRORLEVEL% NEQ 0 (
    echo Failed to commit changes.
    goto :docker_build
)

REM Check if branch exists
git show-ref --verify --quiet refs/heads/%GIT_BRANCH%
if %ERRORLEVEL% NEQ 0 (
    echo Creating new branch: %GIT_BRANCH%...
    git checkout -b %GIT_BRANCH%
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to create branch.
        goto :docker_build
    )
) else (
    echo Switching to branch: %GIT_BRANCH%...
    git checkout %GIT_BRANCH%
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to switch branch.
        goto :docker_build
    )
)

REM Check if remote exists
git remote -v | findstr origin >nul
if %ERRORLEVEL% NEQ 0 (
    echo No remote 'origin' found. Please set it up manually with:
    echo git remote add origin your-repository-url
    echo Then push with: git push -u origin %GIT_BRANCH%
) else (
    echo Pushing to remote...
    git push -u origin %GIT_BRANCH%
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to push to remote.
        echo You may need to provide credentials or resolve conflicts.
    ) else (
        echo Git push completed successfully!
    )
)

:docker_build
echo.
echo ===================================
echo Starting Docker build process
echo ===================================

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Docker is not installed or not in your PATH.
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    goto :end
)

echo Building Docker image: %DOCKER_TAG%
docker build -t %DOCKER_TAG% .
if %ERRORLEVEL% NEQ 0 (
    echo Failed to build Docker image.
    goto :end
)

echo.
echo Docker build successful!

echo.
set /p push_image=Do you want to push the image to Docker Hub? (y/n): 
if /i "%push_image%"=="y" (
    echo Pushing image to Docker Hub...
    docker push %DOCKER_TAG%
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to push Docker image.
        echo You may need to login to Docker Hub first with: docker login
    ) else (
        echo Docker image pushed successfully!
    )
)

:end
echo.
echo Process completed.
pause 