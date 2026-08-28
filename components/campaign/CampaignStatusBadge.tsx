import React from 'react';
import { CampaignStatus } from '../../types';

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
}

const statusStyles: Record<CampaignStatus, string> = {
  draft: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
  scheduled: 'bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300',
  sent: 'bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300',
};

const CampaignStatusBadge: React.FC<CampaignStatusBadgeProps> = ({ status }) => {
  return (
    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full capitalize ${statusStyles[status]}`}>
      {status}
    </span>
  );
};

export default CampaignStatusBadge;