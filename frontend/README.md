# Frontend for Social Engagement Platform

This directory contains the React.js web application for the social engagement platform.

## Features

- User authentication (both traditional and web3 wallet)
- Content creation and consumption
- Social interactions (likes, comments, shares)
- User profiles and following system
- Blockchain integration for content ownership and rewards
- Token management and wallet connection

## Technology Stack

- React.js
- React Router for navigation
- Context API for state management
- Ethers.js for blockchain interaction
- Axios for API requests

## Directory Structure

```
frontend/
├── public/               # Static files
│   └── assets/           # Images and other assets
├── src/                  # Source code
│   ├── components/       # Reusable UI components
│   ├── contexts/         # Context providers (Auth, Web3, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components for routes
│   ├── utils/            # Utility functions and helpers
│   │   └── abis/         # Contract ABIs
│   ├── App.js            # Main application component
│   └── index.js          # Application entry point
└── package.json          # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MetaMask or another web3 wallet extension

### Installation

```bash
# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the frontend directory with the following variables:

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCIAL_TOKEN_ADDRESS=0x...
REACT_APP_CONTENT_REGISTRY_ADDRESS=0x...
REACT_APP_ENGAGEMENT_ADDRESS=0x...
```

### Running the Application

```bash
# Start development server
npm start
```

The application will be available at http://localhost:3000.

### Building for Production

```bash
# Create production build
npm run build
```

## Components

### Core Components

- **Navbar**: Navigation and user account controls
- **ContentCard**: Displays content with engagement options
- **CommentSection**: Nested comment system
- **UserProfile**: User information and stats
- **WalletConnect**: Web3 wallet connection UI

### Pages

- **Home**: News feed of content
- **Profile**: User profile and content
- **ContentDetail**: Single content view with comments
- **Create**: Content creation form
- **Login/Register**: Authentication pages

## Web3 Integration

- Wallet connection via MetaMask
- Token balance display
- On-chain content verification
- Engagement tracking

## State Management

- **AuthContext**: User authentication state
- **Web3Context**: Blockchain connection and contracts
- **ContentContext**: Content state and operations

## Custom Hooks

- **useAuth**: Authentication operations
- **useWeb3**: Blockchain interaction
- **useContent**: Content operations
- **useEngagement**: Engagement operations

## API Integration

API communication is handled via Axios, with endpoints defined in the backend API.

## Testing

```bash
# Run tests
npm test
```

## License

MIT