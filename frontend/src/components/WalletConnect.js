import React from 'react';
import { useWeb3 } from '../hooks/useWeb3';

const WalletConnect = () => {
  const { 
    account, 
    isConnected, 
    chainId, 
    networkName,
    connectionError,
    connectWallet, 
    disconnectWallet 
  } = useWeb3();

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="flex items-center">
      {connectionError && (
        <div className="mr-4 text-red-500 text-sm">
          <span className="font-medium">Error:</span> {connectionError}
        </div>
      )}
      
      {isConnected ? (
        <div className="flex items-center">
          <div className="mr-4 text-sm">
            <span className="font-medium text-secondary-600">Connected to:</span>{' '}
            <span className="text-primary-600">{networkName || `Chain ID: ${chainId}`}</span>
          </div>
          <div className="px-3 py-1 bg-secondary-100 rounded-md mr-2 flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm font-medium">{formatAddress(account)}</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="btn-secondary text-sm py-1"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          className="btn-primary text-sm"
        >
          Connect MetaMask
        </button>
      )}
    </div>
  );
};

export default WalletConnect;