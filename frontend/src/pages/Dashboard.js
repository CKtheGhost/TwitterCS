import React from 'react';
import WalletConnect from '../components/WalletConnect';
import SeasonInfo from '../components/SeasonInfo';
import ParticipantStats from '../components/ParticipantStats';
import { useWeb3 } from '../hooks/useWeb3';

const Dashboard = () => {
  const { isConnected } = useWeb3();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="mb-4 md:mb-0">Social Engagement Dashboard</h1>
        <WalletConnect />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <SeasonInfo />
        </div>
        <div>
          <ParticipantStats />
        </div>
      </div>

      {isConnected ? (
        <div className="mt-6 bg-primary-50 border border-primary-200 rounded-lg p-4 text-primary-800">
          <h4 className="font-semibold mb-2">Quick Tips</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Complete quests daily to maximize your score</li>
            <li>Check the leaderboard to see your ranking</li>
            <li>Prizes are distributed at the end of each season</li>
            <li>Suspicious activity may result in flagging</li>
          </ul>
        </div>
      ) : (
        <div className="mt-6 bg-secondary-50 border border-secondary-200 rounded-lg p-4 text-secondary-800">
          <h4 className="font-semibold mb-2">Welcome to the Social Engagement Platform</h4>
          <p className="mb-2">
            Connect your MetaMask wallet to join the current season, compete with others,
            and earn rewards based on your social engagement.
          </p>
          <p>
            Each season lasts 7 days and requires a 0.1 ETH entry fee, with 97% going
            to the prize pool and 3% to platform fees.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;