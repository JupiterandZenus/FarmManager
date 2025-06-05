#!/bin/bash

echo "==================================="
echo "Farm Manager Database Refresh Tool"
echo "==================================="
echo ""
echo "This script will refresh your database by:"
echo "1. Resetting all data"
echo "2. Applying migrations"
echo "3. Seeding with fresh data"
echo ""
echo "WARNING: All existing data will be lost!"
echo ""
read -p "Are you sure you want to continue? (y/n): " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo ""
    echo "Database refresh cancelled."
    exit 0
fi

echo ""
echo "Starting database refresh process..."
echo ""

# Make sure the refresh script is executable
chmod +x refresh-database.js

# Run the refresh script
npm run db:refresh

if [ $? -eq 0 ]; then
    echo ""
    echo "Database refresh completed successfully!"
    echo ""
    echo "Please restart your Farm Manager application to use the refreshed database."
else
    echo ""
    echo "Database refresh encountered errors. Please check the output above."
fi

echo ""
read -p "Press Enter to exit..." 