import React from 'react';
import WalletConnect from '../components/WalletConnect';
import TransactionHistory from '../components/TransactionHistory';
import { useWeb3 } from '../hooks/useWeb3';

const TransactionsPage = () => {
  const { account, isConnected } = useWeb3();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="mb-4 md:mb-0">Transaction History</h1>
        <WalletConnect />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <TransactionHistory />
        </div>
        
        <div>
          {isConnected && (
            <div className="card">
              <h3 className="mb-4">Wallet Summary</h3>
              
              <div className="mb-3">
                <div className="text-sm text-secondary-500 mb-1">Your Address</div>
                <div className="font-mono text-sm break-all">{account}</div>
              </div>
              
              <div className="border-t border-secondary-200 pt-3 mt-3">
                <h4 className="font-semibold text-primary-700 mb-2">Transaction Types</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M10 1a6 6 0 00-6 6v.5A4.5 4.5 0 014.5 12h1a.5.5 0 01.5.5V14a.5.5 0 01-.5.5h-1A5.5 5.5 0 010 9V7a7 7 0 0114 0v2a5.5 5.5 0 01-4.5 5.5h-1a.5.5 0 01-.5-.5V12.5a.5.5 0 01.5-.5h1A4.5 4.5 0 0116 7.5V7a6 6 0 00-6-6z" />
                      </svg>
                    </div>
                    <span>Joined Season - Entry fee payment</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span>Completed Quest - Points earned</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M13.5 4.938a7 7 0 11-9.006 1.737c.202-.257.59-.218.793.039.278.352.594.672.943.954.332.269.786-.049.773-.476a5.977 5.977 0 01.572-2.759 6.026 6.026 0 012.486-2.665c.247-.14.55-.016.677.238A6.967 6.967 0 0013.5 4.938zM14 12a4 4 0 01-4 4c-1.913 0-3.52-1.398-3.91-3.182-.093-.429.44-.643.814-.413a4.043 4.043 0 001.601.564c.303.038.531-.24.51-.544a5.975 5.975 0 011.315-4.192.447.447 0 01.431-.16A4.001 4.001 0 0114 12z" />
                      </svg>
                    </div>
                    <span>Claimed Prize - Rewards received</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span>Status Change - Account status update</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
          
          <div className="card mt-6">
            <h3 className="mb-4">Transaction FAQ</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-primary-700">How do I join a season?</h4>
                <p className="text-sm text-secondary-600 mt-1">
                  To join a season, navigate to the Dashboard and click "Join Season". 
                  You'll need to pay the 0.1 ETH entry fee through your connected wallet.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-primary-700">When can I claim my prize?</h4>
                <p className="text-sm text-secondary-600 mt-1">
                  Prizes become available to claim after a season ends. You have 30 days to
                  claim your prize from the Dashboard.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-primary-700">What are gas fees?</h4>
                <p className="text-sm text-secondary-600 mt-1">
                  Gas fees are the transaction costs on the Ethereum network. They're paid in
                  addition to any entry fees or other platform costs.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-primary-700">Why did my transaction fail?</h4>
                <p className="text-sm text-secondary-600 mt-1">
                  Transactions may fail due to insufficient gas, network congestion, or
                  smart contract requirements not being met. Check the error message in your wallet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;