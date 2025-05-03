# MongoDB Connection Guide for Social Engagement Platform

This guide provides comprehensive instructions for setting up and configuring MongoDB for the social engagement platform.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Option 1: Local MongoDB Installation](#option-1-local-mongodb-installation)
- [Option 2: MongoDB with Docker](#option-2-mongodb-with-docker)
- [Option 3: MongoDB Atlas (Cloud)](#option-3-mongodb-atlas-cloud)
- [Connection Configuration](#connection-configuration)
- [Verifying Your Connection](#verifying-your-connection)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Access to terminal/command line
- Network connection for MongoDB Atlas (if using cloud option)

## Option 1: Local MongoDB Installation

### Ubuntu/Debian

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Reload package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod

# Enable MongoDB to start on system boot
sudo systemctl enable mongod

# Verify installation
mongod --version
```

### Windows

1. Download the MongoDB Community Server installer from the [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the installation wizard
3. Choose "Complete" installation
4. Install MongoDB Compass (optional but recommended for GUI management)
5. MongoDB will be installed as a Windows service and start automatically

### macOS

Using Homebrew:

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community
```

## Option 2: MongoDB with Docker

### Prerequisites
- Docker installed on your system

### Steps

1. Create a `docker-compose.yml` file in the project root:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=social-engagement
    restart: unless-stopped

volumes:
  mongo_data:
```

2. Start MongoDB with Docker Compose:

```bash
docker-compose up -d
```

3. Verify the container is running:

```bash
docker ps
```

4. Update your `.env` file to connect to the Docker container:

```
MONGODB_URI=mongodb://localhost:27017/social-engagement
```

## Option 3: MongoDB Atlas (Cloud)

MongoDB Atlas is a fully-managed cloud database service that's ideal for production deployments. It offers a free tier that's suitable for development and small applications.

### Setup Steps

1. **Create an account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   - Sign up for a free account

2. **Create a cluster**:
   - Click "Build a Database"
   - Choose "FREE" tier (Shared Cluster)
   - Select your preferred cloud provider and region
   - Click "Create Cluster" (this will take a few minutes)

3. **Set up database access**:
   - Click "Database Access" in the sidebar
   - Click "Add New Database User"
   - Create a username and secure password
   - Set privileges to "Read and write to any database"
   - Click "Add User"

4. **Configure network access**:
   - Click "Network Access" in the sidebar
   - Click "Add IP Address"
   - For development, select "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, add specific IP addresses
   - Click "Confirm"

5. **Get your connection string**:
   - Click "Connect" on your cluster
   - Select "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your user's password
   - Replace `<dbname>` with `social-engagement`

6. **Automated Setup**:
   - You can use our setup script for guided MongoDB Atlas configuration:
   ```bash
   cd /home/ck/social-engagement-platform/backend
   node scripts/setup-mongodb-atlas.js
   ```

## Connection Configuration

### Environment Variables

Update your `.env` file with the appropriate MongoDB URI:

```
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/social-engagement

# For MongoDB Atlas:
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/social-engagement
```

### Configuration in `config/db.js`

Our database configuration file already includes proper connection handling:

```javascript
// Get connection string from environment variables with fallbacks
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/social-engagement';

// Connect to MongoDB
const conn = await mongoose.connect(mongoURI, connectOptions);
```

## Verifying Your Connection

Run our verification script to test your MongoDB connection:

```bash
cd /home/ck/social-engagement-platform/backend
node scripts/verify-mongodb.js
```

The script will:
1. Connect to your configured MongoDB instance
2. Create a test document
3. Read, update, and delete the document
4. Verify indexes can be created
5. Display database statistics

If the script completes successfully, your MongoDB connection is properly configured.

## Troubleshooting

### Common Issues and Solutions

#### Connection Timeout
- **Issue**: `MongoTimeoutError: Server selection timed out after 30000 ms`
- **Solutions**:
  - Check if MongoDB service is running: `sudo systemctl status mongod`
  - Verify firewall settings allow connections to port 27017
  - For Atlas: Check network access settings and IP whitelist

#### Authentication Failed
- **Issue**: `MongoServerError: Authentication failed`
- **Solutions**:
  - Double-check username and password in connection string
  - Ensure the user has appropriate permissions
  - Verify you're connecting to the correct database

#### WSL2 Specific Issues
- **Issue**: Running MongoDB service in WSL2
- **Solutions**:
  - Install MongoDB directly on Windows and connect to it from WSL2
  - Use Docker for Windows with WSL2 integration
  - Use MongoDB Atlas cloud solution

#### Docker Connection Issues
- **Issue**: Cannot connect to MongoDB container
- **Solutions**:
  - Ensure Docker is running: `docker ps`
  - Check container logs: `docker logs mongodb`
  - Verify ports are properly mapped and not blocked by firewall

### Diagnostic Commands

```bash
# Check if MongoDB process is running
ps aux | grep mongod

# Check MongoDB logs
sudo cat /var/log/mongodb/mongod.log

# Test connection with mongo shell
mongo mongodb://localhost:27017/social-engagement

# For Docker, check container status
docker ps | grep mongodb
```

## Security Best Practices

1. **Use Strong Authentication**:
   - Create a dedicated database user for the application
   - Use strong, unique passwords
   - Consider MongoDB Atlas IAM authentication for production

2. **Network Security**:
   - Limit network access to specific IP addresses
   - Use TLS/SSL for all connections (MongoDB Atlas enforces this)
   - Run MongoDB on a non-default port for local deployments

3. **Data Security**:
   - Enable encryption at rest (available in MongoDB Enterprise and Atlas)
   - Implement field-level encryption for sensitive data
   - Set up regular backups

4. **Authorization**:
   - Use role-based access control (RBAC)
   - Follow the principle of least privilege
   - Regularly audit user access and permissions

5. **Application Security**:
   - Use environment variables for connection strings
   - Never commit database credentials to version control
   - Implement proper input validation to prevent injection attacks

---

## Need Help?

If you encounter issues not covered in this guide:

1. Check the [MongoDB documentation](https://docs.mongodb.com/)
2. Search for specific error messages on [MongoDB Community Forums](https://www.mongodb.com/community/forums/)
3. Run the verification script with debug logs: `DEBUG=true node scripts/verify-mongodb.js`
4. Contact the project maintainers for project-specific issues