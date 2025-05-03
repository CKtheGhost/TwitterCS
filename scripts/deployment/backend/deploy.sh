#!/bin/bash
# Backend deployment script
# This script deploys the backend to different environments

set -e

# Set current directory to the script directory
cd "$(dirname "$0")"
# Navigate to the project root directory
cd ../../../

# Get deployment environment from args
ENVIRONMENT=${1:-"production"}
echo "Deploying backend to $ENVIRONMENT environment"

# Load environment variables
if [ -f "backend/.env.$ENVIRONMENT" ]; then
  echo "Loading environment variables from backend/.env.$ENVIRONMENT"
  export $(grep -v '^#' backend/.env.$ENVIRONMENT | xargs)
elif [ -f "backend/.env" ]; then
  echo "Loading environment variables from backend/.env"
  export $(grep -v '^#' backend/.env | xargs)
else
  echo "No environment file found. Using default values."
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
  echo "Error: Docker and Docker Compose are required for deployment"
  exit 1
fi

# Create environment-specific docker-compose override file
cat > docker-compose.override.yml << EOF
version: '3.8'

services:
  backend:
    environment:
      - NODE_ENV=${ENVIRONMENT}
EOF

# Deployment based on environment
case $ENVIRONMENT in
  production)
    echo "Deploying to production environment..."
    
    # Build and start containers in detached mode
    docker-compose -f docker-compose.yml -f docker-compose.override.yml build
    docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
    
    # Verify deployment
    echo "Verifying deployment..."
    sleep 10
    if docker-compose ps | grep -q "social-engagement-backend"; then
      echo "Backend service is running"
    else
      echo "Error: Backend service failed to start"
      docker-compose logs backend
      exit 1
    fi
    ;;
    
  staging)
    echo "Deploying to staging environment..."
    
    # Add staging-specific settings to override file
    cat >> docker-compose.override.yml << EOF
    ports:
      - "3002:3001"
    environment:
      - PORT=3001
      - MONGODB_URI=mongodb://mongodb:27017/social-engagement-staging
EOF
    
    # Build and start containers in detached mode
    docker-compose -f docker-compose.yml -f docker-compose.override.yml build
    docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
    
    # Verify deployment
    echo "Verifying deployment..."
    sleep 10
    if docker-compose ps | grep -q "social-engagement-backend"; then
      echo "Backend service is running on staging"
    else
      echo "Error: Backend service failed to start on staging"
      docker-compose logs backend
      exit 1
    fi
    ;;
    
  development)
    echo "Setting up development environment..."
    
    # Add development-specific settings to override file
    cat >> docker-compose.override.yml << EOF
    volumes:
      - ./backend:/app
    command: npm run dev
    ports:
      - "3001:3001"
      - "9229:9229"
EOF
    
    # Build and start containers in interactive mode
    docker-compose -f docker-compose.yml -f docker-compose.override.yml build
    docker-compose -f docker-compose.yml -f docker-compose.override.yml up
    ;;
    
  *)
    echo "Unknown environment: $ENVIRONMENT"
    echo "Supported environments: production, staging, development"
    exit 1
    ;;
esac

echo "Backend deployment to $ENVIRONMENT completed successfully!"
exit 0