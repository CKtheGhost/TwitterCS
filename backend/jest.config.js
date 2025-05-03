module.exports = {
  // Use the Node environment
  testEnvironment: 'node',
  
  // Find test files with these patterns
  testMatch: [
    '**/tests/**/*.test.js',
  ],
  
  // Set up some coverage options
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/'
  ],
  
  // Temporarily disable coverage thresholds while we're setting up MongoDB memory server
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: 80
  //   }
  // },
  
  // Run setupTests.js before each test file
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js']
};