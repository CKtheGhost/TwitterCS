# MongoDB Setup Guide

This guide explains how to set up MongoDB for the Social Engagement Platform, including both local MongoDB and MongoDB Atlas options.

## Current Configuration

The application is currently configured to use a local MongoDB instance for both development and production environments.

### Local MongoDB Connection Information

- **Development**: `mongodb://localhost:27017/social-engagement`
- **Production**: `mongodb://mongodb:27017/social-engagement` (Docker container)

## MongoDB Atlas Configuration (Future Option)

For higher scalability, better monitoring, and automated backups, you can configure MongoDB Atlas for production use.

### Security Best Practices

1. **Password Management**
   - In production, store the password as an environment variable or in a secure vault
   - Never commit the password to version control
   - Consider using a service like AWS Secrets Manager or HashiCorp Vault

2. **Network Security**
   - Configure IP Access Lists in MongoDB Atlas to allow only your application servers
   - Consider using VPC Peering or Private Link for production workloads
   - Enable TLS/SSL connections only

3. **Database User Permissions**
   - Create separate user accounts for different environments
   - Use the principle of least privilege

## Testing Database Connectivity

To verify your MongoDB Atlas connection:

1. Run the test script:
   ```bash
   cd /home/ck/social-engagement-platform/backend
   node scripts/test-db-connection.js
   ```

2. Look for the "Connected to MongoDB successfully!" message

## Database Initialization

When connecting to a new MongoDB Atlas database for the first time:

1. The application will automatically create collections as needed
2. Run migrations to set up indexes and any default data:
   ```bash
   cd /home/ck/social-engagement-platform/backend
   npm run migrate
   ```

## Monitoring and Management

1. **Performance Monitoring**
   - Enable the Atlas Performance Advisor
   - Check Slow Query analyzer regularly
   - Enable Atlas Data Explorer for query testing

2. **Backups**
   - Enable automated backups in Atlas
   - Set appropriate backup retention policy (recommend 7 days minimum)
   - Test restoration procedures periodically

3. **Scaling**
   - Monitor connection limits and scale as needed
   - Consider enabling Atlas Auto-Scaling for production clusters
   - Set up alerts for high CPU, memory usage, or connection counts

## Troubleshooting Common Issues

1. **Connection Errors**
   - Check network access (IP whitelisting)
   - Verify username and password
   - Check for connection limits being reached

2. **Performance Issues**
   - Review slow query logs
   - Check for missing indexes
   - Consider upgrading cluster tier if needed

3. **Authentication Failures**
   - Confirm the database user has appropriate permissions
   - Check if the user is associated with the correct database
   - Ensure the authentication mechanism matches (SCRAM-SHA-1 vs SCRAM-SHA-256)

## Local Development vs. Production

For local development, you can either:
1. Use the MongoDB Atlas connection (ensure your IP is whitelisted)
2. Use a local MongoDB instance with:
   ```
   MONGODB_URI=mongodb://localhost:27017/social-engagement
   ```

The configuration files are set up to support both options.

## Migration from Local MongoDB to Atlas

To migrate existing data from a local MongoDB to Atlas:

1. **Use mongodump to export your data**:
   ```bash
   mongodump --uri="mongodb://localhost:27017/social-engagement" --out="./mongo-backup"
   ```

2. **Use mongorestore to import into Atlas**:
   ```bash
   mongorestore --uri="mongodb+srv://cktheghosteth:<password>@mycluster.6ynq3x6.mongodb.net/CD" ./mongo-backup/social-engagement
   ```