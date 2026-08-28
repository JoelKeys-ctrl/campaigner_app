import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Page, User } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onLogout: () => void;
  user: User;
  onOpenSearch: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, setCurrentPage, onLogout, user, onOpenSearch }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Add effect to prevent body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  return (
    <div className="h-screen font-sans flex">
      <Sidebar 
        isOpen={isSidebarOpen} 
        currentPage={currentPage} 
        setCurrentPage={(page) => {
          setCurrentPage(page);
          setIsSidebarOpen(false); // Close sidebar on navigation
        }}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        onLogout={onLogout}
      />
      
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header 
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onOpenSearch={onOpenSearch}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;