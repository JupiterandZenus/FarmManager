#!/bin/bash

echo "🔧 Farm Admin Quick Fix"
echo "======================"

# Make scripts executable
chmod +x restart-services.sh
chmod +x health-check.sh

# Stop the current container
echo "🛑 Stopping current container..."
docker-compose down

# Start the container again
echo "🚀 Starting container with fixes..."
docker-compose up -d

# Wait for container to be ready
echo "⏳ Waiting for container to start..."
sleep 10

# Copy the restart script to the container and run it
echo "📋 Applying service fixes..."
docker cp restart-services.sh farm-admin-hybrid:/tmp/
docker cp health-check.sh farm-admin-hybrid:/tmp/
docker exec farm-admin-hybrid chmod +x /tmp/restart-services.sh
docker exec farm-admin-hybrid chmod +x /tmp/health-check.sh

# Run the restart script inside the container
echo "🔄 Restarting services..."
docker exec farm-admin-hybrid /tmp/restart-services.sh

# Run health check
echo "🏥 Running health check..."
docker exec farm-admin-hybrid /tmp/health-check.sh

echo ""
echo "✅ Quick fix complete!"
echo "🌐 You can now access:"
echo "   - noVNC: http://localhost:8080"
echo "   - Farm Manager: http://localhost:3333"
echo "   - VNC: localhost:5900" 