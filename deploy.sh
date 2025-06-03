#!/bin/bash

# Farm Admin Docker Deployment Script
# This script builds and deploys the Farm Admin application using Docker

set -e

echo "🚀 Farm Admin Deployment Script"
echo "=============================="

# Configuration
APP_NAME="farm-admin"
IMAGE_NAME="farm-admin-app"
VERSION="latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    log_success "Docker and Docker Compose are available"
}

# Stop existing containers
stop_containers() {
    log_info "Stopping existing containers..."
    if docker-compose ps -q | grep -q .; then
        docker-compose down
        log_success "Containers stopped"
    else
        log_info "No running containers found"
    fi
}

# Build Docker image
build_image() {
    log_info "Building Docker image: ${IMAGE_NAME}:${VERSION}"
    docker build -t ${IMAGE_NAME}:${VERSION} .
    log_success "Docker image built successfully"
}

# Start containers
start_containers() {
    log_info "Starting containers with Docker Compose..."
    docker-compose up -d
    log_success "Containers started"
}

# Check container health
check_health() {
    log_info "Checking container health..."
    sleep 10
    
    if docker-compose ps | grep -q "Up"; then
        log_success "Containers are running"
        
        # Check if application is responding
        if curl -f http://localhost:3333/ &> /dev/null; then
            log_success "Application is responding on port 3333"
        else
            log_warning "Application may not be ready yet. Check logs with: docker-compose logs -f farm-admin-app"
        fi
    else
        log_error "Some containers failed to start"
        docker-compose ps
        exit 1
    fi
}

# Show logs
show_logs() {
    log_info "Recent application logs:"
    docker-compose logs --tail=20 farm-admin-app
}

# Main deployment process
main() {
    echo
    log_info "Starting deployment process..."
    
    check_docker
    stop_containers
    build_image
    start_containers
    check_health
    show_logs
    
    echo
    log_success "Deployment completed successfully!"
    echo
    echo "🌐 Access your application at: http://localhost:3333"
    echo "📊 View logs with: docker-compose logs -f farm-admin-app"
    echo "🛑 Stop containers with: docker-compose down"
    echo
}

# Handle script arguments
case "${1:-}" in
    "build")
        log_info "Building Docker image only..."
        check_docker
        build_image
        ;;
    "start")
        log_info "Starting containers only..."
        check_docker
        start_containers
        check_health
        ;;
    "stop")
        log_info "Stopping containers..."
        check_docker
        stop_containers
        ;;
    "logs")
        log_info "Showing application logs..."
        docker-compose logs -f farm-admin-app
        ;;
    "status")
        log_info "Container status:"
        docker-compose ps
        ;;
    "restart")
        log_info "Restarting containers..."
        check_docker
        stop_containers
        start_containers
        check_health
        ;;
    "clean")
        log_info "Cleaning up containers and images..."
        check_docker
        docker-compose down -v
        docker rmi ${IMAGE_NAME}:${VERSION} 2>/dev/null || true
        log_success "Cleanup completed"
        ;;
    "help"|"-h"|"--help")
        echo "Farm Admin Deployment Script"
        echo
        echo "Usage: $0 [command]"
        echo
        echo "Commands:"
        echo "  (no args)  Full deployment (build + start)"
        echo "  build      Build Docker image only"
        echo "  start      Start containers only"
        echo "  stop       Stop containers"
        echo "  restart    Restart containers"
        echo "  logs       Show application logs"
        echo "  status     Show container status"
        echo "  clean      Stop containers and remove images"
        echo "  help       Show this help message"
        echo
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac 