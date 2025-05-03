import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-secondary-200 py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-md bg-primary-600 text-white flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                </svg>
              </div>
              <span className="font-bold text-primary-800">SocialEngage</span>
            </div>
            <p className="text-sm text-secondary-600 mt-2">
              Gamified social engagement on the blockchain
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8">
            <div>
              <h3 className="text-sm font-semibold text-secondary-800 uppercase mb-2">Platform</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-sm text-secondary-600 hover:text-primary-600">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/leaderboard" className="text-sm text-secondary-600 hover:text-primary-600">
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link to="/quests" className="text-sm text-secondary-600 hover:text-primary-600">
                    Quests
                  </Link>
                </li>
                <li>
                  <Link to="/transactions" className="text-sm text-secondary-600 hover:text-primary-600">
                    Transactions
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-secondary-800 uppercase mb-2">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="https://docs.socialengagement.example.com" 
                    className="text-sm text-secondary-600 hover:text-primary-600"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a 
                    href="https://docs.socialengagement.example.com/faq" 
                    className="text-sm text-secondary-600 hover:text-primary-600"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a 
                    href="https://docs.socialengagement.example.com/terms" 
                    className="text-sm text-secondary-600 hover:text-primary-600"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a 
                    href="https://docs.socialengagement.example.com/privacy" 
                    className="text-sm text-secondary-600 hover:text-primary-600"
                  >
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-secondary-800 uppercase mb-2">Connect</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="https://twitter.com/socialengagement" 
                    className="text-sm text-secondary-600 hover:text-primary-600"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a 
                    href="https://discord.gg/socialengagement" 
                    className="text-sm text-secondary-600 hover:text-primary-600"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a 
                    href="https://t.me/socialengagement" 
                    className="text-sm text-secondary-600 hover:text-primary-600"
                  >
                    Telegram
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/socialengagement" 
                    className="text-sm text-secondary-600 hover:text-primary-600"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-secondary-200 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-secondary-500 mb-4 sm:mb-0">
            &copy; {new Date().getFullYear()} Social Engagement Platform. All rights reserved.
          </p>
          
          <div className="flex space-x-6">
            <a 
              href="https://twitter.com/socialengagement" 
              className="text-secondary-500 hover:text-primary-600"
              aria-label="Twitter"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            
            <a 
              href="https://github.com/socialengagement" 
              className="text-secondary-500 hover:text-primary-600"
              aria-label="GitHub"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            
            <a 
              href="https://discord.gg/socialengagement" 
              className="text-secondary-500 hover:text-primary-600"
              aria-label="Discord"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;