import React from 'react';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
}

const MenuIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

const SearchIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenSearch }) => {
  return (
    <header className="flex-shrink-0 flex items-center justify-between h-20 px-4 md:px-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button 
            onClick={onToggleSidebar} 
            className="p-2 text-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500 lg:hidden"
            aria-label="Open sidebar"
        >
            <MenuIcon className="h-6 w-6" />
        </button>
        {/* Spacer to push content to the right when sidebar is hidden on lg screens */}
        <div className="hidden lg:flex"></div>
        <div className="flex items-center gap-4">
            <button
                onClick={onOpenSearch}
                className="flex items-center gap-2 p-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Open search"
            >
                <SearchIcon className="h-5 w-5" />
                <span className="hidden md:inline">Search...</span>
                <kbd className="hidden md:inline-block px-2 py-1 text-xs font-sans font-semibold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                    ⌘K
                </kbd>
            </button>
            <ThemeToggle />
        </div>
    </header>
  );
};

export default Header;