#!/bin/bash

echo "🚀 Database Initialization Script"
echo "================================"
echo ""

# Database configuration
DB_HOST="mariadb"
DB_USER="farmboy"
DB_PASSWORD="Sntioi004!"
DB_NAME="farmboy_db"

echo "📊 Checking database connectivity..."

# Wait for database to be ready
for i in {1..30}; do
    if docker exec farm-admin-mariadb-fresh mysqladmin ping -h localhost -u "$DB_USER" -p"$DB_PASSWORD" --silent 2>/dev/null; then
        echo "✅ Database is responding"
        break
    fi
    echo "   Attempt $i/30 - Waiting for database..."
    sleep 2
    if [ $i -eq 30 ]; then
        echo "❌ Database is not responding after 60 seconds"
        exit 1
    fi
done

echo ""
echo "🔧 Creating Agent table..."

# Execute database setup
docker exec farm-admin-mariadb-fresh /usr/bin/mariadb -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" << EOF
-- Create Agent table if it doesn't exist
CREATE TABLE IF NOT EXISTS Agent (
    id VARCHAR(255) PRIMARY KEY,
    eternal_farm_id VARCHAR(255) NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'offline',
    ip_address VARCHAR(45) NULL,
    last_seen TIMESTAMP NULL,
    cpu_usage FLOAT NULL,
    memory_usage FLOAT NULL,
    disk_usage FLOAT NULL,
    auth_key VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    needs_sync BOOLEAN DEFAULT FALSE,
    last_synced TIMESTAMP NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_eternal_farm_id ON Agent(eternal_farm_id);
CREATE INDEX IF NOT EXISTS idx_agent_needs_sync ON Agent(needs_sync);
CREATE INDEX IF NOT EXISTS idx_agent_last_synced ON Agent(last_synced);
CREATE INDEX IF NOT EXISTS idx_agent_status ON Agent(status);
CREATE INDEX IF NOT EXISTS idx_agent_last_seen ON Agent(last_seen);

-- Show that setup is complete
SELECT 'Database setup complete' as status;
SHOW TABLES;
DESCRIBE Agent;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Agent table created successfully!"
    echo ""
    echo "🔄 Restarting farm-admin container..."
    
    # Restart the farm-admin container
    docker-compose restart farm-admin-hybrid
    
    echo "✅ Container restarted. Check the logs with:"
    echo "   docker-compose logs -f farm-admin-hybrid"
else
    echo "❌ Failed to create Agent table"
    echo ""
    echo "💡 Try checking the database logs:"
    echo "   docker-compose logs mariadb"
fi

echo ""
echo "Script completed." 