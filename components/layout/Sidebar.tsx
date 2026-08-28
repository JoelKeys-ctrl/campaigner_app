import React from 'react';
import { NAV_ITEMS } from '../../constants';
import { Page, User } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  user: User;
  onLogout: () => void;
}

const RocketIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 2.18a14.98 14.98 0 00-2.17 6.16m5.84 2.58v-4.8m-5.84 4.8m5.84-4.8L9.63 2.18m-2.17 6.16a14.98 14.98 0 00-6.16 12.12 14.98 14.98 0 0012.12 6.16" />
    </svg>
);

const CloseIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const LogoutIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);


const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentPage, setCurrentPage, user, onLogout }) => {
  return (
    <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between h-20 border-b border-gray-200 dark:border-gray-700 px-4">
        <div className="flex items-center">
            <RocketIcon className="h-8 w-8 text-brand-500" />
            <h1 className="text-2xl font-bold ml-3 text-gray-800 dark:text-white">Campaigner</h1>
        </div>
        <button 
            onClick={onClose} 
            className="p-2 lg:hidden text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close sidebar"
        >
            <CloseIcon className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-grow px-4 py-6">
        <ul>
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setCurrentPage(item.id)}
                className={`flex items-center w-full px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${
                  currentPage === item.id
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="mr-4">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <img 
            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`} 
            alt="User Avatar" 
            className="h-10 w-10 rounded-full object-cover" 
          />
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <LogoutIcon className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-500">
          <p>&copy; 2024 Campaigner Pro</p>
      </div>
    </div>
  );
};

export default Sidebar;