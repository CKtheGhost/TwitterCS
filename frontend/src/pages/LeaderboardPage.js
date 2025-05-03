import React from 'react';
import WalletConnect from '../components/WalletConnect';
import Leaderboard from '../components/Leaderboard';
import { useWeb3 } from '../hooks/useWeb3';

const LeaderboardPage = () => {
  const { getCurrentSeason } = useWeb3();
  const [seasonInfo, setSeasonInfo] = React.useState(null);
  
  React.useEffect(() => {
    const fetchSeasonInfo = async () => {
      try {
        const season = await getCurrentSeason();
        setSeasonInfo(season);
      } catch (error) {
        console.error('Error fetching season info:', error);
      }
    };
    
    fetchSeasonInfo();
  }, [getCurrentSeason]);

  const getSeasonTimeInfo = () => {
    if (!seasonInfo) return '';
    
    const now = new Date();
    const endTime = new Date(seasonInfo.endTime);
    
    if (seasonInfo.state === 2 || seasonInfo.state === 3) {
      return `Season ended on ${endTime.toLocaleDateString()}`;
    }
    
    if (now > endTime) {
      return 'Season has ended';
    }
    
    const diff = endTime - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `Season ends in ${days} days and ${hours} hours`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="mb-1">Season Leaderboard</h1>
          {seasonInfo && (
            <p className="text-secondary-600">{getSeasonTimeInfo()}</p>
          )}
        </div>
        <WalletConnect />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Leaderboard />
        </div>
        <div>
          <div className="card">
            <h3 className="mb-4">Leaderboard Info</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-primary-700 mb-2">Prize Distribution</h4>
                <ul className="space-y-2">
                  <li className="flex justify-between items-center">
                    <span>1st Place</span>
                    <span className="font-medium">40%</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>2nd Place</span>
                    <span className="font-medium">25%</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>3rd Place</span>
                    <span className="font-medium">15%</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>4th-10th Place</span>
                    <span className="font-medium">20% (shared)</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-primary-700 mb-2">Prize Pool</h4>
                {seasonInfo ? (
                  <p className="text-2xl font-bold text-primary-600">{seasonInfo.prizePool} ETH</p>
                ) : (
                  <div className="h-8 bg-secondary-200 rounded animate-pulse"></div>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold text-primary-700 mb-2">Claiming Prizes</h4>
                <p className="text-sm text-secondary-600">
                  Once a season ends, winners can claim their prizes through the dashboard.
                  Prizes must be claimed within 30 days of season end.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;