/**
 * Migration Manager for MongoDB
 * 
 * This simple migration manager helps track and run database migrations
 * for the Social Engagement Platform.
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Define Migration schema to track which migrations have been run
const MigrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create Migration model
const Migration = mongoose.model('Migration', MigrationSchema);

/**
 * Run all pending migrations
 */
const runMigrations = async () => {
  console.log('Checking for pending migrations...');
  
  // Get all migration files
  const migrationsDir = path.join(__dirname, 'scripts');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js'))
    .sort(); // Sort to ensure migrations run in order
  
  // Get all migrations that have already been applied
  const appliedMigrations = await Migration.find().select('name');
  const appliedMigrationNames = appliedMigrations.map(migration => migration.name);
  
  // Find pending migrations
  const pendingMigrations = migrationFiles.filter(file => !appliedMigrationNames.includes(file));
  
  if (pendingMigrations.length === 0) {
    console.log('No pending migrations to apply');
    return;
  }
  
  console.log(`Found ${pendingMigrations.length} pending migrations`);
  
  // Run pending migrations
  for (const migrationFile of pendingMigrations) {
    try {
      console.log(`Running migration: ${migrationFile}`);
      
      // Import migration script
      const migration = require(path.join(migrationsDir, migrationFile));
      
      // Run the up function
      await migration.up();
      
      // Record that this migration has been applied
      await Migration.create({ name: migrationFile });
      
      console.log(`Migration ${migrationFile} applied successfully`);
    } catch (error) {
      console.error(`Error applying migration ${migrationFile}:`, error);
      throw error; // Stop migration process on error
    }
  }
  
  console.log('All migrations applied successfully');
};

/**
 * Rollback the last applied migration
 */
const rollbackLastMigration = async () => {
  // Get the last applied migration
  const lastMigration = await Migration.findOne().sort({ appliedAt: -1 });
  
  if (!lastMigration) {
    console.log('No migrations to rollback');
    return;
  }
  
  try {
    console.log(`Rolling back migration: ${lastMigration.name}`);
    
    // Import migration script
    const migration = require(path.join(__dirname, 'scripts', lastMigration.name));
    
    // Run the down function
    await migration.down();
    
    // Remove migration record
    await Migration.deleteOne({ _id: lastMigration._id });
    
    console.log(`Migration ${lastMigration.name} rolled back successfully`);
  } catch (error) {
    console.error(`Error rolling back migration ${lastMigration.name}:`, error);
    throw error;
  }
};

/**
 * List all applied migrations
 */
const listMigrations = async () => {
  const migrations = await Migration.find().sort({ appliedAt: 1 });
  return migrations;
};

module.exports = {
  runMigrations,
  rollbackLastMigration,
  listMigrations,
  Migration
};