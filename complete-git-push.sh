#!/bin/bash

echo "🚀 Pushing Farm Manager changes to Git repository..."
echo "=================================================="

# Add all changes
git add .

# Commit with timestamp and descriptive message
git commit -m "Farm Manager Enhancement: Fix database auth, account_categories, X11 issues and add environment labels"

# Push to default branch
git push

echo "✅ Changes pushed to Git repository"
echo "Ready for image rebuild and deployment" 