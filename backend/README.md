# Backend API for Social Engagement Platform

This directory contains the Express.js API server for the social engagement platform.

## Features

- User authentication and authorization
- Content management
- Social interactions (likes, comments, shares)
- Blockchain integration
- Token and wallet management

## Technology Stack

- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Ethers.js for blockchain interaction
- RESTful API architecture

## Directory Structure

```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── models/           # Database models
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── config/           # Configuration files
│   └── server.js         # Express application
├── .env                  # Environment variables (not in repo)
└── package.json          # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- Ethereum node access (Infura, Alchemy, or local)

### Installation

```bash
# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the backend directory with the following variables:

```
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/social-platform

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d

# Blockchain
BLOCKCHAIN_RPC_URL=https://goerli.infura.io/v3/your_infura_key
PRIVATE_KEY=your_private_key_for_server_wallet
SOCIAL_TOKEN_ADDRESS=0x...
CONTENT_REGISTRY_ADDRESS=0x...
ENGAGEMENT_CONTRACT_ADDRESS=0x...
```

### Running the Server

```bash
# Development with nodemon
npm run dev

# Production
npm start
```

The API will be available at http://localhost:5000.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in a user
- `GET /api/auth/me` - Get current user info

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a specific user
- `PUT /api/users/:id` - Update user information
- `GET /api/users/:id/content` - Get user's content
- `GET /api/users/:id/engagements` - Get user's engagements

### Content

- `POST /api/content` - Create new content
- `GET /api/content` - Get all content (with pagination and filters)
- `GET /api/content/:id` - Get a specific content item
- `PUT /api/content/:id` - Update content
- `DELETE /api/content/:id` - Delete content
- `GET /api/content/:id/engagements` - Get content engagements

### Engagement

- `POST /api/engagement/like/:contentId` - Like content
- `DELETE /api/engagement/like/:contentId` - Unlike content
- `POST /api/engagement/comment/:contentId` - Comment on content
- `PUT /api/engagement/comment/:commentId` - Update comment
- `DELETE /api/engagement/comment/:commentId` - Delete comment
- `POST /api/engagement/share/:contentId` - Share content

### Blockchain Integration

- `GET /api/blockchain/balance/:address` - Get token balance
- `POST /api/blockchain/mint` - Mint tokens (admin only)
- `GET /api/blockchain/content/:id` - Get on-chain content data

## Database Models

### User

- Authentication info
- Profile data
- Wallet address
- Token balance
- Relationships (following/followers)

### Content

- Creator
- Content data
- Metadata
- Blockchain references
- Visibility settings

### Engagement

- User reference
- Content reference
- Engagement type (like, comment, share)
- Comment data
- Timestamps

## Blockchain Integration

The `web3Service.js` file handles interaction with the blockchain:

- Connection to Ethereum network
- Smart contract interaction
- Content verification
- Token management

## Error Handling

Centralized error handling middleware with appropriate HTTP status codes.

## Authentication and Authorization

JWT-based authentication with role-based authorization for protected routes.

## Testing

```bash
# Run tests
npm test
```

## License

MIT