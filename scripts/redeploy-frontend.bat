@echo off
echo ========================================
echo LOUD BRANDS - Frontend Redeployment
echo ========================================

echo.
echo 1. Building frontend...
cd frontend
call npm run build

if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo ✅ Build completed successfully!

echo.
echo 2. Deploying to Vercel...
call vercel --prod

if %ERRORLEVEL% neq 0 (
    echo ❌ Deployment failed!
    pause
    exit /b 1
)

echo ✅ Deployment completed successfully!

echo.
echo ========================================
echo DEPLOYMENT SUMMARY
echo ========================================
echo ✅ Static assets added (images, videos, logos)
echo ✅ API configuration fixed
echo ✅ Image optimization disabled for Vercel
echo ✅ Caching headers configured
echo ✅ PWA manifest created
echo.
echo Your frontend should now be working properly!
echo.
pause
