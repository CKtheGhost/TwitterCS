# Production Deployment Guide for Social Engagement Platform

This guide provides comprehensive instructions for deploying the Social Engagement Platform to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Docker Deployment](#docker-deployment)
- [Environment Setup](#environment-setup)
- [Database Configuration](#database-configuration)
- [Security Considerations](#security-considerations)
- [CI/CD Integration](#cicd-integration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Scaling Considerations](#scaling-considerations)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying to production, ensure you have:

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher) or MongoDB Atlas account
- Docker and Docker Compose (if using containerization)
- Domain name and SSL certificate
- CI/CD platform access (optional)
- Cloud provider account (AWS, Azure, GCP, etc.)

## Deployment Options

The Social Engagement Platform can be deployed in several ways:

1. **Containerized Deployment** (Recommended)
   - Docker containers with Docker Compose or Kubernetes
   - Easier scaling, consistent environments, isolation

2. **Traditional VM/Server Deployment**
   - Direct installation on VMs or dedicated servers
   - Simpler setup but more complex scaling

3. **Serverless/PaaS Deployment**
   - Using services like AWS Elastic Beanstalk, Heroku, or Google App Engine
   - Reduced infrastructure management, potential cost savings

## Docker Deployment

### Building the Docker Image

1. The Dockerfile is already included in the repository. Build the image:

```bash
docker build -t social-engagement-backend:latest .
```

2. Test the image locally:

```bash
docker-compose up -d
```

### Deploying with Docker Compose

1. Create a production `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    image: social-engagement-backend:latest
    container_name: social-engagement-api
    restart: always
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - LOG_LEVEL=info
      - CORS_ORIGIN=https://app.yourdomain.com
    depends_on:
      - mongodb
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  mongodb:
    image: mongo:latest
    container_name: mongodb
    restart: always
    volumes:
      - mongo_data:/data/db
    networks:
      - app-network
    command: ["--bind_ip", "0.0.0.0"]
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongo localhost:27017/test --quiet
      interval: 30s
      timeout: 10s
      retries: 5

networks:
  app-network:
    driver: bridge

volumes:
  mongo_data:
```

3. Run with production environment:

```bash
export MONGODB_URI=mongodb://mongodb:27017/social-engagement
export JWT_SECRET=your_strong_jwt_secret
docker-compose -f docker-compose.production.yml up -d
```

### Deploying to Kubernetes

For larger scale deployments, Kubernetes provides better orchestration:

1. Create Kubernetes manifests in a `k8s` directory:
   - Deployments for backend and MongoDB
   - Services to expose the applications
   - ConfigMaps and Secrets for configuration
   - Persistent Volume Claims for database storage

2. Apply the manifests:

```bash
kubectl apply -f k8s/
```

## Environment Setup

### Production Environment Variables

Create a secure `.env.production` file with these settings:

```
NODE_ENV=production
PORT=3001

# Use a strong, randomly generated secret for JWT
JWT_SECRET=your_strong_jwt_secret_at_least_32_chars

# Production database (ideally MongoDB Atlas for managed solution)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/social-engagement

# Security settings
CORS_ORIGIN=https://app.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
DATA_RETENTION_DAYS=730

# Logging
LOG_LEVEL=info
AUDIT_LOG_ENABLED=true

# Consent and Privacy
CONSENT_VERSION=1.0.0
PRIVACY_POLICY_URL=https://yourdomain.com/privacy
TERMS_URL=https://yourdomain.com/terms
```

### Using Environment Variables in Production

For security, avoid storing environment variables in files on production servers. Instead:

- Use Docker Secrets or Kubernetes Secrets
- Use environment variable management from your cloud provider
- Use a key management service (KMS) for sensitive information

## Database Configuration

### MongoDB Atlas (Recommended for Production)

1. Set up a MongoDB Atlas cluster (M10 or higher for production workloads)
2. Configure IP allowlist for your production servers
3. Create a dedicated database user with strong password
4. Enable automatic backups
5. Use the connection string in your production environment

### Self-Hosted MongoDB

If using self-hosted MongoDB:

1. Configure as a replica set for redundancy
2. Enable authentication and TLS/SSL
3. Implement regular backup strategy
4. Monitor disk space and performance
5. Use dedicated volumes for data storage

## Security Considerations

### API Security

1. **HTTPS**: Ensure all traffic is encrypted with SSL/TLS
   ```
   # Example nginx configuration for SSL termination
   server {
       listen 443 ssl;
       server_name api.yourdomain.com;
       
       ssl_certificate /path/to/certificate.crt;
       ssl_certificate_key /path/to/private.key;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

2. **Authentication/Authorization**: 
   - Use strong JWT secrets
   - Set appropriate token expiration periods
   - Implement refresh token rotation

3. **Rate Limiting**: Already implemented, but adjust values for production:
   ```javascript
   // 100 requests per 15 minute window
   app.use('/api', rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100,
     message: { error: 'Too many requests, please try again later.' }
   }));
   ```

4. **Security Headers**: Already implemented with Helmet, but verify all are enabled

### Network Security

1. Use a firewall to restrict access to required ports only
2. Set up a reverse proxy (Nginx, Apache) for SSL termination and additional security
3. Consider using a Web Application Firewall (WAF) for additional protection
4. Implement DDoS protection through services like Cloudflare

## CI/CD Integration

### GitHub Actions Example

Create a workflow file at `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_ACCESS_TOKEN }}
          
      - name: Build and push Docker image
        uses: docker/build-push-action@v2
        with:
          context: .
          push: true
          tags: yourusername/social-engagement-backend:latest
          
      - name: Deploy to production server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/deployment
            docker-compose pull
            docker-compose up -d
