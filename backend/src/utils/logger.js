/**
 * Logger utility for consistent logging across the application
 * 
 * Features:
 * - Environment-specific logging (development, staging, production)
 * - Log levels (error, warn, info, debug)
 * - Structured logging in production (JSON format)
 * - Console output in development (formatted for readability)
 * - File output for persistent logs
 * - Redaction of sensitive information
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Get log level from environment variable or use defaults
const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  const configuredLevel = process.env.LOG_LEVEL;
  
  if (configuredLevel) {
    return configuredLevel.toLowerCase();
  }
  
  // Default log levels by environment
  switch (env) {
    case 'production':
      return 'warn'; // Less verbose in production
    case 'staging':
      return 'info';
    case 'test':
      return 'error'; // Only errors during tests
    default:
      return 'debug'; // Most verbose in development
  }
};

// Define log formats
const formats = {
  // Development format - colorized and readable
  development: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
    })
  ),
  
  // Production format - JSON for machine parsing
  production: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
};

// Function to redact sensitive information
const redactSensitive = winston.format((info) => {
  if (info.user && info.user.password) {
    info.user.password = '[REDACTED]';
  }
  if (info.token) {
    info.token = '[REDACTED]';
  }
  if (info.apiKey) {
    info.apiKey = '[REDACTED]';
  }
  if (info.jwt) {
    info.jwt = '[REDACTED]';
  }
  
  // Redact authentication headers if present
  if (info.headers && info.headers.authorization) {
    info.headers.authorization = '[REDACTED]';
  }
  
  return info;
});

// Select appropriate format based on environment
const logFormat = process.env.NODE_ENV === 'production' 
  ? formats.production
  : formats.development;

// Create a logger instance
const logger = winston.createLogger({
  level: getLogLevel(),
  format: winston.format.combine(
    redactSensitive(),
    logFormat
  ),
  defaultMeta: { 
    service: 'social-engagement-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  ]
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console());
}

// Add audit logging
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'social-engagement-api',
    type: 'audit',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'audit.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    })
  ]
});

/**
 * Log an audit event (user actions, system changes, etc)
 * @param {string} action - The action being performed
 * @param {string} userId - ID of the user performing the action (if applicable)
 * @param {Object} details - Additional details about the action
 * @param {string} resource - The resource being acted upon
 */
const logAudit = (action, userId, details, resource) => {
  if (process.env.AUDIT_LOG_ENABLED !== 'true') {
    return;
  }
  
  auditLogger.info({
    action,
    userId,
    resource,
    details,
    timestamp: new Date().toISOString()
  });
};

// Custom log method for request/response logging
logger.logRequest = (req, res, responseTime, meta = {}) => {
  if (req.path === '/health') {
    return; // Skip health check logging
  }
  
  // Create a log entry with request and response details
  const logEntry = {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    ...meta
  };
  
  // Log at appropriate level based on status code
  if (res.statusCode >= 500) {
    logger.error('Request failed', logEntry);
  } else if (res.statusCode >= 400) {
    logger.warn('Request error', logEntry);
  } else {
    logger.info('Request completed', logEntry);
  }
};

// Helper for child loggers with context
logger.child = (metadata) => {
  return winston.createLogger({
    level: logger.level,
    format: logger.format,
    defaultMeta: { ...logger.defaultMeta, ...metadata },
    transports: logger.transports
  });
};

// Export the logger instance as the default export
module.exports = logger;