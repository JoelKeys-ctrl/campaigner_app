
import React, { useMemo } from 'react';
import { ContactList, Contact } from '../../types';
import Card from '../ui/Card';
import Checkbox from '../ui/Checkbox';

interface RecipientSummaryProps {
  contactList: ContactList;
  selectedIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
}

const RecipientSummary: React.FC<RecipientSummaryProps> = ({ contactList, selectedIds, onSelectionChange }) => {
  
  const allContactIds = useMemo(() => contactList.contacts.map(c => c.id), [contactList.contacts]);
  const isAllSelected = useMemo(() => allContactIds.length > 0 && selectedIds.length === allContactIds.length, [selectedIds, allContactIds]);
  const isIndeterminate = useMemo(() => selectedIds.length > 0 && selectedIds.length < allContactIds.length, [selectedIds, allContactIds]);

  const handleToggleAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allContactIds);
    }
  };

  const handleToggleContact = (contactId: number) => {
    const newSelectedIds = selectedIds.includes(contactId)
      ? selectedIds.filter(id => id !== contactId)
      : [...selectedIds, contactId];
    onSelectionChange(newSelectedIds);
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <div>
            <h3 className="font-semibold text-white">Select Recipients</h3>
            <p className="text-sm text-gray-400">
                {selectedIds.length} of {contactList.contactCount} selected
            </p>
        </div>
      </div>
      
      <div className="border-t border-b border-brand-800 py-2 px-3">
        <Checkbox 
          label="Select All"
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          onChange={handleToggleAll}
        />
      </div>

      <ul className="max-h-80 overflow-y-auto divide-y divide-brand-800">
        {contactList.contacts.map((contact: Contact) => (
          <li key={contact.id} className="p-3 hover:bg-brand-800/40">
            <Checkbox
              label={
                <div className="flex flex-col ml-2">
                  <span className="text-sm font-medium text-gray-200">{contact.name}</span>
                  <span className="text-xs text-gray-400">{contact.email}</span>
                </div>
              }
              checked={selectedIds.includes(contact.id)}
              onChange={() => handleToggleContact(contact.id)}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default RecipientSummary;
