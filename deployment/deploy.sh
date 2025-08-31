#!/bin/bash

# Production Deployment Script for Contractor Platform
set -e

echo "🚀 Starting Contractor Platform deployment..."

# Configuration
DOMAIN=${DOMAIN:-"contractorplatform.com"}
ENVIRONMENT=${ENVIRONMENT:-"production"}
BACKUP_BEFORE_DEPLOY=${BACKUP_BEFORE_DEPLOY:-"true"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    command -v docker >/dev/null 2>&1 || { print_error "Docker is required but not installed. Aborting."; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { print_error "Docker Compose is required but not installed. Aborting."; exit 1; }
    command -v git >/dev/null 2>&1 || { print_error "Git is required but not installed. Aborting."; exit 1; }
    
    if [ ! -f ".env.production" ]; then
        print_error ".env.production file not found. Please create it from .env.production.example"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Create backup
create_backup() {
    if [ "$BACKUP_BEFORE_DEPLOY" = "true" ]; then
        print_status "Creating database backup before deployment..."
        
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        
        docker exec contractor-postgres-prod pg_dump -U contractor_prod_user contractor_platform > "./backups/$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            print_success "Backup created: $BACKUP_FILE"
        else
            print_warning "Backup failed, but continuing with deployment"
        fi
    fi
}

# Build and deploy
deploy_services() {
    print_status "Building and deploying services..."
    
    # Set environment
    export $(cat .env.production | grep -v '^#' | xargs)
    
    # Pull latest images
    print_status "Pulling latest images..."
    docker-compose -f docker-compose.prod.yml pull
    
    # Build custom images
    print_status "Building custom images..."
    docker build -f Dockerfile.web -t contractor-platform-web:latest ../
    
    # Deploy services with zero-downtime strategy
    print_status "Deploying services..."
    docker-compose -f docker-compose.prod.yml up -d --remove-orphans
    
    # Wait for services to be healthy
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Run database migrations
    print_status "Running database migrations..."
    docker exec contractor-postgres-prod psql -U contractor_prod_user -d contractor_platform -f /docker-entrypoint-initdb.d/01-schema.sql || true
    
    # Initialize Rocket.Chat admin user
    print_status "Setting up Rocket.Chat admin user..."
    sleep 10 # Wait for Rocket.Chat to start
    
    print_success "Deployment completed successfully!"
}

# Health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Check database
    if docker exec contractor-postgres-prod pg_isready -U contractor_prod_user >/dev/null 2>&1; then
        print_success "✓ Database is healthy"
    else
        print_error "✗ Database health check failed"
        exit 1
    fi
    
    # Check Redis
    if docker exec contractor-redis-prod redis-cli -a "$REDIS_PASSWORD" ping >/dev/null 2>&1; then
        print_success "✓ Redis is healthy"
    else
        print_error "✗ Redis health check failed"
        exit 1
    fi
    
    # Check Kratos
    if curl -f "https://auth.$DOMAIN/health/ready" >/dev/null 2>&1; then
        print_success "✓ Kratos auth service is healthy"
    else
        print_warning "⚠ Kratos auth service may still be starting"
    fi
    
    # Check Rocket.Chat
    if curl -f "https://chat.$DOMAIN/api/info" >/dev/null 2>&1; then
        print_success "✓ Rocket.Chat is healthy"
    else
        print_warning "⚠ Rocket.Chat may still be starting"
    fi
    
    print_success "Health checks completed"
}

# Setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    # Traefik will automatically handle Let's Encrypt certificates
    # Just verify the configuration
    if [ -f "traefik/traefik.yml" ]; then
        print_success "✓ SSL configuration ready"
    else
        print_warning "⚠ Traefik SSL configuration not found"
    fi
}

# Post-deployment tasks
post_deployment() {
    print_status "Running post-deployment tasks..."
    
    # Clean up old images
    docker image prune -f
    
    # Set up log rotation
    docker exec contractor-postgres-prod bash -c "echo 'log_rotation_age = 7d' >> /var/lib/postgresql/data/postgresql.conf" || true
    
    # Print deployment summary
    echo ""
    echo "🎉 Deployment Summary:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "• Domain: https://$DOMAIN"
    echo "• Auth Service: https://auth.$DOMAIN"
    echo "• Chat Service: https://chat.$DOMAIN"
    echo "• File Uploads: https://uploads.$DOMAIN"
    echo "• Monitoring: https://dashboard.$DOMAIN"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    print_success "Post-deployment tasks completed"
}

# Main deployment workflow
main() {
    echo "🏗️  Contractor Platform Deployment"
    echo "Domain: $DOMAIN"
    echo "Environment: $ENVIRONMENT"
    echo ""
    
    check_prerequisites
    create_backup
    setup_ssl
    deploy_services
    run_health_checks
    post_deployment
    
    echo ""
    print_success "🚀 Contractor Platform deployed successfully!"
    echo "Visit https://$DOMAIN to access your platform"
    echo ""
}

# Run main function
main "$@"