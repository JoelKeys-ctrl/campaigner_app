import React, { useEffect, useRef } from 'react';
import { Campaign, Contact, EmailTemplate, SearchResults } from '../../types';

// Icons
const SearchIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);
const DocumentTextIcon: React.FC<{className: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
const CollectionIcon: React.FC<{className: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2m14 0H5" />
    </svg>
);
const UsersIcon: React.FC<{className: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" />
  </svg>
);


interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  results: SearchResults;
  onSelect: (item: Campaign | EmailTemplate | Contact, type: 'campaign' | 'template' | 'contact') => void;
}

interface SearchResultItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ icon, title, subtitle, onClick }) => (
  <button onClick={onClick} className="w-full text-left flex items-center p-3 hover:bg-gray-700/50 rounded-md transition-colors duration-150">
    <div className="mr-4 text-gray-400">{icon}</div>
    <div className="overflow-hidden">
      <p className="font-medium text-gray-100 truncate">{title}</p>
      {subtitle && <p className="text-sm text-gray-400 truncate">{subtitle}</p>}
    </div>
  </button>
);

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, query, onQueryChange, results, onSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasResults = results.campaigns.length > 0 || results.templates.length > 0 || results.contacts.length > 0;

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/70 z-50 flex justify-center pt-[15vh] p-4 animate-fade-in"
        onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-gray-800 border border-gray-700 rounded-lg shadow-2xl flex flex-col animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700 flex items-center">
          <SearchIcon className="h-5 w-5 text-gray-400 mr-3" />
          <input 
            ref={inputRef}
            value={query} 
            onChange={e => onQueryChange(e.target.value)} 
            placeholder="Search campaigns, templates, contacts..."
            className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query && !hasResults ? (
            <div className="text-center py-10 text-gray-400">
                <p>No results found for "{query}"</p>
            </div>
          ) : (
            <>
                {results.campaigns.length > 0 && (
                    <div className="p-2">
                        <h3 className="text-xs font-semibold uppercase text-gray-500 px-3 mb-2">Campaigns</h3>
                        {results.campaigns.map(item => (
                            <SearchResultItem 
                                key={`campaign-${item.id}`}
                                icon={<DocumentTextIcon className="h-5 w-5" />}
                                title={item.name}
                                subtitle={item.subject}
                                onClick={() => onSelect(item, 'campaign')}
                            />
                        ))}
                    </div>
                )}
                {results.templates.length > 0 && (
                    <div className="p-2">
                        <h3 className="text-xs font-semibold uppercase text-gray-500 px-3 mb-2">Templates</h3>
                        {results.templates.map(item => (
                            <SearchResultItem 
                                key={`template-${item.id}`}
                                icon={<CollectionIcon className="h-5 w-5" />}
                                title={item.name}
                                subtitle={item.subject}
                                onClick={() => onSelect(item, 'template')}
                            />
                        ))}
                    </div>
                )}
                {results.contacts.length > 0 && (
                    <div className="p-2">
                        <h3 className="text-xs font-semibold uppercase text-gray-500 px-3 mb-2">Contacts</h3>
                        {results.contacts.map(item => (
                            <SearchResultItem 
                                key={`contact-${item.id}`}
                                icon={<UsersIcon className="h-5 w-5" />}
                                title={item.name}
                                subtitle={`${item.email} • ${item.company}`}
                                onClick={() => onSelect(item, 'contact')}
                            />
                        ))}
                    </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;