import React from 'react';
import { CampaignStatus } from '../../types';

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
}

const statusConfig: Record<CampaignStatus, { label: string; bg: string; dot: string }> = {
  sent: {
    label: 'Sent',
    bg: 'bg-[#e7f7f0] dark:bg-emerald-950/60 text-[#0b7b50] dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40',
    dot: 'bg-[#0b7b50] dark:bg-emerald-400',
  },
  scheduled: {
    label: 'Scheduled',
    bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40',
    dot: 'bg-amber-500 animate-pulse',
  },
  draft: {
    label: 'Draft',
    bg: 'bg-slate-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-slate-200/60 dark:border-gray-700/50',
    dot: 'bg-gray-400',
  },
};

const CampaignStatusBadge: React.FC<CampaignStatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full capitalize whitespace-nowrap shadow-xs ${config.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default CampaignStatusBadge;
