/**
 * Script to verify MongoDB connection and database setup
 * Run with: node scripts/verify-mongodb.js
 * 
 * For debugging: DEBUG=true node scripts/verify-mongodb.js
 */

// Load environment variables
require('dotenv').config();

// Import the database connection
const { connectDB } = require('../src/config/db');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Enable debug mode with DEBUG=true environment variable
const DEBUG = process.env.DEBUG === 'true';

// Logger with debug support
const logger = {
  info: (message) => {
    console.log(message);
  },
  error: (message) => {
    console.error(message);
  },
  debug: (message) => {
    if (DEBUG) {
      console.log(`[DEBUG] ${message}`);
    }
  }
};

// Create a simple test model to verify CRUD operations
const TestModel = mongoose.model('TestModel', new mongoose.Schema({
  name: String,
  createdAt: { type: Date, default: Date.now }
}), 'test_collection');

// Function to display connection information
function displayConnectionInfo() {
  logger.info('\nConnection Information:');
  logger.info('----------------------');
  
  // Get MongoDB URI from environment variables
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/social-engagement';
  
  // Display a sanitized version of the URI (hide credentials)
  let displayURI = mongoURI;
  if (mongoURI.includes('@')) {
    // Mask the username and password in the connection string
    displayURI = mongoURI.replace(/(mongodb(\+srv)?:\/\/)[^:]+:[^@]+@/, '$1***:***@');
  }
  
  logger.info(`MongoDB URI: ${displayURI}`);
  logger.info(`Connection Type: ${mongoURI.includes('+srv') ? 'MongoDB Atlas (SRV)' : 'Standard MongoDB'}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // If debugging, show more details
  if (DEBUG) {
    logger.debug(`Full MongoDB URI: ${mongoURI}`);
    logger.debug(`Mongoose version: ${mongoose.version}`);
    logger.debug(`Node.js version: ${process.version}`);
    logger.debug(`Platform: ${process.platform}`);
  }
}

// Function to check environment configuration
function checkEnvironmentConfig() {
  logger.info('\nChecking Environment Configuration:');
  logger.info('----------------------------------');
  
  // Check if .env file exists
  const envPath = path.join(__dirname, '..', '.env');
  const envExists = fs.existsSync(envPath);
  logger.info(`.env file exists: ${envExists ? 'Yes' : 'No'}`);
  
  // Verify MongoDB URI is set
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
  logger.info(`MongoDB URI is configured: ${mongoURI ? 'Yes' : 'No'}`);
  
  // Warn about potential issues
  if (!mongoURI) {
    logger.error('⚠️ No MongoDB URI found in environment variables. Using default local connection.');
  }
  
  if (mongoURI && mongoURI.includes('<') && mongoURI.includes('>')) {
    logger.error('⚠️ MongoDB URI contains placeholder values (<username>, <password>). Replace them with actual values.');
  }
}

// Main function to test MongoDB connection and operations
async function testMongoDB() {
  console.log('🔍 MongoDB Verification Script');
  console.log('==============================');
  
  try {
    // Display connection information
    displayConnectionInfo();
    
    // Check environment configuration
    checkEnvironmentConfig();
    
    // Connect to MongoDB
    logger.info('\n1️⃣ Testing connection to MongoDB...');
    logger.debug('Attempting to connect to MongoDB with connectDB()');
    const conn = await connectDB();
    logger.info(`  ✅ Connected to MongoDB at: ${conn.connection.host}`);
    logger.debug(`Connection state: ${mongoose.connection.readyState} (0: disconnected, 1: connected, 2: connecting, 3: disconnecting)`);
    
    // Test basic CRUD operations
    logger.info('\n2️⃣ Testing basic CRUD operations...');
    
    // Create
    logger.info('  - Creating test document...');
    const testDoc = await TestModel.create({ 
      name: `Test-${Date.now()}`,
    });
    logger.info(`  ✅ Created document with ID: ${testDoc._id}`);
    
    // Read
    logger.info('  - Reading test document...');
    const foundDoc = await TestModel.findById(testDoc._id);
    logger.info(`  ✅ Found document: ${foundDoc.name}`);
    
    // Update
    logger.info('  - Updating test document...');
    foundDoc.name = `${foundDoc.name}-updated`;
    await foundDoc.save();
    logger.info(`  ✅ Updated document: ${foundDoc.name}`);
    
    // Delete
    logger.info('  - Deleting test document...');
    await TestModel.findByIdAndDelete(testDoc._id);
    const deletedDoc = await TestModel.findById(testDoc._id);
    logger.info(`  ✅ Document deleted: ${deletedDoc === null ? 'true' : 'false'}`);
    
    // Test indexes
    logger.info('\n3️⃣ Testing indexes...');
    await TestModel.collection.createIndex({ name: 1 });
    const indexes = await TestModel.collection.indexes();
    logger.info(`  ✅ Indexes created successfully. Total indexes: ${indexes.length}`);
    logger.debug(`Indexes: ${JSON.stringify(indexes)}`);
    
    // Check database stats
    logger.info('\n4️⃣ Database statistics:');
    const stats = await mongoose.connection.db.stats();
    logger.info(`  - Database: ${mongoose.connection.name}`);
    logger.info(`  - Collections: ${stats.collections}`);
    logger.info(`  - Objects: ${stats.objects}`);
    logger.info(`  - Storage size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    
    // List collections if in debug mode
    if (DEBUG) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      logger.debug(`Available collections: ${collections.map(c => c.name).join(', ') || 'None'}`);
    }
    
    logger.info('\n✅ All MongoDB tests passed successfully!');
    logger.info('  Your MongoDB connection is working properly.');
    
    // Clean up by dropping the test collection
    await TestModel.collection.drop().catch(() => logger.info('  Note: No test collection to clean up.'));
    
    // Next steps
    logger.info('\n🚀 Next steps:');
    logger.info('  1. Start your application: npm start');
    logger.info('  2. For MongoDB Atlas setup assistance: node scripts/setup-mongodb-atlas.js');
    logger.info('  3. For detailed configuration options: see MONGODB_GUIDE.md');
    
  } catch (error) {
    logger.error('\n❌ MongoDB test failed:');
    logger.error(`  Error: ${error.message}`);
    
    // Provide helpful troubleshooting tips based on the error
    if (error.name === 'MongoServerSelectionError') {
      logger.error('\n🔍 Troubleshooting connection issues:');
      logger.error('  - Check if MongoDB service is running locally');
      logger.error('  - Verify your network connection');
      logger.error('  - For MongoDB Atlas: check IP whitelist and credentials');
      logger.error('  - See MONGODB_GUIDE.md for detailed troubleshooting steps');
    }
    
    // Show detailed error information in debug mode
    if (DEBUG) {
      logger.debug('Error details:');
      logger.debug(error.stack);
      logger.debug(`Error code: ${error.code}`);
      logger.debug(`Error name: ${error.name}`);
    } else {
      logger.error('  For more detailed error information, run with DEBUG=true');
    }
  } finally {
    // Close the connection
    if (mongoose.connection.readyState) {
      await mongoose.connection.close();
      logger.info('\n🔌 MongoDB connection closed.');
    }
  }
}

// Run the test
testMongoDB();