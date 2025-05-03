# Social Engagement Platform Deployment

This directory contains deployment scripts and configuration for the Social Engagement Platform.

## Prerequisites

- Node.js v20+
- Docker and Docker Compose
- AWS CLI (for production deployment)
- Netlify CLI (for staging deployment)
- MetaMask or other Ethereum wallet with funds on target networks

## Directory Structure

```
deployment/
├── README.md                  # This file
├── deploy-all.sh              # Master deployment script
├── contracts/                 # Smart contract deployment scripts
├── frontend/                  # Frontend deployment scripts
├── backend/                   # Backend deployment scripts
└── ci/                        # CI/CD configuration
```

## Environment Setup

Before deployment, ensure the following environment files are set up:

1. For contracts: `/contracts/.env`
2. For frontend: `/frontend/.env.[environment]`
3. For backend: `/backend/.env.[environment]`

Example environment templates are provided as `.env.example` files in each directory.

## Deployment Instructions

### Quick Start (All Components)

To deploy all components at once:

```bash
# For development environment
./deploy-all.sh development localhost

# For staging environment
./deploy-all.sh staging sepolia

# For production environment
./deploy-all.sh production ethereum
```

### Component-specific Deployment

#### Smart Contracts

```bash
cd ../../contracts

# Install dependencies
npm ci

# Deploy to specific network
npm run deploy:sepolia    # For Sepolia testnet
npm run deploy:mumbai     # For Mumbai testnet
npm run deploy:mainnet    # For Ethereum mainnet
npm run deploy:polygon    # For Polygon mainnet

# Verify contract source code
npm run verify:sepolia -- --contract SocialEngagementCompetition --address <contract_address>
```

#### Frontend

```bash
cd ../scripts/deployment/frontend

# Deploy to specific environment
./deploy.sh development   # For local development
./deploy.sh staging       # For staging (Netlify)
./deploy.sh production    # For production (AWS S3)
```

#### Backend

```bash
cd ../backend

# Deploy to specific environment
./deploy.sh development   # For local development with Docker
./deploy.sh staging       # For staging server
./deploy.sh production    # For production server
```

## CI/CD Integration

The repository includes GitHub Actions workflow files for automated CI/CD:

- `.github/workflows/contracts.yml` - Smart contract testing and deployment
- `.github/workflows/frontend.yml` - Frontend build and deployment
- `.github/workflows/backend.yml` - Backend tests and Docker deployment
- `.github/workflows/integrated-deploy.yml` - Integrated deployment workflow

To trigger a deployment from GitHub:

1. Navigate to the Actions tab in the repository
2. Select the "Integrated Deployment" workflow
3. Click "Run workflow"
4. Select the target environment and contract network
5. Click "Run workflow" to start the deployment

## Post-Deployment Verification

After deployment, verify that all components are working correctly:

1. Contracts: Check deployment at the respective block explorer (Etherscan/PolygonScan)
2. Backend: Verify the API is running with `curl https://api.socialengagement.example.com/health`
3. Frontend: Open the application URL and verify functionality

## Rollback Procedure

In case of deployment issues:

1. Contracts: Cannot be rolled back once deployed. Deploy a new fixed version.
2. Frontend: Revert to the previous deployment in AWS/Netlify console.
3. Backend: Use Docker to revert to the previous image:
   ```bash
   docker-compose stop backend
   docker-compose rm -f backend
   docker-compose up -d backend
   ```

## Troubleshooting

Common issues:

1. **Contract verification fails**: Wait a few minutes and try manual verification.
2. **Frontend deployment issues**: Check AWS/Netlify credentials.
3. **Backend container fails to start**: Check logs with `docker-compose logs backend`.

For more help, refer to the component-specific documentation in each directory.