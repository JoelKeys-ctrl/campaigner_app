import React from 'react';

interface StatusBadgeProps {
  status: 'subscribed' | 'unsubscribed';
  onChange: (newStatus: 'subscribed' | 'unsubscribed') => void;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, onChange }) => {
  const badgeColor = status === 'subscribed' 
    ? 'bg-green-500/20 text-green-300 border-green-500/30' 
    : 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  const selectBg = status === 'subscribed'
    ? 'bg-green-500/10'
    : 'bg-gray-500/10';

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as 'subscribed' | 'unsubscribed');
  };

  return (
    <div className={`relative inline-block px-3 py-1 text-xs font-medium rounded-full border ${badgeColor}`}>
      <select
        value={status}
        onChange={handleSelectChange}
        className={`appearance-none w-full h-full absolute inset-0 opacity-0 cursor-pointer ${selectBg}`}
        aria-label={`Change status for contact, current status ${status}`}
      >
        <option value="subscribed">Subscribed</option>
        <option value="unsubscribed">Unsubscribed</option>
      </select>
      <span className="capitalize">{status}</span>
    </div>
  );
};

export default StatusBadge;
