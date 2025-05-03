import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Components
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ConsentBanner from './components/privacy/ConsentBanner';

// Pages
import Dashboard from './pages/Dashboard';
import LeaderboardPage from './pages/LeaderboardPage';
import QuestsPage from './pages/QuestsPage';
import TransactionsPage from './pages/TransactionsPage';
import PrivacySettingsPage from './pages/PrivacySettingsPage';
import AccountVerificationPage from './pages/AccountVerificationPage';
import NotFound from './pages/NotFound';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/privacy-settings" element={<PrivacySettingsPage />} />
          <Route path="/verify" element={<AccountVerificationPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      
      {/* Consent Banner - shows when consent setup is needed */}
      <ConsentBanner />
    </div>
  );
}

export default App;