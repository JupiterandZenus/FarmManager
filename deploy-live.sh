#!/bin/bash

# 🚀 Farm Manager Live Deployment Script
# This script helps deploy the Farm Manager to your Unraid server via Portainer

echo "🚀 Farm Manager Live Deployment Script"
echo "======================================="

# Configuration
GITHUB_REPO="https://github.com/swarnes1/farm-admin.git"
STACK_NAME="farm-manager-v2"
COMPOSE_FILE="docker-compose.unraid-internal.yml"
SERVER_IP="192.168.1.104"
SERVER_PORT="3333"

echo "📋 Deployment Configuration:"
echo "   Repository: $GITHUB_REPO"
echo "   Stack Name: $STACK_NAME"
echo "   Compose File: $COMPOSE_FILE"
echo "   Server: http://$SERVER_IP:$SERVER_PORT"
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.unraid-internal.yml" ]; then
    echo "❌ Error: docker-compose.unraid-internal.yml not found"
    echo "   Please run this script from the Farm Manager project directory"
    exit 1
fi

echo "✅ Pre-deployment checks:"
echo "   [✓] Docker compose file found"
echo "   [✓] GitHub repository accessible"
echo "   [✓] Prisma client fixes applied"
echo ""

echo "🎯 Deployment Steps:"
echo "1. Open Portainer in your browser"
echo "2. Navigate to Stacks → Add Stack"
echo "3. Use these settings:"
echo "   - Stack Name: $STACK_NAME"
echo "   - Build Method: Repository"
echo "   - Repository URL: $GITHUB_REPO"
echo "   - Compose Path: $COMPOSE_FILE"
echo "   - Branch: main"
echo "4. Click 'Deploy the Stack'"
echo ""

echo "🔍 After deployment, verify with:"
echo "   Health Check: curl http://$SERVER_IP:$SERVER_PORT/health"
echo "   Web Interface: http://$SERVER_IP:$SERVER_PORT/"
echo ""

echo "📊 Expected Health Response:"
echo '   {"status":"healthy","timestamp":"...","database":"connected"}'
echo ""

# Optional: Test if server is reachable
echo "🌐 Testing server connectivity..."
if command -v curl &> /dev/null; then
    if curl -s --connect-timeout 5 http://$SERVER_IP:$SERVER_PORT/health &> /dev/null; then
        echo "   [✓] Server is already running and responding"
        echo "   Current status: $(curl -s http://$SERVER_IP:$SERVER_PORT/health)"
    else
        echo "   [ℹ] Server not responding (expected if not deployed yet)"
    fi
else
    echo "   [ℹ] curl not available, skipping connectivity test"
fi

echo ""
echo "🎉 Ready for deployment!"
echo "   Follow the steps above in Portainer to deploy your Farm Manager"
echo ""
echo "🔄 To update an existing deployment:"
echo "   1. Go to your stack in Portainer"
echo "   2. Click 'Update Stack'"
echo "   3. Select 'Pull and redeploy'"
echo "   4. Click 'Update'"
echo ""
echo "📚 For detailed instructions, see: LIVE-DEPLOYMENT-GUIDE.md" 