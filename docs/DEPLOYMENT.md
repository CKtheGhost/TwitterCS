# Production Deployment Guide

This document outlines the process for deploying the Social Engagement Platform to a production environment.

## Prerequisites

Before deployment, ensure you have the following:

- Docker and Docker Compose installed on your production server
- Access to environment variables for sensitive configuration
- Domain name configured with DNS pointing to your server
- SSL certificates for your domain

## Environment Variables

Create a `.env` file in the root of the project with the following variables:

```bash
# Application
NODE_ENV=production
PORT=3001

# Security
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRY=7d

# MongoDB
MONGODB_URI=mongodb://mongodb:27017/social-engagement

# Redis
REDIS_PASSWORD=your-secure-redis-password

# Twitter API
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret

# Blockchain
INFURA_API_KEY=your-infura-api-key
CONTRACT_ADDRESS=your-contract-address
```

**Important**: Never commit this file to version control. These values should be treated as secrets.

## Deployment Steps

### 1. Prepare the Server

Update your server and install Docker and Docker Compose:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone the Repository

```bash
git clone https://github.com/yourorganization/social-engagement-platform.git
cd social-engagement-platform
```

### 3. Configure SSL

Place your SSL certificates in the `nginx/ssl` directory:

```bash
mkdir -p nginx/ssl
# Copy your SSL certificates here
cp /path/to/your/certificate.crt nginx/ssl/
cp /path/to/your/private.key nginx/ssl/
```

Update the Nginx configuration in `nginx/conf.d/default.conf` to use your domain name.

### 4. Set Environment Variables

Create the `.env` file with all the required variables as listed above.

### 5. Build and Start the Application

```bash
# Build the containers
docker-compose build

# Start the services
docker-compose up -d
```

### 6. Verify Deployment

Check that all services are running:

```bash
docker-compose ps
```

Verify the API is accessible by checking the health endpoint:

```bash
curl https://your-domain.com/api/health
```

You should receive a JSON response with status "ok".

## Monitoring and Maintenance

### Logs

View logs for a specific service:

```bash
docker-compose logs -f backend
```

### Backups

Set up regular backups for the MongoDB database:

```bash
# Create a backup script
mkdir -p /path/to/backups

cat > backup.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/path/to/backups"
CONTAINER_NAME="social-engagement-mongodb"

docker exec $CONTAINER_NAME mongodump --out=/tmp/backup
docker cp $CONTAINER_NAME:/tmp/backup $BACKUP_DIR/mongodb_$TIMESTAMP
docker exec $CONTAINER_NAME rm -rf /tmp/backup

# Remove backups older than 30 days
find $BACKUP_DIR -type d -name "mongodb_*" -mtime +30 -exec rm -rf {} \;
EOF

chmod +x backup.sh

# Add to crontab to run daily
(crontab -l 2>/dev/null; echo "0 2 * * * /path/to/backup.sh") | crontab -
```

### Updating the Application

To update the application with new code:

```bash
# Pull the latest changes
git pull

# Rebuild and restart the services
docker-compose down
docker-compose build
docker-compose up -d
```

## Security Considerations

1. **Firewall**: Configure a firewall to only allow traffic on ports 80 and 443.

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

2. **Security Headers**: Ensure Nginx is configured with appropriate security headers.

3. **Regular Updates**: Keep all containers updated with the latest security patches.

```bash
docker-compose pull
docker-compose up -d
```

## Scaling Considerations

For higher traffic volumes, consider:

1. **Load Balancing**: Add multiple backend instances behind a load balancer.
2. **MongoDB Replication**: Set up a MongoDB replica set for redundancy.
3. **Redis Cluster**: Configure Redis for high availability.

## Troubleshooting

### Common Issues

1. **Services not starting**: Check logs with `docker-compose logs [service]`.
2. **Database connection issues**: Verify MongoDB is running with `docker-compose ps` and check network configuration.
3. **API not responding**: Check the health endpoint and inspect the backend logs.

### Support

For additional support, contact the development team or refer to internal documentation.