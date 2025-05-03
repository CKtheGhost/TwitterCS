# MongoDB Setup Guide for Social Engagement Platform

This guide provides comprehensive instructions for setting up MongoDB for the Social Engagement Platform.

## Local Development Setup

### Option 1: Install MongoDB Locally

1. **Install MongoDB Community Edition**
   - For Ubuntu:
     ```bash
     sudo apt-get update
     sudo apt-get install -y mongodb-org
     ```
   - For macOS:
     ```bash
     brew tap mongodb/brew
     brew install mongodb-community
     ```
   - For Windows: Download and install from the [MongoDB website](https://www.mongodb.com/try/download/community)

2. **Start MongoDB service**
   - Ubuntu:
     ```bash
     sudo systemctl start mongod
     sudo systemctl enable mongod  # Start on boot
     ```
   - macOS:
     ```bash
     brew services start mongodb-community
     ```
   - Windows: MongoDB should run as a service after installation

3. **Verify installation**
   ```bash
   mongosh --eval "db.version()"
   ```

4. **Configure the application**
   - Use this connection string in your `.env` file:
     ```
     MONGODB_URI=mongodb://localhost:27017/social-engagement
     ```

### Option 2: Use Docker for MongoDB

1. **Run MongoDB via Docker**
   ```bash
   docker run -d -p 27017:27017 --name social-mongodb -v mongodb_data:/data/db mongo:6
   ```

2. **Configure the application**
   - Use this connection string in your `.env` file:
     ```
     MONGODB_URI=mongodb://localhost:27017/social-engagement
     ```

## Production Setup

### Option 1: MongoDB in Docker Compose (Current Setup)

The current setup uses MongoDB in a Docker container managed by Docker Compose.

1. **Configuration**
   ```yaml
   # docker-compose.yml
   mongodb:
     image: mongo:6
     container_name: social-engagement-mongodb
     restart: always
     volumes:
       - mongodb-data:/data/db
     ports:
       - "27017:27017"
     networks:
       - app-network
   ```

2. **Connection String**
   ```
   MONGODB_URI=mongodb://mongodb:27017/social-engagement
   ```

3. **Start the services**
   ```bash
   docker-compose up -d
   ```

### Option 2: MongoDB Atlas (Cloud Hosted)

For production environments, MongoDB Atlas provides better scalability, automated backups, and monitoring.

1. **Create a MongoDB Atlas account**
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   - Create a new project
   - Build a new cluster (choose the free tier for testing)

2. **Configure network access**
   - In the Atlas UI, go to Network Access
   - Add the IP addresses of your production servers
   - For testing, you can allow access from anywhere (not recommended for production)

3. **Create a database user**
   - In the Atlas UI, go to Database Access
   - Add a new database user with appropriate privileges
   - Note the username and password

4. **Get your connection string**
   - In the Atlas UI, click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<username>` and `<password>` with your database user credentials

5. **Configure the application**
   - Update `.env.production` with your Atlas URI:
     ```
     MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database>
     ```

6. **Modify docker-compose.yml**
   - Update the environment section:
     ```yaml
     environment:
       - MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database>
     ```
   - Comment out the MongoDB service since it's no longer needed
   - Remove the dependency on MongoDB:
     ```yaml
     # depends_on:
     #   - mongodb
     ```

## Database Initialization

After setting up MongoDB, initialize the database:

1. **Run migrations**
   ```bash
   cd /home/ck/social-engagement-platform/backend
   npm run migrate
   ```

2. **Seed initial data if needed**
   ```bash
   npm run seed  # If a seed script exists
   ```

## Testing the Connection

1. **Use the provided test script**
   ```bash
   cd /home/ck/social-engagement-platform/backend
   node scripts/test-db-connection.js
   ```

2. **Check the MongoDB logs**
   - For local MongoDB:
     ```bash
     sudo tail -f /var/log/mongodb/mongod.log
     ```
   - For Docker:
     ```bash
     docker logs -f social-engagement-mongodb
     ```
   - For Atlas: Check the Atlas UI monitoring section

## Troubleshooting

### Common Issues

1. **Connection refused**
   - Check if MongoDB is running:
     ```bash
     sudo systemctl status mongod  # For local installation
     docker ps  # For Docker
     ```
   - Check if the port is accessible:
     ```bash
     telnet localhost 27017
     ```

2. **Authentication failed**
   - Verify username and password
   - Check if the user has access to the specified database
   - For Atlas, verify the connection string format

3. **Network issues with Atlas**
   - Check IP allowlist in Atlas configuration
   - Verify VPC peering configuration if used
   - Check for any firewalls blocking outbound connections

### Debugging Tools

1. **MongoDB Compass**
   - Download and install [MongoDB Compass](https://www.mongodb.com/products/compass)
   - Connect using your connection string to visually explore your database

2. **Checking database status**
   ```bash
   mongosh
   > use social-engagement
   > db.stats()
   > show collections
   ```

## Backup and Restore

### Local MongoDB Backup

1. **Create a backup**
   ```bash
   mongodump --uri="mongodb://localhost:27017/social-engagement" --out="./backups/$(date +%Y-%m-%d)"
   ```

2. **Restore from backup**
   ```bash
   mongorestore --uri="mongodb://localhost:27017/social-engagement" ./backups/2023-05-03/social-engagement
   ```

### Atlas Backup

MongoDB Atlas provides automated backups with point-in-time recovery. You can:

1. Configure backup schedule in the Atlas UI
2. Download backups for local storage
3. Restore to a specific point in time

## Security Recommendations

1. **Enable Authentication**
   - For local development, it's typically disabled
   - For production, always enable authentication

2. **Use TLS/SSL**
   - Configure MongoDB to use TLS
   - Use connection strings with TLS options:
     ```
     mongodb://username:password@hostname:port/database?ssl=true
     ```

3. **Follow Least Privilege Principle**
   - Create separate users for different applications
   - Restrict permissions to only what's needed

4. **Regular Security Audits**
   - Review database users and their permissions
   - Check for any unnecessary exposed ports

## Next Steps

After establishing your MongoDB connection, consider setting up:

1. Database monitoring and alerting
2. Automated backups
3. Performance tuning with indexes
4. Scaling strategy (sharding or replica sets)

With these configurations in place, your Social Engagement Platform will have a reliable and secure database foundation.