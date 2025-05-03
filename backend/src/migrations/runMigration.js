/**
 * Migration Runner Script
 * 
 * This script connects to the MongoDB database and runs or rolls back migrations.
 * To run this script, use:
 * 
 * node src/migrations/runMigration.js [operation]
 * 
 * where [operation] is one of:
 * - up: Run all pending migrations (default)
 * - down: Roll back the most recent migration
 * - list: List all applied migrations
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { runMigrations, rollbackLastMigration, listMigrations } = require('./migrationManager');

// Get operation from command line arguments
const operation = process.argv[2] || 'up';

// Run migrations
const migrate = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Perform the requested operation
    switch (operation) {
      case 'up':
        await runMigrations();
        break;
      case 'down':
        await rollbackLastMigration();
        break;
      case 'list':
        const migrations = await listMigrations();
        console.log('Applied migrations:');
        migrations.forEach(migration => {
          console.log(`- ${migration.name} (applied at ${migration.appliedAt})`);
        });
        break;
      default:
        console.log('Invalid operation. Use "up", "down", or "list"');
    }
    
    // Disconnect from database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    
    // Disconnect from database
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
    
    process.exit(1);
  }
};

// Run the migration
migrate();