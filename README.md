# Social Engagement Platform

A decentralized social media platform that integrates blockchain technology for content ownership, engagement tracking, and tokenized rewards.

## Project Structure

```
social-engagement-platform/
├── backend/              # Express.js backend API
├── contracts/            # Ethereum smart contracts
├── docs/                 # Documentation
├── frontend/             # React.js web application
├── scripts/              # Deployment and utility scripts
└── tests/                # Integration and end-to-end tests
```

## Smart Contracts

The platform uses Ethereum smart contracts to manage:

- Social Tokens (ERC20) for rewards and platform governance
- Content Registry for tracking ownership and authenticity
- Engagement tracking for likes, comments, and shares

## Features

- User authentication with web2 (email/password) and web3 (wallet connection)
- Content creation with blockchain verification
- Social interactions (following users, likes, comments, shares)
- Token rewards for content creation and engagement
- User profile management
- Content discovery and feed algorithms

## Technology Stack

- **Frontend**: React.js, Ethers.js
- **Backend**: Node.js, Express, MongoDB
- **Blockchain**: Ethereum, Solidity, Hardhat
- **Storage**: IPFS or other decentralized storage (for content media)

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB
- Ethereum development environment (Hardhat)
- MetaMask or other web3 wallet

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/social-engagement-platform.git
   cd social-engagement-platform
   ```

2. Install dependencies for all packages
   ```
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install

   # Install contract dependencies
   cd ../contracts
   npm install
   ```

3. Set up environment variables
   - Create `.env` files in both `frontend/` and `backend/` directories
   - See `.env.example` in each directory for required variables

4. Compile and deploy smart contracts
   ```
   cd contracts
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network localhost
   ```

5. Start the development environment
   ```
   # Start local blockchain
   npx hardhat node
   
   # In a new terminal, start backend
   cd backend
   npm run dev
   
   # In a new terminal, start frontend
   cd frontend
   npm start
   ```

## Development Workflow

1. Start by deploying contracts to a local or test network
2. Update contract addresses in the backend `.env` file
3. Develop backend API endpoints
4. Connect frontend to backend and smart contracts

## Testing

```
# Run contract tests
cd contracts
npx hardhat test

# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## Deployment

See `docs/deployment.md` for detailed deployment instructions.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.