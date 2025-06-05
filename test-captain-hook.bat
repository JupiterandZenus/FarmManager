@echo off
echo ========================================
echo Testing Captain Hook Discord Webhook
echo ========================================
echo.
echo Webhook Name: Captain Hook
echo URL: https://discord.com/api/webhooks/1379651760661991475/...
echo.
cd /d "C:\Users\SupScotty\Downloads\farm-admin-enablevnc"
node test-new-webhook.js
echo.
echo ========================================
echo Test completed! Check your Discord channel.
echo ========================================
pause 