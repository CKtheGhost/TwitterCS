const mongoose = require('mongoose');
const logger = console; // Replace with your logger if you have one

// Connection options to address deprecation warnings
const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  autoIndex: process.env.NODE_ENV !== 'production', // Don't build indexes in production
  retryWrites: true,
  w: 'majority' // Write concern for MongoDB 4.4+
};

/**
 * Sanitize MongoDB URI by removing any credentials for logging
 * @param {string} uri - The MongoDB connection URI
 * @returns {string} - Sanitized URI for safe logging
 */
function sanitizeUri(uri) {
  if (!uri) return 'undefined';
  // Hide credentials in the URI to avoid exposing them in logs
  return uri.replace(/(mongodb(\+srv)?:\/\/)[^:]+:[^@]+@/, '$1***:***@');
}

/**
 * Format connection error message with specific troubleshooting tips
 * @param {Error} err - The MongoDB connection error
 * @returns {string} - Formatted error message with troubleshooting tips
 */
function formatConnectionError(err) {
  let message = `MongoDB connection error: ${err.message}`;
  
  // Add specific troubleshooting tips based on error
  if (err.name === 'MongoServerSelectionError') {
    message += '\nPossible issues:';
    message += '\n1. MongoDB service is not running';
    message += '\n2. Network connectivity issues';
    message += '\n3. Authentication failed (check username/password)';
    message += '\n4. IP address not whitelisted (for MongoDB Atlas)';
    message += '\n\nSee MONGODB_GUIDE.md for detailed troubleshooting steps.';
  }
  
  return message;
}

// MongoDB connection function
const connectDB = async () => {
  try {
    logger.info('Connecting to MongoDB...');
    
    // Get connection string from environment variables - use MONGODB_URI for new code but fallback to MONGO_URI for compatibility
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/social-engagement';
    
    // Validate connection string format
    if (mongoURI.includes('<') && mongoURI.includes('>')) {
      logger.error('MongoDB URI contains placeholder values (e.g., <username>, <password>). Please update with actual values.');
      logger.error('See README.md or MONGODB_GUIDE.md for configuration instructions.');
      
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
    
    logger.info(`Connecting to MongoDB at: ${sanitizeUri(mongoURI)}`);
    
    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, connectOptions);
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Log connection details (only in dev)
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`MongoDB Connection Details:`);
      logger.info(`- Database: ${conn.connection.name}`);
      logger.info(`- Connection state: ${mongoose.connection.readyState} (1 = connected)`);
      
      // List collections for debugging
      const collections = await mongoose.connection.db.listCollections().toArray();
      logger.info(`Available collections: ${collections.map(c => c.name).join(', ') || 'None'}`);
    }
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
      
      // If in development mode, attempt to reconnect automatically
      if (process.env.NODE_ENV !== 'production' && !mongoose.connection.readyState) {
        setTimeout(() => {
          logger.info('Attempting to reconnect to MongoDB...');
          mongoose.connect(mongoURI, connectOptions)
            .then(() => logger.info('MongoDB reconnected automatically'))
            .catch(err => logger.error(`Failed to reconnect: ${err.message}`));
        }, 5000);
      }
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    return conn;
  } catch (err) {
    logger.error(formatConnectionError(err));
    
    // For non-production, retry after 5 seconds
    if (process.env.NODE_ENV !== 'production') {
      logger.info('Retrying connection in 5 seconds...');
      return new Promise(resolve => {
        setTimeout(async () => {
          try {
            const conn = await connectDB();
            resolve(conn);
          } catch (retryErr) {
            logger.error(`Retry failed: ${retryErr.message}`);
            resolve(null);
          }
        }, 5000);
      });
    } else {
      // In production, fail fast
      process.exit(1);
    }
  }
};

module.exports = { connectDB };