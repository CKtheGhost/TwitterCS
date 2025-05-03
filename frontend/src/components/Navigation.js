import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useWeb3 } from '../hooks/useWeb3';

const Navigation = () => {
  const { isConnected } = useWeb3();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navigation = [
    { name: 'Dashboard', path: '/' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Quests', path: '/quests' },
    { name: 'Transactions', path: '/transactions' },
  ];

  const userMenu = [
    { name: 'Verify Accounts', path: '/verify' },
    { name: 'Privacy Settings', path: '/privacy-settings' },
  ];

  // Using NavLink's isActive prop instead of this function

  return (
    <nav className="bg-white shadow-sm border-b border-secondary-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center" onClick={closeMobileMenu}>
              <div className="h-8 w-8 rounded-md bg-primary-600 text-white flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                </svg>
              </div>
              <span className="font-bold text-primary-800">SocialEngage</span>
            </Link>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) => 
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-primary-500 text-primary-700'
                        : 'border-transparent text-secondary-600 hover:border-secondary-300 hover:text-secondary-800'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
          
          <div className="flex items-center">
            {isConnected && (
              <div className="hidden sm:flex items-center">
                <span className="mr-3 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  Connected
                </span>
                
                <div className="relative inline-block text-left ml-2">
                  <div>
                    <button
                      type="button"
                      className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      id="menu-button"
                      aria-expanded="true"
                      aria-haspopup="true"
                      onClick={() => {
                        const dropdown = document.getElementById('user-dropdown');
                        if (dropdown) {
                          dropdown.classList.toggle('hidden');
                        }
                      }}
                    >
                      Account
                      <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <div
                    id="user-dropdown"
                    className="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                    tabIndex="-1"
                  >
                    <div className="py-1" role="none">
                      {userMenu.map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100"
                          role="menuitem"
                          tabIndex="-1"
                          onClick={() => {
                            const dropdown = document.getElementById('user-dropdown');
                            if (dropdown) {
                              dropdown.classList.add('hidden');
                            }
                          }}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-secondary-500 hover:text-primary-600 hover:bg-secondary-100 focus:outline-none"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive
                    ? 'border-primary-500 text-primary-700 bg-primary-50'
                    : 'border-transparent text-secondary-600 hover:bg-secondary-50 hover:border-secondary-300 hover:text-secondary-800'
                }`
              }
              onClick={closeMobileMenu}
            >
              {item.name}
            </NavLink>
          ))}
        </div>
        
        {isConnected && (
          <div className="pt-4 pb-3 border-t border-secondary-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-secondary-800">Connected Wallet</div>
                <div className="text-sm font-medium text-green-600">Active</div>
              </div>
            </div>
            
            <div className="mt-3 space-y-1">
              {userMenu.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) => 
                    `block px-4 py-2 text-base font-medium ${
                      isActive
                        ? 'text-primary-700 bg-primary-50'
                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-800'
                    }`
                  }
                  onClick={closeMobileMenu}
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;