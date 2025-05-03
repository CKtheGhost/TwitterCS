/**
 * MongoDB Atlas Setup Script
 * This script helps users set up and connect to MongoDB Atlas for the social engagement platform.
 * 
 * Usage: node scripts/setup-mongodb-atlas.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');
const { exec } = require('child_process');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Sample connection string template
const sampleUri = 'mongodb+srv://username:password@cluster.mongodb.net/social-engagement';

// Promisify readline question
function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

/**
 * Clear the console
 */
function clearConsole() {
  console.clear();
}

/**
 * Display the header with ASCII art
 */
function displayHeader() {
  console.log(`
┌───────────────────────────────────────────────────────┐
│       MONGODB ATLAS SETUP FOR SOCIAL ENGAGEMENT       │
│                                                       │
│  This script will guide you through setting up a      │
│  MongoDB Atlas database for your application.         │
└───────────────────────────────────────────────────────┘
  `);
}

/**
 * Display step-by-step instructions for MongoDB Atlas setup
 */
async function displayInstructions() {
  console.log('STEP 1: CREATE A MONGODB ATLAS ACCOUNT');
  console.log('--------------------------------------');
  console.log('1. Go to https://www.mongodb.com/cloud/atlas/register');
  console.log('2. Sign up for a free account or log in if you already have one');
  console.log('3. Choose the "FREE" tier when prompted\n');
  
  await question('Press Enter to continue to the next step...');
  clearConsole();
  displayHeader();
  
  console.log('STEP 2: CREATE A CLUSTER');
  console.log('-------------------------');
  console.log('1. Once logged in, click "Build a Database"');
  console.log('2. Select "FREE" tier for the Shared Cluster');
  console.log('3. Choose a cloud provider (AWS, Google Cloud, or Azure)');
  console.log('4. Select a region closest to your users');
  console.log('5. Click "Create Cluster" (this will take a few minutes to provision)\n');
  
  await question('Press Enter to continue to the next step...');
  clearConsole();
  displayHeader();
  
  console.log('STEP 3: SET UP DATABASE ACCESS');
  console.log('------------------------------');
  console.log('1. While your cluster is being created, click on "Database Access" in the sidebar');
  console.log('2. Click "Add New Database User"');
  console.log('3. Choose "Password" authentication');
  console.log('4. Create a secure username and password (save these somewhere safe!)');
  console.log('5. Select "Read and write to any database" under Database User Privileges');
  console.log('6. Click "Add User"\n');
  
  await question('Press Enter to continue to the next step...');
  clearConsole();
  displayHeader();
  
  console.log('STEP 4: SET UP NETWORK ACCESS');
  console.log('-----------------------------');
  console.log('1. Click on "Network Access" in the sidebar');
  console.log('2. Click "Add IP Address"');
  console.log('3. For development, you can click "Allow Access from Anywhere" (0.0.0.0/0)');
  console.log('   Note: For production, you should restrict to specific IP addresses');
  console.log('4. Click "Confirm"\n');
  
  await question('Press Enter to continue to the next step...');
  clearConsole();
  displayHeader();
  
  console.log('STEP 5: GET YOUR CONNECTION STRING');
  console.log('---------------------------------');
  console.log('1. Go back to the "Database" section and click "Connect" on your cluster');
  console.log('2. Select "Connect your application"');
  console.log('3. Make sure "Node.js" is selected as the driver');
  console.log('4. Copy the connection string provided');
  console.log('5. Replace <password> with your actual password and <dbname> with "social-engagement"\n');
  
  const connectionString = await question('Paste your connection string here (or press Enter to skip): ');
  
  return connectionString.trim();
}

/**
 * Update the .env file with MongoDB Atlas connection string
 * @param {string} connectionString 
 */
