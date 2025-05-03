const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  console.log("Starting deployment...");
  
  // Get the network configuration
  const network = hre.network.name;
  console.log(`Deploying to ${network}...`);
  
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  // Get treasury address from environment variables or use deployer as default
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  console.log(`Treasury address: ${treasuryAddress}`);
  
  // Deploy SocialToken
  console.log("Deploying SocialToken...");
  const SocialToken = await hre.ethers.getContractFactory("SocialToken");
  const socialToken = await SocialToken.deploy();
  await socialToken.waitForDeployment();
  const socialTokenAddress = await socialToken.getAddress();
  console.log(`SocialToken deployed to: ${socialTokenAddress}`);
  
  // Deploy ContentRegistry
  console.log("Deploying ContentRegistry...");
  const ContentRegistry = await hre.ethers.getContractFactory("ContentRegistry");
  const contentRegistry = await ContentRegistry.deploy(socialTokenAddress);
  await contentRegistry.waitForDeployment();
  const contentRegistryAddress = await contentRegistry.getAddress();
  console.log(`ContentRegistry deployed to: ${contentRegistryAddress}`);
  
  // Deploy Engagement contract
  console.log("Deploying EngagementContract...");
  const EngagementContract = await hre.ethers.getContractFactory("EngagementContract");
  const engagement = await EngagementContract.deploy(contentRegistryAddress, socialTokenAddress);
  await engagement.waitForDeployment();
  const engagementAddress = await engagement.getAddress();
  console.log(`EngagementContract deployed to: ${engagementAddress}`);
  
  // Deploy SocialEngagementCompetition
  console.log("Deploying SocialEngagementCompetition...");
  const SocialEngagementCompetition = await hre.ethers.getContractFactory("SocialEngagementCompetition");
  const competition = await SocialEngagementCompetition.deploy(treasuryAddress);
  await competition.waitForDeployment();
  const competitionAddress = await competition.getAddress();
  console.log(`SocialEngagementCompetition deployed to: ${competitionAddress}`);
  
  // Set quest configurations (examples)
  console.log("Setting up quest configurations...");
  await competition.setQuest(0, 10, 5, true); // Post type: 10 points, 5 daily limit, active
  await competition.setQuest(1, 5, 10, true); // Comment type: 5 points, 10 daily limit, active
  await competition.setQuest(2, 2, 20, true); // Like type: 2 points, 20 daily limit, active
  await competition.setQuest(3, 8, 5, true); // Share type: 8 points, 5 daily limit, active
  await competition.setQuest(4, 15, 3, true); // Follow type: 15 points, 3 daily limit, active
  await competition.setQuest(5, 20, 2, true); // Invite type: 20 points, 2 daily limit, active
  
  // Set prize tiers
  console.log("Setting up prize tiers...");
  const prizeTiers = [
    { position: 1, percentageShare: 3000 }, // 30%
    { position: 2, percentageShare: 2000 }, // 20%
    { position: 3, percentageShare: 1500 }, // 15%
    { position: 10, percentageShare: 500 }, // 5% (positions 4-10)
    { position: 20, percentageShare: 250 }, // 2.5% (positions 11-20)
    { position: 50, percentageShare: 100 }  // 1% (positions 21-50)
  ];
  await competition.setPrizeTiers(prizeTiers);
  
  // Create the first season (optional, can be done by admin later)
  if (network !== "mainnet" && network !== "ethereum" && network !== "polygon") {
    console.log("Creating initial season for testing...");
    await competition.createSeason();
    console.log("Initial season created!");
  }
  
  // Save deployment addresses to file
  const deploymentData = {
    network,
    socialToken: socialTokenAddress,
    contentRegistry: contentRegistryAddress,
    engagement: engagementAddress,
    competition: competitionAddress,
    deployer: deployer.address,
    treasury: treasuryAddress,
    timestamp: new Date().toISOString()
  };
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentPath = path.join(deploymentsDir, `${network}.json`);
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentData, null, 2)
  );
  console.log(`Deployment data saved to ${deploymentPath}`);
  
  // Export ABIs for frontend if specified
  if (process.env.EXPORT_ABIS === 'true') {
    await require('./export-abis').exportAbis(deploymentData);
  }
  
  // Verify contracts if specified and not on local network
  if (process.env.VERIFICATION_ENABLED === 'true' && 
      network !== 'localhost' && 
      network !== 'hardhat') {
    console.log("Waiting for block confirmations before verification...");
    // Wait for blocks to be confirmed before verification
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
      console.log("Verifying SocialToken...");
      await hre.run("verify:verify", {
        address: socialTokenAddress,
        constructorArguments: []
      });
      
      console.log("Verifying ContentRegistry...");
      await hre.run("verify:verify", {
        address: contentRegistryAddress,
        constructorArguments: [socialTokenAddress]
      });
      
      console.log("Verifying EngagementContract...");
      await hre.run("verify:verify", {
        address: engagementAddress,
        constructorArguments: [contentRegistryAddress, socialTokenAddress]
      });
      
      console.log("Verifying SocialEngagementCompetition...");
      await hre.run("verify:verify", {
        address: competitionAddress,
        constructorArguments: [treasuryAddress]
      });
      
      console.log("All contracts verified successfully!");
    } catch (error) {
      console.error("Error during contract verification:", error);
    }
  }
  
  console.log("Deployment completed successfully!");
  return deploymentData;
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };