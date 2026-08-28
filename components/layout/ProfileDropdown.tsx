import React, { useState, useEffect, useRef } from 'react';
import ThemeToggle from './ThemeToggle';

interface ProfileDropdownProps {
  onLogout: () => void;
  name: string;
  email: string;
  avatarUrl?: string;
}

const LogoutIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onLogout, name, email, avatarUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFirstName = (fullName: string) => fullName ? fullName.split(' ')[0] : 'User';

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center space-x-3">
        <span className="font-medium text-gray-700 dark:text-gray-300 hidden sm:block text-right">
          Welcome, {getFirstName(name)}
        </span>
        <button onClick={() => setIsOpen(!isOpen)} className="flex items-center">
          <img 
            src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff`} 
            alt="User Avatar" 
            className="h-10 w-10 rounded-full object-cover ring-2 ring-offset-2 ring-offset-white dark:ring-offset-brand-900 ring-brand-500" 
          />
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right bg-white dark:bg-brand-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div>
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{email}</p>
            </div>
            
            <div className="border-t border-gray-200 dark:border-brand-700"></div>

            <div className="px-4 py-2">
                <ThemeToggle />
            </div>
            
            <div className="border-t border-gray-200 dark:border-brand-700"></div>
            
            <div className="p-1">
              <button
                onClick={onLogout}
                className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-700 rounded-md transition-colors"
              >
                <LogoutIcon className="h-5 w-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;