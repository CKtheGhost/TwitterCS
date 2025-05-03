/**
 * MongoDB database configuration
 * Handles connection to MongoDB with appropriate error handling and logging
 */

const mongoose = require('mongoose');
const logger = console; // Replace with your logger if you have one

// Connection options to address deprecation warnings
const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  autoIndex: process.env.NODE_ENV !== 'production', // Don't build indexes in production
};

// MongoDB Connection
const connectDB = async () => {
  try {
    logger.info('Connecting to MongoDB...');
    
    // Get connection string from environment variables
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB connection string (MONGODB_URI) is not defined in environment variables');
    }
    
    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, connectOptions);
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Log available collections for debugging
    const collections = await mongoose.connection.db.listCollections().toArray();
    logger.info(`Available collections: ${collections.map(c => c.name).join(', ') || 'None'}`);
    
    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
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
    logger.error(`MongoDB connection error: ${err.message}`);
    logger.error(err.stack);
    
    // For non-production, retry after 5 seconds
    if (process.env.NODE_ENV !== 'production') {
      logger.info('Retrying connection in 5 seconds...');
      setTimeout(() => connectDB(), 5000);
    } else {
      // In production, fail fast
      process.exit(1);
    }
  }
};

module.exports = connectDB;