/**
 * MongoDB Quick Start Script for Social Engagement Platform
 * This script helps users quickly set up MongoDB for development
 * 
 * Usage: node scripts/quick-start-mongodb.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline.question
function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

/**
 * Display ASCII art header
 */
function displayHeader() {
  console.log(`
┌─────────────────────────────────────────────────────────┐
│   MONGODB QUICK START FOR SOCIAL ENGAGEMENT PLATFORM    │
│                                                         │
│   This script will help you quickly set up MongoDB      │
│   for your development environment.                     │
└─────────────────────────────────────────────────────────┘
  `);
}

/**
 * Check if MongoDB is installed locally
 */
async function checkMongoDBInstalled() {
  try {
    const { stdout } = await execAsync('mongod --version');
    if (stdout.includes('db version')) {
      const version = stdout.match(/db version v([\d.]+)/)[1];
      return { installed: true, version };
    }
  } catch (error) {
    return { installed: false };
  }
}

/**
 * Check if Docker is installed
 */
async function checkDockerInstalled() {
  try {
    const { stdout } = await execAsync('docker --version');
    if (stdout.includes('Docker version')) {
      const version = stdout.match(/Docker version ([\d.]+)/)[1];
      return { installed: true, version };
    }
  } catch (error) {
    return { installed: false };
  }
}

/**
 * Check if Docker Compose is installed
 */
async function checkDockerComposeInstalled() {
  try {
    const { stdout } = await execAsync('docker-compose --version');
    if (stdout.includes('docker-compose version')) {
      const version = stdout.match(/docker-compose version ([\d.]+)/)[1];
      return { installed: true, version };
    }
  } catch (error) {
    return { installed: false };
  }
}

/**
 * Check if MongoDB service is running
 */
