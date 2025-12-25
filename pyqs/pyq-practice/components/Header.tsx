import React from 'react';

interface HeaderProps {
  toggleTheme: () => void;
  isDark: boolean;
  onHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleTheme, isDark, onHome }) => {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/75 dark:bg-gray-900/75 border-b border-gray-200 dark:border-gray-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer" onClick={onHome}>
            <i className="fa-solid fa-graduation-cap text-primary-600 text-2xl mr-2"></i>
            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
              PYQ<span className="text-primary-600">Practice</span>
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? (
                <i className="fa-solid fa-sun text-yellow-400 text-lg"></i>
              ) : (
                <i className="fa-solid fa-moon text-gray-600 text-lg"></i>
              )}
            </button>
            <div className="hidden md:flex items-center space-x-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              <span>IIT Madras Online Degree</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;