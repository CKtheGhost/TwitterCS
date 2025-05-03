require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Import routes
const authRoutes = require('./routes/auth-simple'); // Use simplified auth for initial setup
const userRoutes = require('./routes/users');
const contentRoutes = require('./routes/content');
const engagementRoutes = require('./routes/engagement');
const consentRoutes = require('./routes/consent');
const verificationRoutes = require('./routes/verification');
const questRoutes = require('./routes/quests');

// Import middleware - use simplified versions for initial setup
const rateLimiter = require('./middleware/rateLimiter-simple');
const securityMiddleware = require('./middleware/security');
const { addPrivacyHeaders } = require('./middleware/consent-simple');

// Initialize express app
const app = express();

// For initial setup, make database connection optional
try {
  // Connect to database if available
  connectDB().then(async () => {
    if (process.env.AUTO_MIGRATE === 'true') {
      try {
        console.log('Running database migrations...');
        const { runMigrations } = require('./migrations/migrationManager');
        await runMigrations();
        console.log('Database migrations completed');
      } catch (error) {
        console.error('Error running migrations:', error);
      }
    }
  }).catch(err => {
    // Log but continue even if MongoDB isn't available yet
    console.warn('Warning: MongoDB connection failed. Continuing with in-memory mode.');
    console.warn('Error details:', err.message);
  });
} catch (error) {
  console.warn('Warning: MongoDB connection failed. Continuing with in-memory mode.');
  console.warn('Error details:', error.message);
}

// Security middleware
app.use(helmet()); // Set security HTTP headers
app.use(mongoSanitize()); // Sanitize data against NoSQL Injection
app.use(xss()); // Sanitize data against XSS attacks
app.use(securityMiddleware); // Custom security middleware
app.use(addPrivacyHeaders); // Add privacy information to responses

// General middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' })); // Body parser with size limit
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan('dev')); // Logging

// Apply rate limiting to API routes
app.use('/api', rateLimiter);

// API routes
// Authentication routes with user consent integration
app.use('/api/auth', authRoutes);
// User management routes
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/engagement', engagementRoutes);
// Privacy and consent routes
app.use('/api/consent', consentRoutes);
// Verification routes with ethical data collection
app.use('/api/verify', verificationRoutes);
// Quest routes with verification integration
app.use('/api/quests', questRoutes);

// Privacy policy route
app.get('/privacy', (req, res) => {
  res.status(200).json({
    title: 'Privacy Policy',
    lastUpdated: '2023-05-01',
    content: 'Our platform respects your privacy and only collects data with your explicit consent. For more details, visit our privacy policy page.'
  });
});

// Terms of service route
app.get('/terms', (req, res) => {
  res.status(200).json({
    title: 'Terms of Service',
    lastUpdated: '2023-05-01',
    content: 'By using our platform, you agree to our terms of service which include ethical data collection practices.'
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Import error handling utilities
const { notFoundHandler, errorMiddleware } = require('./utils/errorHandler');

// 404 handler - use the standardized not found handler
app.use(notFoundHandler);

// Global error handling middleware - use the standardized error middleware
app.use(errorMiddleware);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});