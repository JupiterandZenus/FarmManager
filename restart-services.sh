#!/bin/bash

echo "🔄 Restarting failed services..."

# Restart supervisord to pick up config changes
echo "📋 Reloading supervisord configuration..."
supervisorctl reread
supervisorctl update

# Restart specific services that were failing
echo "🚀 Restarting noVNC service..."
supervisorctl restart novnc

echo "🚀 Restarting farm-manager service..."
supervisorctl restart farm-manager

# Check status
echo "📊 Current service status:"
supervisorctl status

echo "✅ Service restart complete!" 