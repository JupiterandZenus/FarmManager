#!/bin/bash

echo "🔍 Farm Manager - MariaDB Troubleshooting Script"
echo "================================================"

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running or not accessible"
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to check stack status
check_stack() {
    echo ""
    echo "📊 Checking stack status..."
    
    # List all containers with farm-admin in the name
    containers=$(docker ps -a --filter "name=farm" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")
    
    if [ -z "$containers" ]; then
        echo "❌ No farm-admin containers found"
        echo "💡 Make sure you've deployed the stack in Portainer"
        return 1
    fi
    
    echo "$containers"
}

# Function to check MariaDB specifically
check_mariadb() {
    echo ""
    echo "🗄️ Checking MariaDB container..."
    
    mariadb_container=$(docker ps -a --filter "name=mariadb" --format "{{.Names}}" | head -1)
    
    if [ -z "$mariadb_container" ]; then
        echo "❌ MariaDB container not found"
        return 1
    fi
    
    echo "📋 Container: $mariadb_container"
    
    # Check container status
    status=$(docker inspect --format='{{.State.Status}}' "$mariadb_container")
    health=$(docker inspect --format='{{.State.Health.Status}}' "$mariadb_container" 2>/dev/null || echo "no-healthcheck")
    
    echo "📊 Status: $status"
    echo "🏥 Health: $health"
    
    # Show recent logs
    echo ""
    echo "📝 Recent MariaDB logs:"
    docker logs --tail 20 "$mariadb_container"
    
    # If unhealthy, try to diagnose
    if [ "$health" = "unhealthy" ]; then
        echo ""
        echo "🔧 Diagnosing unhealthy MariaDB..."
        
        # Try to connect manually
        echo "Testing database connection..."
        docker exec "$mariadb_container" mysqladmin ping -h localhost -u farmboy -pSntioi004! 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ Database connection successful"
            echo "💡 Health check might be using wrong command"
        else
            echo "❌ Database connection failed"
            echo "💡 Database might still be initializing"
        fi
    fi
}

# Function to provide solutions
provide_solutions() {
    echo ""
    echo "🛠️ Common Solutions:"
    echo "==================="
    echo ""
    echo "1. 🕐 Wait longer (MariaDB can take 2-3 minutes to fully initialize)"
    echo "   - Check logs every 30 seconds"
    echo "   - Look for 'ready for connections' message"
    echo ""
    echo "2. 🔄 Restart the stack:"
    echo "   - In Portainer: Go to Stacks → farm-manager → Stop → Start"
    echo "   - Or use: docker-compose -f docker-compose.portainer.yml restart"
    echo ""
    echo "3. 🗑️ Clean restart (if persistent issues):"
    echo "   - Stop the stack"
    echo "   - Remove volumes: docker volume rm farm-manager_mariadb_data"
    echo "   - Redeploy the stack"
    echo ""
    echo "4. 💾 Check available disk space:"
    echo "   - MariaDB needs space to initialize"
    echo "   - Run: df -h"
    echo ""
    echo "5. 🔍 Check resource usage:"
    echo "   - Run: docker stats"
    echo "   - Ensure sufficient RAM (minimum 512MB for MariaDB)"
}

# Function to test connection
test_connection() {
    echo ""
    echo "🔌 Testing application connection..."
    
    # Check if port 3333 is accessible
    if curl -f http://localhost:3333/health > /dev/null 2>&1; then
        echo "✅ Farm Manager is accessible at http://localhost:3333"
    else
        echo "❌ Farm Manager not accessible on port 3333"
        echo "💡 Check if the farm-admin container is running and healthy"
    fi
}

# Main execution
main() {
    check_docker
    check_stack
    check_mariadb
    test_connection
    provide_solutions
    
    echo ""
    echo "🎯 Quick Commands:"
    echo "=================="
    echo "View MariaDB logs: docker logs -f \$(docker ps --filter 'name=mariadb' --format '{{.Names}}' | head -1)"
    echo "View Farm Admin logs: docker logs -f \$(docker ps --filter 'name=farm-admin' --format '{{.Names}}' | head -1)"
    echo "Restart stack: docker-compose -f docker-compose.portainer.yml restart"
    echo "Check health: curl http://localhost:3333/health"
}

# Run the script
main 