async function updateEnvFile(connectionString) {
  if (!connectionString) {
    console.log('\nSkipping .env update since no connection string was provided.');
    return false;
  }
  
  // Validate the connection string format
  if (!connectionString.startsWith('mongodb+srv://')) {
    console.log('\n⚠️ The connection string format doesn\'t look right. It should start with "mongodb+srv://"');
    const proceed = await question('Do you want to proceed anyway? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      return false;
    }
  }
  
  console.log('\nUpdating your .env file with the MongoDB Atlas connection string...');
  
  // Add the sample connection string to the .env file
  try {
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check if MONGODB_URI already exists
      if (envContent.includes('MONGODB_URI=')) {
        console.log('\n.env file already contains MONGODB_URI...');
        
        // Replace the existing MONGODB_URI line
        const search = /MONGODB_URI=.*/;
        const replacement = `MONGODB_URI=${connectionString}`;
        envContent = envContent.replace(search, replacement);
        
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Updated MONGODB_URI in .env file!');
      } else {
        // Add the MongoDB Atlas connection string
        envContent += `\n# MongoDB Atlas connection string\nMONGODB_URI=${connectionString}\n`;
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Added MONGODB_URI to .env file!');
      }
    } else {
      // Create a new .env file if it doesn't exist
      envContent = `# MongoDB Atlas connection string\nMONGODB_URI=${connectionString}\n`;
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Created .env file with MONGODB_URI!');
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error updating .env file: ${error.message}`);
    return false;
  }
}

/**
 * Test the MongoDB Atlas connection
 * @param {string} connectionString 
 */
async function testConnection(connectionString) {
  if (!connectionString) {
    console.log('\nSkipping connection test since no connection string was provided.');
    return false;
  }
  
  console.log('\nTesting connection to MongoDB Atlas...');
  
  try {
    // Set up connection options
    const connectOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    };
    
    // Try to connect
    console.log('Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(connectionString, connectOptions);
    
    console.log(`✅ Successfully connected to MongoDB Atlas!`);
    console.log(`   Connected to database: ${conn.connection.name}`);
    console.log(`   Host: ${conn.connection.host}`);
    
    // Create a test document
    const TestModel = mongoose.model('TestModel', new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now }
    }), 'test_collection');
    
    console.log('\nTesting database operations...');
    
    // Create test document
    const testDoc = await TestModel.create({ 
      name: `Test-${Date.now()}`,
    });
    console.log(`✅ Created test document with ID: ${testDoc._id}`);
    
    // Clean up by dropping the test collection
    await TestModel.collection.drop().catch(() => console.log('Note: No test collection to clean up.'));
    
    // Close the connection
    await mongoose.connection.close();
    console.log('✅ Connection closed. Your MongoDB Atlas setup is working properly!');
    
    return true;
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB Atlas: ${error.message}`);
    console.log('\nPossible issues:');
    console.log('1. Check if your connection string is correct');
    console.log('2. Make sure you\'ve set up the database user correctly');
    console.log('3. Verify that you\'ve configured network access to allow your IP');
    console.log('4. Check if the MongoDB Atlas cluster is fully provisioned');
    
    return false;
  }
}

/**
 * Ask the user if they want to launch the application
 */
async function askToLaunchApp() {
  const launch = await question('\nDo you want to start the application now? (y/n): ');
  
  if (launch.toLowerCase() === 'y') {
    console.log('\nStarting the application...');
    
    // Use child_process to run npm start
    const child = exec('cd .. && npm start', (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error starting the application: ${error.message}`);
        return;
      }
      
      console.log(stdout);
    });
    
    // Pipe output to console
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  } else {
    console.log('\nTo start the application manually, run:');
    console.log('  cd /home/ck/social-engagement-platform/backend');
    console.log('  npm start');
  }
}

/**
 * Main function to run the script
 */
async function main() {
  clearConsole();
  displayHeader();
  
  console.log('This script will guide you through setting up MongoDB Atlas for your social engagement platform.\n');
  
  const connectionString = await displayInstructions();
  
  if (connectionString) {
    const envUpdated = await updateEnvFile(connectionString);
    
    if (envUpdated) {
      const connectionSuccessful = await testConnection(connectionString);
      
      if (connectionSuccessful) {
        await askToLaunchApp();
      } else {
        // If MongoDB Atlas connection failed, run the MongoDB verification script to help debug
        console.log('\nWould you like to run the MongoDB verification script to help diagnose issues?');
        const runVerify = await question('Run verification script? (y/n): ');
        
        if (runVerify.toLowerCase() === 'y') {
          console.log('\nRunning MongoDB verification script...');
          
          const child = exec('node ./verify-mongodb.js', (error, stdout, stderr) => {
            if (error) {
              console.error(`❌ Error running verification script: ${error.message}`);
              return;
            }
          });
          
          // Pipe output to console
          child.stdout.pipe(process.stdout);
          child.stderr.pipe(process.stderr);
        }
      }
    }
  } else {
    console.log('\nNo connection string provided. You can:');
    console.log('1. Edit your .env file manually with the MongoDB Atlas connection string');
    console.log('2. Run this script again when you have your connection string ready');
    console.log('\nExample connection string format:');
    console.log(sampleUri);
  }
  
  console.log('\nThank you for using the MongoDB Atlas setup script!\n');
  
  // Close the readline interface
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error(`❌ An unexpected error occurred: ${error.message}`);
  console.error(error.stack);
  rl.close();
});