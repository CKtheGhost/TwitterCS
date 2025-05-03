const fs = require("fs");
const path = require("path");

/**
 * Exports ABI files to the frontend directory for easy access
 * @param {Object} deploymentData The deployment data with contract addresses
 */
async function exportAbis(deploymentData = null) {
  console.log("Exporting contract ABIs...");
  
  // Define contracts to export
  const contracts = [
    "SocialToken",
    "ContentRegistry",
    "EngagementContract",
    "SocialEngagementCompetition"
  ];
  
  // Set up paths
  const artifactsDir = path.join(__dirname, "../artifacts/contracts");
  const frontendAbiDir = path.join(__dirname, "../../frontend/src/utils/abis");
  
  // Create frontend ABI directory if it doesn't exist
  if (!fs.existsSync(frontendAbiDir)) {
    fs.mkdirSync(frontendAbiDir, { recursive: true });
  }
  
  // Export each contract's ABI
  for (const contract of contracts) {
    try {
      // Determine source path based on contract name
      let sourcePath;
      if (contract === "SocialEngagementCompetition") {
        sourcePath = path.join(artifactsDir, `${contract}.sol/${contract}.json`);
      } else {
        sourcePath = path.join(artifactsDir, `../`, `${contract}.sol/${contract}.json`);
      }
      
      // Read the artifact file
      const artifact = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
      
      // Extract ABI
      const abi = artifact.abi;
      
      // Write ABI to frontend directory
      const targetPath = path.join(frontendAbiDir, `${contract}.json`);
      fs.writeFileSync(targetPath, JSON.stringify(abi, null, 2));
      
      console.log(`Exported ${contract} ABI to ${targetPath}`);
    } catch (error) {
      console.error(`Error exporting ABI for ${contract}:`, error);
    }
  }
  
  // If deployment data is provided, create a contract-addresses.json file
  if (deploymentData) {
    const addresses = {
      network: deploymentData.network,
      socialToken: deploymentData.socialToken,
      contentRegistry: deploymentData.contentRegistry,
      engagement: deploymentData.engagement,
      competition: deploymentData.competition
    };
    
    const addressesPath = path.join(frontendAbiDir, "contract-addresses.json");
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
    console.log(`Exported contract addresses to ${addressesPath}`);
  }
  
  console.log("ABI export completed!");
}

// Run as standalone script if invoked directly
if (require.main === module) {
  // If running directly, try to use the most recent deployment file
  const deploymentsDir = path.join(__dirname, "../deployments");
  let deploymentData = null;
  
  if (fs.existsSync(deploymentsDir)) {
    const files = fs.readdirSync(deploymentsDir);
    if (files.length > 0) {
      // Get the most recent deployment file
      const latestFile = files
        .filter(f => f.endsWith('.json'))
        .map(f => ({
          name: f,
          time: fs.statSync(path.join(deploymentsDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time)[0]?.name;
      
      if (latestFile) {
        deploymentData = JSON.parse(
          fs.readFileSync(path.join(deploymentsDir, latestFile), "utf8")
        );
        console.log(`Using deployment data from ${latestFile}`);
      }
    }
  }
  
  exportAbis(deploymentData)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { exportAbis };