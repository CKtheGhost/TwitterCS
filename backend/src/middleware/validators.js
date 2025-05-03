/**
 * Validators Middleware
 * 
 * Implements request validation for API endpoints
 */
const Joi = require('joi');

// Helper function to validate request
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    
    next();
  };
};

// Register validation schema
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  walletAddress: Joi.string().allow('', null)
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Twitter username validation schema
const twitterUsernameSchema = Joi.object({
  twitterUsername: Joi.string().min(1).max(15).required()
});

// Quest validation schema
const questSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).required(),
  type: Joi.string().valid('post', 'comment', 'like', 'share', 'follow', 'invite').required(),
  points: Joi.number().integer().min(1).required(),
  dailyLimit: Joi.number().integer().min(1).required(),
  requirements: Joi.object({
    minWords: Joi.number().integer().min(0),
    minCharacters: Joi.number().integer().min(0),
    minFollowers: Joi.number().integer().min(0),
    specificPlatform: Joi.string()
  }),
  isActive: Joi.boolean(),
  season: Joi.number().integer().min(1),
  validationRules: Joi.object({
    requiresProof: Joi.boolean(),
    proofType: Joi.string().valid('screenshot', 'link', 'text', 'none'),
    autoValidate: Joi.boolean()
  }),
  isRecurring: Joi.boolean()
});

// Quest completion validation schema
const questCompletionSchema = Joi.object({
  // Different proof fields based on quest type
  content: Joi.string(),
  contentId: Joi.string(),
  link: Joi.string().uri(),
  proof: Joi.string(),
  parentContentId: Joi.string(),
  platformName: Joi.string(),
  targetUserId: Joi.string(),
  externalUsername: Joi.string(),
  invitedEmail: Joi.string().email(),
  invitedUserId: Joi.string()
}).min(1); // At least one field is required

// Export validators
exports.validateRegister = validate(registerSchema);
exports.validateLogin = validate(loginSchema);
exports.validateTwitterUsername = validate(twitterUsernameSchema);
exports.validateQuest = validate(questSchema);
exports.validateQuestCompletion = validate(questCompletionSchema);