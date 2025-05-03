/**
 * MongoDB initialization script
 * 
 * This script runs automatically when the MongoDB container starts for the first time.
 * It creates the necessary database, collections, indexes, and a default admin user.
 */

// Switch to the application database
db = db.getSiblingDB('social-engagement');

// Create collections with validation schemas
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'passwordHash', 'createdAt'],
      properties: {
        email: {
          bsonType: 'string',
          description: 'Email address, must be unique'
        },
        passwordHash: {
          bsonType: 'string',
          description: 'Hashed password'
        },
        username: {
          bsonType: 'string',
          description: 'Username, must be unique'
        },
        role: {
          enum: ['user', 'admin', 'moderator'],
          description: 'User role'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Creation timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Last update timestamp'
        }
      }
    }
  }
});

db.createCollection('quests', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'description', 'creatorId', 'requirements', 'createdAt'],
      properties: {
        title: {
          bsonType: 'string',
          description: 'Quest title'
        },
        description: {
          bsonType: 'string',
          description: 'Quest description'
        },
        creatorId: {
          bsonType: 'objectId',
          description: 'ID of the quest creator'
        },
        requirements: {
          bsonType: 'array',
          description: 'List of quest completion requirements',
          items: {
            bsonType: 'object',
            required: ['type', 'data'],
            properties: {
              type: {
                enum: ['social_post', 'website_visit', 'content_creation', 'smart_contract_interaction'],
                description: 'Type of quest requirement'
              },
              data: {
                bsonType: 'object',
                description: 'Requirement specific data'
              }
            }
          }
        },
        rewards: {
          bsonType: 'array',
          description: 'List of quest rewards',
          items: {
            bsonType: 'object',
            required: ['type', 'data'],
            properties: {
              type: {
                enum: ['token', 'badge', 'points', 'nft'],
                description: 'Type of reward'
              },
              data: {
                bsonType: 'object',
                description: 'Reward specific data'
              }
            }
          }
        },
        status: {
          enum: ['draft', 'active', 'completed', 'cancelled'],
          description: 'Quest status'
        },
        startDate: {
          bsonType: 'date',
          description: 'Quest start date'
        },
        endDate: {
          bsonType: 'date',
          description: 'Quest end date'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Creation timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Last update timestamp'
        }
      }
    }
  }
});

db.createCollection('questCompletions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'questId', 'status', 'createdAt'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'ID of the user completing the quest'
        },
        questId: {
          bsonType: 'objectId',
          description: 'ID of the quest being completed'
        },
        status: {
          enum: ['in_progress', 'submitted', 'verified', 'rejected'],
          description: 'Status of quest completion'
        },
        requirementsCompleted: {
          bsonType: 'array',
          description: 'List of completed requirements',
          items: {
            bsonType: 'object',
            required: ['requirementId', 'completedAt', 'evidence'],
            properties: {
              requirementId: {
                bsonType: 'string',
                description: 'ID of the requirement'
              },
              completedAt: {
                bsonType: 'date',
                description: 'Timestamp of completion'
              },
              evidence: {
                bsonType: 'object',
                description: 'Evidence of completion'
              }
            }
          }
        },
        rewardsIssued: {
          bsonType: 'array',
          description: 'List of issued rewards',
          items: {
            bsonType: 'object',
            required: ['rewardId', 'issuedAt', 'transactionId'],
            properties: {
              rewardId: {
                bsonType: 'string',
                description: 'ID of the reward'
              },
              issuedAt: {
                bsonType: 'date',
                description: 'Timestamp of issuance'
              },
              transactionId: {
                bsonType: 'string',
                description: 'Blockchain transaction ID for the reward'
              }
            }
          }
        },
        verificationData: {
          bsonType: 'object',
          description: 'Data related to verification'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Creation timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Last update timestamp'
        }
      }
    }
  }
});

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true, sparse: true });
db.users.createIndex({ createdAt: 1 });

db.quests.createIndex({ creatorId: 1 });
db.quests.createIndex({ status: 1 });
db.quests.createIndex({ createdAt: 1 });
db.quests.createIndex({ startDate: 1, endDate: 1 });

db.questCompletions.createIndex({ userId: 1, questId: 1 }, { unique: true });
db.questCompletions.createIndex({ questId: 1 });
db.questCompletions.createIndex({ status: 1 });
db.questCompletions.createIndex({ createdAt: 1 });

// Check if the admin user already exists to avoid duplicate entries
const adminExists = db.users.findOne({ email: 'admin@example.com' });

if (!adminExists) {
  // Create admin user (password would be hashed in a real application)
  // This is just for demo purposes - in production, use bcrypt to hash passwords
  db.users.insertOne({
    email: 'admin@example.com',
    username: 'admin',
    passwordHash: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.7.B91UpkLr4QeVZQfFXxL1oh.UJvS3K', // bcrypt hash for 'adminpassword123'
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  print('Created admin user: admin@example.com');
}

print('Database initialization completed successfully');