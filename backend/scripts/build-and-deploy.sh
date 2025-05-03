#!/bin/bash
# Social Engagement Platform Production Build and Deployment Script
# Usage: ./scripts/build-and-deploy.sh [environment]
# Example: ./scripts/build-and-deploy.sh production

# Set default environment to production if not specified
ENVIRONMENT=${1:-production}
DOCKER_COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
ENV_FILE=".env.${ENVIRONMENT}"

# Check if running with root permissions
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or with sudo"
  exit 1
fi

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE does not exist."
  echo "Create $ENV_FILE from the example file before deploying."
  exit 1
fi

# Check if docker-compose file exists
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
  echo "Error: $DOCKER_COMPOSE_FILE does not exist."
  exit 1
fi

# Load environment variables
export $(grep -v '^#' $ENV_FILE | xargs)

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if Docker is installed
if ! command_exists docker; then
  echo "Docker is not installed. Installing Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  systemctl enable docker
  systemctl start docker
fi

# Check if Docker Compose is installed
if ! command_exists docker-compose; then
  echo "Docker Compose is not installed. Installing Docker Compose..."
  curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
fi

echo "===== Building and Deploying for $ENVIRONMENT environment ====="

# Create required directories if they don't exist
echo "Creating required directories..."
mkdir -p ./nginx/ssl
mkdir -p ./nginx/logs
mkdir -p ./logs

# Check if SSL certificates exist for production
if [ "$ENVIRONMENT" = "production" ] && [ ! -f "./nginx/ssl/server.crt" ]; then
  echo "Warning: SSL certificates not found in ./nginx/ssl/"
  echo "You should use real SSL certificates for production."
  
  # Generate self-signed certificates for testing (not for real production use)
  echo "Generating self-signed SSL certificates for testing..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ./nginx/ssl/server.key -out ./nginx/ssl/server.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=localhost"
  
  echo "Self-signed certificates generated. Replace with real certificates before going live."
fi

# Pull the latest code and reset any local changes
echo "Pulling latest code from repository..."
git fetch --all
git reset --hard origin/main

# Build and start the containers
echo "Building and starting Docker containers..."
docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
docker-compose -f $DOCKER_COMPOSE_FILE up -d

# Check if containers are running
echo "Verifying containers are running..."
sleep 10
if [ "$(docker-compose -f $DOCKER_COMPOSE_FILE ps -q | wc -l)" -eq 0 ]; then
  echo "Error: Containers failed to start."
  docker-compose -f $DOCKER_COMPOSE_FILE logs
  exit 1
fi

# Run database migrations if required
if [ "$AUTO_MIGRATE" = "true" ]; then
  echo "Running database migrations..."
  docker-compose -f $DOCKER_COMPOSE_FILE exec -T app npm run migrate
fi

# Check API health
echo "Checking API health..."
HEALTH_CHECK_URL="http://localhost:${PORT:-3001}/health"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_CHECK_URL)

if [ "$HEALTH_STATUS" -eq 200 ]; then
  echo "✅ API is healthy!"
else
  echo "⚠️ API health check failed with status code $HEALTH_STATUS"
  echo "Check logs for more information:"
  docker-compose -f $DOCKER_COMPOSE_FILE logs app
fi

# Display deployed version info
echo "===== Deployment Complete ====="
echo "Environment: $ENVIRONMENT"
echo "Version: $(git describe --tags --always)"
echo "Deployed at: $(date)"
echo "Services:"
docker-compose -f $DOCKER_COMPOSE_FILE ps

# Cleanup old images to save disk space
echo "Cleaning up old Docker images..."
docker system prune -af --volumes

echo "Deployment finished!"