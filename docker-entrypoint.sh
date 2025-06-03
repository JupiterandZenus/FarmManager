#!/bin/bash
set -e

echo "🚀 Starting Farm Admin Application..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until npx prisma db push --accept-data-loss 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 5
done

echo "✅ Database connection established"

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma db push --accept-data-loss

# Generate Prisma client (in case it's not already generated)
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🎉 Database setup complete!"

# Execute the main command
echo "🚀 Starting server..."
exec "$@" 