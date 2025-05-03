# Smart Contracts for Social Engagement Platform

This directory contains the Ethereum smart contracts that power the social engagement platform.

## Contract Overview

- **SocialToken.sol**: ERC20 token implementation for platform rewards and governance.
- **ContentRegistry.sol**: Manages content ownership, metadata, and authenticity verification.
- **EngagementContract.sol**: Tracks user engagement (likes, comments, shares) with content.

## Development Environment

The contracts are developed using:

- Solidity ^0.8.24
- Hardhat development framework
- Ethers.js for testing and deployment scripts

## Directory Structure

```
contracts/
├── contracts/            # Main contract implementations
│   ├── SocialToken.sol
│   ├── ContentRegistry.sol
│   ├── EngagementContract.sol
│   ├── interfaces/       # Contract interfaces
│   ├── libraries/        # Helper libraries
│   └── mocks/            # Mock contracts for testing
├── test/                 # Contract tests
├── scripts/              # Deployment scripts
└── hardhat.config.js     # Hardhat configuration
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile
```

### Testing

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/SocialToken.js
```

### Deployment

To deploy contracts to a local Hardhat network:

```bash
# Start local node
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

For testnet or mainnet deployment:

```bash
# Deploy to testnet (update hardhat.config.js first)
npx hardhat run scripts/deploy.js --network goerli
```

### Contract Verification

To verify contract source code on Etherscan:

```bash
npx hardhat verify --network goerli DEPLOYED_CONTRACT_ADDRESS [CONSTRUCTOR_ARGS]
```

## Contract Design

### SocialToken

- ERC20 compliant token
- Minting and burning controlled by platform
- Used for rewards and governance

### ContentRegistry

- Content registration with ownership verification
- Content metadata storage
- Engagement score calculation

### EngagementContract

- Tracks various types of engagement (likes, comments, shares)
- Associates engagement with content and users
- Supports engagement analytics

## Security Considerations

- Access control using ownership and role-based permissions
- Prevention of common attacks such as reentrancy
- Input validation and error handling

## License

MIT