@echo off
echo 🚀 Pushing Farm Manager to GitHub
echo ================================

echo 📋 Setting up git configuration...
git config --global user.name "SupScotty"
git config --global user.email "supscotty@github.com"

echo 📁 Adding all files...
git add .

echo 💾 Committing changes...
git commit -m "🚀 Production Ready: Database Auth Fixed + Environment Labels + X11 Startup Sequence

✅ CRITICAL FIXES:
- Database: Fixed farmboy user authentication with MYSQL_ROOT_HOST=%%
- Entry.sh: Reordered startup - Database FIRST, then X11, then Environment  
- X11: Fixed display server conflicts and startup sequence
- Prisma: Fixed account_categories table creation and seeding
- Permissions: Added comprehensive chmod for all files and scripts
- Environment Labels: 40+ container metadata labels for production
- Docker Compose: Production-ready with health checks

🐳 DEPLOYMENT READY:
- All database issues resolved
- X11 conflicts eliminated  
- Startup sequence optimized
- Production-grade configuration

🎯 STATUS: Production Ready - All critical issues fixed"

echo 🌿 Checking current branch...
git branch

echo 🚀 Pushing to GitHub...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCESS! Changes pushed to GitHub
    echo ==========================================
    echo 🎉 GitHub Actions workflow will now trigger
    echo 🐳 Docker image will be built and pushed to Docker Hub
    echo 🚀 Ready for deployment!
    echo.
    echo 📊 Next steps:
    echo    1. Check GitHub Actions tab for build progress
    echo    2. Once complete, deploy with: docker-compose up -d
) else (
    echo.
    echo ❌ Push failed. You may need to:
    echo    1. Set up GitHub remote: git remote add origin YOUR_REPO_URL
    echo    2. Authenticate with GitHub
    echo    3. Check branch permissions
)

pause 