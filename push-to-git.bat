@echo off
echo ===================================
echo Farm Manager Git Push Tool
echo ===================================
echo.

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Git is not installed or not in your PATH.
    echo Please install Git from https://git-scm.com/
    goto :end
)

REM Check if we're in a git repository
if not exist .git (
    echo Initializing Git repository...
    git init
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to initialize Git repository.
        goto :end
    )
)

REM Add all files
echo Adding files to Git...
git add .
if %ERRORLEVEL% NEQ 0 (
    echo Failed to add files to Git.
    goto :end
)

REM Commit changes
set /p commit_message=Enter commit message (default: "Database refresh functionality update"): 
if "%commit_message%"=="" set commit_message=Database refresh functionality update

echo Committing changes with message: "%commit_message%"
git commit -m "%commit_message%"
if %ERRORLEVEL% NEQ 0 (
    echo Failed to commit changes.
    goto :end
)

REM Check if remote exists
git remote -v | findstr origin >nul
if %ERRORLEVEL% NEQ 0 (
    set /p remote_url=Enter Git remote URL: 
    if "%remote_url%"=="" (
        echo No remote URL provided.
        goto :end
    )
    
    echo Adding remote origin...
    git remote add origin %remote_url%
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to add remote.
        goto :end
    )
)

REM Set branch name
set /p branch_name=Enter branch name (default: "Farmboy"): 
if "%branch_name%"=="" set branch_name=Farmboy

REM Check if branch exists
git show-ref --verify --quiet refs/heads/%branch_name%
if %ERRORLEVEL% NEQ 0 (
    echo Creating new branch: %branch_name%...
    git checkout -b %branch_name%
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to create branch.
        goto :end
    )
) else (
    echo Switching to branch: %branch_name%...
    git checkout %branch_name%
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to switch branch.
        goto :end
    )
)

REM Push to remote
echo Pushing to remote...
git push -u origin %branch_name%
if %ERRORLEVEL% NEQ 0 (
    echo Failed to push to remote.
    echo You may need to provide credentials or resolve conflicts.
    goto :end
)

echo.
echo ===================================
echo Changes successfully pushed to Git!
echo ===================================

:end
echo.
pause 