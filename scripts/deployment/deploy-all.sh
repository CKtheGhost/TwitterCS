#!/bin/bash
# Master deployment script for all components
# Usage: ./deploy-all.sh [environment] [contract_network]

set -e

# Set current directory to the script directory
cd "$(dirname "$0")"

# Get environment and network from args
ENVIRONMENT=${1:-"development"}
CONTRACT_NETWORK=${2:-"localhost"}

echo "=== Starting deployment of all components ==="
echo "Environment: $ENVIRONMENT"
echo "Contract Network: $CONTRACT_NETWORK"

# 1. Deploy contracts
echo "=== Deploying smart contracts to $CONTRACT_NETWORK ==="
cd ../../contracts
npm ci

# If local development, start a node first
if [ "$CONTRACT_NETWORK" == "localhost" ]; then
  echo "Starting local Hardhat node..."
  npx hardhat node &
  NODE_PID=$!
  
  # Give node time to start
  sleep 5
  
  npm run deploy:local
else
  npm run deploy:$CONTRACT_NETWORK
fi

# Export ABIs to frontend
node scripts/export-abis.js

# 2. Deploy backend
echo "=== Deploying backend for $ENVIRONMENT ==="
cd ../scripts/deployment/backend
bash deploy.sh $ENVIRONMENT

# 3. Deploy frontend
echo "=== Deploying frontend for $ENVIRONMENT ==="
cd ../frontend
bash deploy.sh $ENVIRONMENT

# Kill node if running locally
if [ "$CONTRACT_NETWORK" == "localhost" ] && [ ! -z "$NODE_PID" ]; then
  echo "Stopping local Hardhat node..."
  kill $NODE_PID
fi

echo "=== Deployment completed successfully! ==="