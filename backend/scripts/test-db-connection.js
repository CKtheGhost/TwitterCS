/**
 * Script to test MongoDB connection
 * Run with: node scripts/test-db-connection.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('MongoDB URI:', process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@')); // Hide password in logs

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully!');
    console.log('Connection details:');
    console.log('  - Database name:', mongoose.connection.name);
    console.log('  - Connection state:', mongoose.STATES[mongoose.connection.readyState]);
    
    // List collections to verify further
    return mongoose.connection.db.listCollections().toArray();
  })
  .then(collections => {
    console.log('  - Available collections:', collections.map(c => c.name).join(', ') || 'None');
    
    // Close connection
    return mongoose.connection.close();
  })
  .then(() => {
    console.log('Connection closed successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Details:', err);
    process.exit(1);
  });