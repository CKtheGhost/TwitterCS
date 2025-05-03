#!/bin/bash
# Production deployment script for Social Engagement Platform

set -e

# Display script banner
echo "========================================"
echo "Social Engagement Platform Deployment"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found!"
  echo "Please create a .env file with the required environment variables."
  exit 1
fi

# Check Docker and Docker Compose
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
  echo "Error: Docker and/or Docker Compose not installed!"
  echo "Please install them before proceeding."
  exit 1
fi

# Verify production environment
echo "Verifying production environment variables..."
if ! grep -q "NODE_ENV=production" .env; then
  echo "Warning: NODE_ENV is not set to 'production' in .env file!"
  read -p "Do you want to continue anyway? (y/n): " response
  if [[ "$response" != "y" ]]; then
    exit 1
  fi
fi

# Check for required directories
if [ ! -d "nginx/ssl" ]; then
  echo "Creating nginx/ssl directory..."
  mkdir -p nginx/ssl
  echo "Warning: SSL certificates not found!"
  echo "Please place your SSL certificates in the nginx/ssl directory."
fi

if [ ! -d "nginx/conf.d" ]; then
  echo "Error: nginx/conf.d directory not found!"
  echo "Please ensure the nginx configuration directory exists."
  exit 1
fi

# Pull latest code if in a git repository
if [ -d ".git" ]; then
  echo "Pulling latest code from repository..."
  git pull
fi

# Run tests
echo "Running tests..."
cd backend
npm test
if [ $? -ne 0 ]; then
  echo "Warning: Tests failed!"
  read -p "Do you want to continue with deployment anyway? (y/n): " response
  if [[ "$response" != "y" ]]; then
    exit 1
  fi
fi
cd ..

# Build containers
echo "Building Docker containers..."
docker-compose build

# Stop any existing containers
echo "Stopping existing containers..."
docker-compose down

# Start containers
echo "Starting containers..."
docker-compose up -d

# Check services health
echo "Checking service health..."
sleep 10  # Wait for services to initialize

# Check if services are running
if [ "$(docker-compose ps --services --filter "status=running" | wc -l)" -ne "$(docker-compose ps --services | wc -l)" ]; then
  echo "Warning: Not all services are running!"
  docker-compose ps
else
  echo "All services are running."
fi

# Check API health
echo "Checking API health..."
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
if [ "$API_HEALTH" -eq 200 ]; then
  echo "API is healthy!"
else
  echo "Warning: API health check failed with status code $API_HEALTH!"
fi

echo ""
echo "========================================"
echo "Deployment completed!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Verify all services are running: docker-compose ps"
echo "2. Check logs for any errors: docker-compose logs"
echo "3. Test the application through your domain"
echo ""
echo "For troubleshooting, refer to docs/DEPLOYMENT.md"