async function checkMongoDBRunning() {
  try {
    await execAsync('mongo --eval "db.version()" --quiet');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if MongoDB Docker container is running
 */
async function checkMongoDBContainerRunning() {
  try {
    const { stdout } = await execAsync('docker ps --filter "name=mongodb" --format "{{.Names}}"');
    return stdout.trim() === 'mongodb';
  } catch (error) {
    return false;
  }
}

/**
 * Start MongoDB service
 */
async function startMongoDBService() {
  console.log('\nStarting MongoDB service...');
  try {
    // Try using systemctl (for systems using systemd)
    await execAsync('sudo systemctl start mongod');
    console.log('✅ MongoDB service started successfully');
    return true;
  } catch (error) {
    try {
      // Try using service (for older systems)
      await execAsync('sudo service mongod start');
      console.log('✅ MongoDB service started successfully');
      return true;
    } catch (serviceError) {
      console.error('❌ Failed to start MongoDB service:');
      console.error(`   ${serviceError.message}`);
      return false;
    }
  }
}

/**
 * Create a Docker Compose file for MongoDB
 */
function createDockerComposeFile() {
  const dockerComposePath = path.join(__dirname, '..', 'docker-compose.yml');
  
  const dockerComposeContent = `version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=social-engagement
    restart: unless-stopped

volumes:
  mongo_data:
`;

  fs.writeFileSync(dockerComposePath, dockerComposeContent);
  console.log(`✅ Created Docker Compose file at ${dockerComposePath}`);
}

/**
 * Start MongoDB using Docker
 */
async function startMongoDBDocker() {
  console.log('\nStarting MongoDB using Docker...');
  try {
    // Check if docker-compose.yml exists, if not create it
    const dockerComposePath = path.join(__dirname, '..', 'docker-compose.yml');
    if (!fs.existsSync(dockerComposePath)) {
      createDockerComposeFile();
    }
    
    // Start MongoDB container
    await execAsync('cd .. && docker-compose up -d');
    console.log('✅ MongoDB Docker container started successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to start MongoDB Docker container:');
    console.error(`   ${error.message}`);
    return false;
  }
}

/**
 * Update .env file with MongoDB connection string
 */
function updateEnvFile(connectionString) {
  const envPath = path.join(__dirname, '..', '.env');
  
  try {
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check if MONGODB_URI already exists
      if (envContent.includes('MONGODB_URI=')) {
        const search = /MONGODB_URI=.*/;
        const replacement = `MONGODB_URI=${connectionString}`;
        envContent = envContent.replace(search, replacement);
      } else {
        // Add the MongoDB connection string
        envContent += `\n# MongoDB connection string\nMONGODB_URI=${connectionString}\n`;
      }
    } else {
      // Create a new .env file if it doesn't exist
      envContent = `# MongoDB connection string\nMONGODB_URI=${connectionString}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Updated .env file with MongoDB connection string`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update .env file: ${error.message}`);
    return false;
  }
}

/**
 * Verify MongoDB connection
 */
async function verifyMongoDBConnection() {
  console.log('\nVerifying MongoDB connection...');
  try {
    await execAsync('node ./verify-mongodb.js');
    return true;
  } catch (error) {
    console.error('❌ Failed to verify MongoDB connection:');
    console.error(error.message);
    return false;
  }
}

/**
 * Guide for setting up MongoDB Atlas
 */
async function setupMongoDBAtlas() {
  console.log('\nLaunching MongoDB Atlas setup script...');
  try {
    await execAsync('node ./setup-mongodb-atlas.js');
    return true;
  } catch (error) {
    console.error('❌ Failed to launch MongoDB Atlas setup script:');
    console.error(error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  displayHeader();
  
  console.log('Checking your environment...');
  
  // Check if MongoDB is installed
  const mongoDBStatus = await checkMongoDBInstalled();
  console.log(`MongoDB installed: ${mongoDBStatus.installed ? `Yes (version ${mongoDBStatus.version})` : 'No'}`);
  
  // Check if Docker is installed
  const dockerStatus = await checkDockerInstalled();
  console.log(`Docker installed: ${dockerStatus.installed ? `Yes (version ${dockerStatus.version})` : 'No'}`);
  
  // Check if Docker Compose is installed
  const dockerComposeStatus = await checkDockerComposeInstalled();
  console.log(`Docker Compose installed: ${dockerComposeStatus.installed ? `Yes (version ${dockerComposeStatus.version})` : 'No'}`);
  
  // Check if MongoDB service is running
  let mongoDBRunning = false;
  if (mongoDBStatus.installed) {
    mongoDBRunning = await checkMongoDBRunning();
    console.log(`MongoDB service running: ${mongoDBRunning ? 'Yes' : 'No'}`);
  }
  
  // Check if MongoDB Docker container is running
  let mongoDBContainerRunning = false;
  if (dockerStatus.installed) {
    mongoDBContainerRunning = await checkMongoDBContainerRunning();
    console.log(`MongoDB Docker container running: ${mongoDBContainerRunning ? 'Yes' : 'No'}`);
  }
  
  // Determine available options
  const options = [];
  
  if (mongoDBStatus.installed && !mongoDBRunning) {
    options.push('1. Start local MongoDB service');
  }
  
  if (dockerStatus.installed && dockerComposeStatus.installed && !mongoDBContainerRunning) {
    options.push('2. Start MongoDB using Docker');
  }
  
  options.push('3. Configure MongoDB Atlas (cloud)');
  
  if (mongoDBRunning || mongoDBContainerRunning) {
    options.push('4. Verify MongoDB connection');
  }
  
  options.push('5. Skip setup (manual configuration)');
  
  // Display options
  console.log('\nAvailable options:');
  options.forEach(option => console.log(option));
  
  // Get user choice
  const choice = await question('\nEnter your choice (1-5): ');
  
  // Process user choice
  switch (choice) {
    case '1':
      if (await startMongoDBService()) {
        updateEnvFile('mongodb://localhost:27017/social-engagement');
        await verifyMongoDBConnection();
      }
      break;
    case '2':
      if (await startMongoDBDocker()) {
        updateEnvFile('mongodb://localhost:27017/social-engagement');
        await verifyMongoDBConnection();
      }
      break;
    case '3':
      await setupMongoDBAtlas();
      break;
    case '4':
      await verifyMongoDBConnection();
      break;
    case '5':
      console.log('\nSkipping MongoDB setup. You can configure it manually later.');
      break;
    default:
      console.log('\nInvalid choice. Exiting.');
  }
  
  // Display next steps
  console.log('\n🚀 Next steps:');
  console.log('1. Start your application: npm start');
  console.log('2. Read the MongoDB guide: cat MONGODB_GUIDE.md');
  
  // Close readline interface
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('❌ An unexpected error occurred:');
  console.error(error);
  rl.close();
});