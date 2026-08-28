import React, { useState, useMemo, useEffect } from 'react';
import { ContactList, Contact } from '../../types';
import Input from '../ui/Input';
import Checkbox from '../ui/Checkbox';
import Button from '../ui/Button';

// Icons
const SearchIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const ChevronDownIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;

interface ContactListSelectorProps {
  contactLists: ContactList[];
  initialSelectedIds: number[];
  onSave: (selectedIds: number[]) => void;
  onClose: () => void;
}

const ContactListSelector: React.FC<ContactListSelectorProps> = ({ contactLists, initialSelectedIds, onSave, onClose }) => {
  const [selectedIds, setSelectedIds] = useState(new Set(initialSelectedIds));
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLists, setExpandedLists] = useState<Set<number>>(new Set());

  // Reset internal state if the initial props change
  useEffect(() => {
    setSelectedIds(new Set(initialSelectedIds));
  }, [initialSelectedIds]);

  const toggleListExpansion = (listId: number) => {
    setExpandedLists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(listId)) {
        newSet.delete(listId);
      } else {
        newSet.add(listId);
      }
      return newSet;
    });
  };

  const handleToggleContact = (contactId: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const handleToggleList = (list: ContactList) => {
    const allContactIdsInList = list.contacts.map(c => c.id);
    const areAllSelected = allContactIdsInList.every(id => selectedIds.has(id));
    
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (areAllSelected) {
        allContactIdsInList.forEach(id => newSet.delete(id));
      } else {
        allContactIdsInList.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const filteredContactLists = useMemo(() => {
    if (!searchTerm) return contactLists;
    const lowercasedFilter = searchTerm.toLowerCase();
    
    return contactLists.map(list => {
      const filteredContacts = list.contacts.filter(contact =>
        contact.name.toLowerCase().includes(lowercasedFilter) ||
        contact.email.toLowerCase().includes(lowercasedFilter)
      );
      // Include the list if the list name matches or it has matching contacts
      if (list.name.toLowerCase().includes(lowercasedFilter) || filteredContacts.length > 0) {
        return { ...list, contacts: filteredContacts };
      }
      return null;
    }).filter((list): list is ContactList => list !== null);
  }, [searchTerm, contactLists]);
  
  const handleSave = () => {
    onSave(Array.from(selectedIds));
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="mb-4">
        <Input 
          placeholder="Search lists or contacts..." 
          icon={<SearchIcon className="h-5 w-5 text-gray-400"/>}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex-grow overflow-y-auto -mx-6 px-6">
        {filteredContactLists.map(list => {
          const allContactIdsInList = list.contacts.map(c => c.id);
          const selectedInListCount = allContactIdsInList.filter(id => selectedIds.has(id)).length;
          const isAllSelected = allContactIdsInList.length > 0 && selectedInListCount === allContactIdsInList.length;
          const isIndeterminate = selectedInListCount > 0 && selectedInListCount < allContactIdsInList.length;

          return (
            <div key={list.id} className="py-2 border-b border-brand-800">
              <div className="flex items-center justify-between">
                <Checkbox
                  label={
                    <div className="flex flex-col ml-2">
                      <span className="font-semibold text-white">{list.name}</span>
                      <span className="text-xs text-gray-400">{list.contactCount} contacts</span>
                    </div>
                  }
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={() => handleToggleList(list)}
                />
                <Button variant="ghost" size="sm" onClick={() => toggleListExpansion(list.id)}>
                  <ChevronDownIcon className={`h-5 w-5 transition-transform ${expandedLists.has(list.id) ? 'rotate-180' : ''}`} />
                </Button>
              </div>
              {expandedLists.has(list.id) && (
                <ul className="pl-8 mt-2 space-y-2">
                  {list.contacts.map(contact => (
                    <li key={contact.id}>
                      <Checkbox
                        label={
                            <div className="flex flex-col ml-2">
                                <span className="text-sm text-gray-200">{contact.name}</span>
                                <span className="text-xs text-gray-500">{contact.email}</span>
                            </div>
                        }
                        checked={selectedIds.has(contact.id)}
                        onChange={() => handleToggleContact(contact.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-4 pt-6 border-t border-brand-800 -mx-6 px-6">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="button" variant="primary" onClick={handleSave}>Save Selection ({selectedIds.size})</Button>
      </div>
    </div>
  );
};

export default ContactListSelector;