```

## Monitoring and Logging

### Implementing Monitoring

1. **Health Checks**: Already implemented at `/health` endpoint
2. **Metrics Collection**: Add Prometheus metrics:

```javascript
const promClient = require('prom-client');
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Add a metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});
```

3. **Monitoring Tools**:
   - Set up Prometheus and Grafana for metrics visualization
   - Use cloud provider monitoring (CloudWatch, StackDriver)
   - Consider APM solutions (New Relic, Datadog)

### Logging Strategy

1. **Centralized Logging**: Set up ELK Stack (Elasticsearch, Logstash, Kibana) or use a logging service
2. **Structured Logging**: Update logger to use JSON format:

```javascript
const winston = require('winston');
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'social-engagement-api' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

3. **Log Rotation**: Implement log rotation to manage disk space

## Scaling Considerations

### Horizontal Scaling

1. **Stateless API**: The application is designed to be stateless, enabling horizontal scaling
2. **Load Balancing**: Set up a load balancer (Nginx, HAProxy, cloud provider LB)
3. **Session Management**: Ensure all sessions are stored in database, not memory

### Database Scaling

1. **MongoDB Scaling**:
   - Use MongoDB Atlas with auto-scaling
   - For self-hosted, set up a replica set with at least 3 nodes
   - Consider sharding for very large datasets

### Caching

1. **Implement Redis** for caching frequently accessed data:

```javascript
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});

// Example caching middleware
function cacheMiddleware(duration) {
  return (req, res, next) => {
    const key = '__express__' + req.originalUrl || req.url;
    client.get(key, (err, reply) => {
      if (reply) {
        res.send(JSON.parse(reply));
        return;
      }
      
      // Store response in cache
      res.sendResponse = res.send;
      res.send = (body) => {
        client.setex(key, duration, JSON.stringify(body));
        res.sendResponse(body);
      };
      next();
    });
  };
}

// Apply to routes that benefit from caching
app.get('/api/content', cacheMiddleware(60), contentController.getContent);
```

## Backup and Recovery

### Database Backups

1. **Automated Backups**:
   - MongoDB Atlas has built-in backups
   - For self-hosted, set up scheduled mongodump:

```bash
# Backup script (store in cron job)
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
BACKUP_DIR="/path/to/backups"
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/backup_$TIMESTAMP"

# Keep only last 7 daily backups
find $BACKUP_DIR -type d -name "backup_*" -mtime +7 -exec rm -rf {} \;
```

2. **Backup Testing**: Regularly test restore process to verify backup integrity

### Disaster Recovery

1. Create a disaster recovery plan document
2. Document restoration processes
3. Consider multi-region deployments for critical applications

## Troubleshooting

### Common Production Issues

1. **Connection Issues**:
   - Check firewall rules and security groups
   - Verify network connectivity between services

2. **Performance Problems**:
   - Check server resources (CPU, memory, disk I/O)
   - Review MongoDB query performance with explain() plan
   - Check for memory leaks with tools like clinic.js

3. **Error Handling**:
   - Review logs for error patterns
   - Set up alerts for critical errors

### Production Checklist

✅ Environment variables properly set  
✅ Database indexes created  
✅ Rate limiting configured  
✅ Security headers implemented  
✅ Monitoring and logging set up  
✅ SSL/TLS certificates installed  
✅ Firewall rules configured  
✅ Backup strategy implemented  
✅ Health checks enabled  
✅ Load testing completed  

---

## Deployment Checklist

Use the following checklist before deploying to production:

- [ ] All tests are passing (`npm test`)
- [ ] Database migrations are ready
- [ ] Environment variables are set correctly
- [ ] Security headers and configurations are reviewed
- [ ] Rate limiting is properly configured
- [ ] Logging and monitoring is set up
- [ ] SSL certificates are valid and installed
- [ ] Database backups are configured
- [ ] Load testing shows stable performance
- [ ] Rollback procedure is documented and tested

For questions or issues with deployment, please contact the DevOps team.