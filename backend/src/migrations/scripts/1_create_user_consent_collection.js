/**
 * Migration 1: Create UserConsent Collection
 * 
 * Creates the user_consents collection and adds initial consent records
 * for all existing users.
 */
const mongoose = require('mongoose');
const User = require('../../models/User');
const UserConsent = require('../../models/UserConsent');

module.exports = {
  /**
   * Apply migration
   */
  up: async () => {
    console.log('Starting migration: Create UserConsent Collection');
    
    // Check if the collection exists
    const collections = await mongoose.connection.db.listCollections({ name: 'userconsents' }).toArray();
    
    if (collections.length > 0) {
      console.log('UserConsents collection already exists');
      return;
    }
    
    // Get the current consent version from environment variables
    const CONSENT_VERSION = process.env.CONSENT_VERSION || '1.0.0';
    
    // Find all users
    const users = await User.find();
    console.log(`Found ${users.length} users to create consent records for`);
    
    // Create default consent record for each user
    const consentPromises = users.map(user => {
      const defaultConsent = new UserConsent({
        user: user._id,
        socialVerification: {
          twitter: {
            enabled: false,
            lastUpdated: new Date(),
            consentVersion: CONSENT_VERSION
          }
        },
        dataUsage: {
          engagementMetrics: {
            enabled: false,
            lastUpdated: new Date()
          },
          publicProfile: {
            enabled: false,
            lastUpdated: new Date()
          },
          onChainActivity: {
            enabled: false,
            lastUpdated: new Date()
          }
        },
        communications: {
          email: {
            enabled: false,
            frequency: 'important',
            lastUpdated: new Date()
          },
          platform: {
            enabled: true,
            lastUpdated: new Date()
          }
        },
        marketing: {
          analytics: {
            enabled: false,
            lastUpdated: new Date()
          },
          thirdParty: {
            enabled: false,
            lastUpdated: new Date()
          }
        },
        consentHistory: [
          {
            changeType: 'create',
            category: 'initial_setup',
            enabled: true,
            timestamp: new Date(),
            requestInfo: {
              source: 'migration',
              timestamp: new Date()
            }
          }
        ]
      });
      
      return defaultConsent.save();
    });
    
    await Promise.all(consentPromises);
    console.log('Successfully created consent records for all users');
  },
  
  /**
   * Rollback migration
   */
  down: async () => {
    console.log('Rolling back migration: Create UserConsent Collection');
    
    try {
      // Delete the user_consents collection
      await mongoose.connection.db.dropCollection('userconsents');
      console.log('Successfully dropped UserConsents collection');
    } catch (error) {
      if (error.message.includes('ns not found')) {
        console.log('UserConsents collection does not exist, nothing to rollback');
      } else {
        throw error;
      }
    }
  }
};