/**
 * Data Retention Job
 * 
 * This script runs on a schedule to enforce data retention policies
 * and anonymize data that has reached the end of its retention period.
 * This is an important part of GDPR compliance and ethical data handling.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const QuestCompletion = require('../models/QuestCompletion');

const enforceDataRetention = async () => {
  try {
    console.log('[Data Retention Job] Starting...');
    
    // Connect to database
    await connectDB();
    console.log('[Data Retention Job] Connected to MongoDB');
    
    // Anonymize expired quest completion data
    const anonymizedCount = await QuestCompletion.anonymizeExpiredData();
    console.log(`[Data Retention Job] Anonymized ${anonymizedCount} expired quest completions`);
    
    // Add other data retention tasks here
    // For example:
    // - Anonymize old user activity logs
    // - Delete expired verification records
    // - Archive old consent change history
    
    // Disconnect from database
    await mongoose.disconnect();
    console.log('[Data Retention Job] Completed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('[Data Retention Job] Error:', error);
    
    // Disconnect from database
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    process.exit(1);
  }
};

// If script is run directly
if (require.main === module) {
  enforceDataRetention();
}

module.exports = { enforceDataRetention };