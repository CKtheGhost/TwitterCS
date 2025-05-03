/**
 * Migration 2: Add Verification Fields to User Model
 * 
 * Updates the User model to include the verification fields needed
 * for the ethical verification system.
 */
const mongoose = require('mongoose');
const User = require('../../models/User');

module.exports = {
  /**
   * Apply migration
   */
  up: async () => {
    console.log('Starting migration: Add Verification Fields to User Model');
    
    try {
      // Check if any users already have the verification field
      const usersWithVerification = await User.findOne({ verification: { $exists: true } });
      
      if (usersWithVerification) {
        console.log('Users already have verification field, skipping migration');
        return;
      }
      
      // Add verification field to all users
      const updateResult = await User.updateMany(
        {}, // Match all users
        {
          $set: {
            verification: {
              twitter: {
                verified: false,
                username: null,
                createdAt: null,
                code: null
              }
            },
            isVerified: false,
            riskFactors: {
              failedVerifications: 0,
              lastFailedVerification: null
            }
          }
        }
      );
      
      console.log(`Updated ${updateResult.modifiedCount} user records with verification fields`);
    } catch (error) {
      console.error('Error adding verification fields:', error);
      throw error;
    }
  },
  
  /**
   * Rollback migration
   */
  down: async () => {
    console.log('Rolling back migration: Add Verification Fields to User Model');
    
    try {
      // Remove verification fields from all users
      const updateResult = await User.updateMany(
        {}, // Match all users
        {
          $unset: {
            verification: "",
            isVerified: "",
            riskFactors: ""
          }
        }
      );
      
      console.log(`Removed verification fields from ${updateResult.modifiedCount} user records`);
    } catch (error) {
      console.error('Error removing verification fields:', error);
      throw error;
    }
  }
};