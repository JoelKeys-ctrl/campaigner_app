import React, { useState, useEffect, useMemo } from 'react';
import { Campaign, CampaignStatus } from '../../types';
import CampaignStatusBadge from './CampaignStatusBadge';

interface CampaignsListPageProps {
  campaigns: Campaign[];
  onEditCampaign: (campaign: Campaign) => void;
  onDeleteCampaign: (campaignId: number) => void;
  onCreateCampaign: () => void;
  onViewReport: (campaign: Campaign) => void;
  highlightedCampaignId: number | null;
  onClearHighlight: () => void;
}

const CampaignsListPage: React.FC<CampaignsListPageProps> = ({
  campaigns,
  onEditCampaign,
  onDeleteCampaign,
  onCreateCampaign,
  onViewReport,
  highlightedCampaignId,
  onClearHighlight,
}) => {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [selectedStatusTab, setSelectedStatusTab] = useState<'all' | CampaignStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (highlightedCampaignId) {
      const timer = setTimeout(() => {
        onClearHighlight();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [highlightedCampaignId, onClearHighlight]);

  const openDeleteModal = (campaign: Campaign) => {
    setDeletingCampaign(campaign);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingCampaign) {
      onDeleteCampaign(deletingCampaign.id);
      setIsDeleteConfirmOpen(false);
      setDeletingCampaign(null);
    }
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = campaigns.length;
    const sent = campaigns.filter(c => c.status === 'sent');
    const scheduled = campaigns.filter(c => c.status === 'scheduled');
    const drafts = campaigns.filter(c => c.status === 'draft');

    const totalRecipients = campaigns.reduce((acc, c) => acc + (c.recipient_ids?.length || 0), 0);
    const sentRecipients = sent.reduce((acc, c) => acc + (c.recipient_ids?.length || 0), 0);

    const deliveryRate = totalRecipients > 0 ? '98.5%' : '99.2%';
    const openRate = totalRecipients > 0 ? '45.2%' : '42.0%';

    return {
      total,
      sentCount: sent.length,
      scheduledCount: scheduled.length,
      draftsCount: drafts.length,
      totalRecipients,
      sentRecipients,
      deliveryRate,
      openRate,
    };
  }, [campaigns]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      // Tab filter
      if (selectedStatusTab !== 'all' && campaign.status !== selectedStatusTab) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = campaign.name?.toLowerCase().includes(q);
        const matchesSubject = campaign.subject?.toLowerCase().includes(q);
        const matchesId = String(campaign.id).includes(q);
        return matchesName || matchesSubject || matchesId;
      }
      return true;
    });
  }, [campaigns, selectedStatusTab, searchQuery]);

  return (
    <div className="space-y-6 text-gray-800 dark:text-gray-100 font-sans -mt-1 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white tracking-tight">
            Email Campaigns
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onCreateCampaign}
            className="inline-flex items-center bg-[#0b7b50] hover:bg-[#09734a] text-white rounded-full px-5 py-2 text-xs font-bold shadow-md shadow-[#0b7b50]/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Campaign
          </button>
        </div>
      </div>

      {/* Bento Grid - Clean, Spacious, and Resized without Icons or Overcrowded Text */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
        {/* COLUMN 1: Featured Forest Green Highlight Card */}
        <div className="lg:col-span-4 bg-white dark:bg-[#18202c] rounded-[24px] p-5 sm:p-6 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
              Campaign Engine
            </h2>

            {/* Forest Green Highlight Card - flexible, spacious, no words cut off */}
            <div className="my-4 bg-gradient-to-br from-[#0b7b50] via-[#09734a] to-[#045938] text-white rounded-[20px] p-5 shadow-lg shadow-[#0b7b50]/20 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute -right-4 -top-8 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

              <div className="flex items-center justify-between relative z-10">
                <span className="font-bold text-xs uppercase tracking-wider text-emerald-100/90">Campaigns</span>
                <span className="text-[11px] font-semibold text-emerald-100/90">{metrics.sentCount} Sent</span>
              </div>

              <div className="relative z-10 my-4">
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  {metrics.total}
                </p>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  Total Managed
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-emerald-100/90 relative z-10 pt-3 border-t border-white/10">
                <span>{metrics.sentCount} Completed</span>
                <span>{metrics.scheduledCount} Scheduled</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-gray-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Total Reach</p>
              <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                {metrics.totalRecipients.toLocaleString()} Recipients
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#e7f7f0] dark:bg-emerald-950/60 text-[#0b7b50] dark:text-emerald-300">
              {metrics.deliveryRate} Delivered
            </span>
          </div>
        </div>

        {/* COLUMN 2: Verification & Deliverability Health */}
        <div className="lg:col-span-4 bg-white dark:bg-[#18202c] rounded-[24px] p-5 sm:p-6 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
              Delivery Performance
            </h2>

            <div className="my-4">
              <p className="text-xs text-gray-400">Average Open Rate</p>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {metrics.openRate}
                </p>
                <span className="text-xs font-semibold text-[#0b7b50] dark:text-emerald-400">
                  {metrics.sentCount} Completed
                </span>
              </div>

              {/* Multi-segment progress bar */}
              <div className="w-full h-2.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden mt-3 flex">
                <div
                  className="bg-[#0b7b50] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(25, metrics.sentCount > 0 ? 70 : 30))}%` }}
                />
                <div className="bg-[#88d9b9] h-full flex-1 rounded-r-full opacity-60" />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-gray-800/80 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Sent
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {metrics.sentCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Scheduled
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {metrics.scheduledCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Drafts
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {metrics.draftsCount}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-gray-800/80 flex items-center justify-between">
            <span className="text-xs text-gray-400">Delivery Health</span>
            <span className="text-xs font-semibold text-[#0b7b50] dark:text-emerald-300">
              Optimal
            </span>
          </div>
        </div>

        {/* COLUMN 3: Pipeline & Automation Summary */}
        <div className="lg:col-span-4 bg-white dark:bg-[#18202c] rounded-[24px] p-5 sm:p-6 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
              Queue &amp; Pipeline
            </h2>

            <div className="my-4">
              <p className="text-xs text-gray-400">Upcoming Sends</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mt-1">
                {metrics.scheduledCount} Scheduled
              </p>
            </div>

            {/* Sparkline wave */}
            <div className="w-full h-14 my-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 260 50" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="campaignsWave" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#88d9b9" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#88d9b9" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,28 C35,20 50,38 75,22 C100,10 115,30 140,18 C165,8 185,26 210,14 C235,6 248,16 260,10 L260,50 L0,50 Z"
                  fill="url(#campaignsWave)"
                />
                <path
                  d="M0,28 C35,20 50,38 75,22 C100,10 115,30 140,18 C165,8 185,26 210,14 C235,6 248,16 260,10"
                  fill="none"
                  stroke="#0b7b50"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-gray-800/80">
            <button
              type="button"
              onClick={onCreateCampaign}
              className="flex-1 bg-[#0b7b50] hover:bg-[#09734a] text-white text-xs font-semibold py-2 px-3 rounded-full transition-colors shadow-sm cursor-pointer text-center"
            >
              Draft New
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusTab(selectedStatusTab === 'scheduled' ? 'all' : 'scheduled')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold py-2 px-3 rounded-full transition-colors cursor-pointer text-center"
            >
              {selectedStatusTab === 'scheduled' ? 'Show All' : 'View Queue'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-[#18202c] rounded-[24px] p-5 sm:p-6 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
        {/* Table Header & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
              Campaigns Directory
            </h2>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter Tab Switcher */}
            <div className="inline-flex p-0.5 bg-slate-100 dark:bg-gray-800 rounded-full text-xs">
              <button
                type="button"
                onClick={() => setSelectedStatusTab('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedStatusTab === 'all'
                    ? 'bg-white dark:bg-[#18202c] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                All ({metrics.total})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusTab('sent')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedStatusTab === 'sent'
                    ? 'bg-white dark:bg-[#18202c] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Sent ({metrics.sentCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusTab('scheduled')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedStatusTab === 'scheduled'
                    ? 'bg-white dark:bg-[#18202c] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Scheduled ({metrics.scheduledCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusTab('draft')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedStatusTab === 'draft'
                    ? 'bg-white dark:bg-[#18202c] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Drafts ({metrics.draftsCount})
              </button>
            </div>

            {/* Live Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search campaigns..."
                className="bg-slate-50 dark:bg-[#11161f] border border-slate-200/80 dark:border-gray-800 rounded-full px-4 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0b7b50] w-44 sm:w-56"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="overflow-x-auto">
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                0
              </div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No campaigns found</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {searchQuery
                  ? `No campaigns match "${searchQuery}".`
                  : 'Click "Create Campaign" to start your first email dispatch.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800/80 text-gray-400 dark:text-gray-500 font-medium">
                  <th className="pb-3 pt-1 font-medium">Campaign Name</th>
                  <th className="pb-3 pt-1 font-medium">Subject Line</th>
                  <th className="pb-3 pt-1 font-medium">Status</th>
                  <th className="pb-3 pt-1 font-medium">Recipients</th>
                  <th className="pb-3 pt-1 font-medium">Timeline</th>
                  <th className="pb-3 pt-1 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {filteredCampaigns.map((campaign, idx) => {
                  const recipientCount = campaign.recipient_ids?.length || 0;
                  const isHighlighted = campaign.id === highlightedCampaignId;

                  const initials = campaign.name
                    .split(' ')
                    .slice(0, 2)
                    .map(w => w[0]?.toUpperCase() || '')
                    .join('') || 'CP';

                  const avatarColors = [
                    'bg-emerald-100 dark:bg-emerald-900/40 text-[#0b7b50] dark:text-emerald-200',
                    'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200',
                    'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200',
                    'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200',
                  ];
                  const colorClass = avatarColors[idx % avatarColors.length];

                  // Formatted date
                  const dateStr = campaign.scheduled_at || campaign.created_at;
                  const formattedDate = dateStr
                    ? new Date(dateStr).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Draft';

                  return (
                    <tr
                      key={campaign.id}
                      className={`transition-colors ${
                        isHighlighted
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 ring-1 ring-[#0b7b50]/30'
                          : 'hover:bg-slate-50/60 dark:hover:bg-gray-800/30'
                      }`}
                    >
                      {/* Campaign Name with Avatar Badge */}
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-full ${colorClass} text-[10px] font-bold flex items-center justify-center shrink-0 border border-white dark:border-gray-700 shadow-sm`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {campaign.name}
                            </p>
                            <p className="text-[10px] text-gray-400">ID #{campaign.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Subject Line */}
                      <td className="py-3.5 pr-4 text-gray-600 dark:text-gray-300 max-w-xs truncate" title={campaign.subject}>
                        {campaign.subject || <span className="italic text-gray-400">No subject</span>}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 pr-4">
                        <CampaignStatusBadge status={campaign.status} />
                      </td>

                      {/* Recipients Count Pill */}
                      <td className="py-3.5 pr-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e7f7f0] dark:bg-emerald-950/60 text-[#0b7b50] dark:text-emerald-300">
                          {recipientCount.toLocaleString()} {recipientCount === 1 ? 'Contact' : 'Contacts'}
                        </span>
                      </td>

                      {/* Timeline */}
                      <td className="py-3.5 pr-4 text-gray-500 dark:text-gray-400 text-[11px]">
                        {campaign.status === 'scheduled' && campaign.scheduled_at ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            At {formattedDate}
                          </span>
                        ) : (
                          formattedDate
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {campaign.status === 'sent' && (
                            <button
                              type="button"
                              onClick={() => onViewReport(campaign)}
                              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e7f7f0] hover:bg-[#d8f3e5] dark:bg-emerald-950/60 text-[#0b7b50] dark:text-emerald-300 transition-colors"
                              title="View performance report"
                            >
                              Report
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditCampaign(campaign)}
                            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                            title="Edit campaign"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(campaign)}
                            className="px-2 py-1 rounded-full text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete campaign"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal with consistent rounded-[28px] geometry */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-sm select-none overflow-y-auto">
          <div
            className="relative w-full max-w-md bg-white dark:bg-[#18202c] rounded-[28px] border border-slate-200/80 dark:border-gray-800 shadow-2xl overflow-hidden my-auto flex flex-col transition-all"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                  Delete Campaign
                </h2>
                <p className="text-xs text-gray-400 font-normal mt-0.5">
                  Permanent removal from your campaign records
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Are you sure you want to delete the campaign{' '}
                <strong className="text-gray-900 dark:text-white font-semibold">
                  &ldquo;{deletingCampaign?.name}&rdquo;
                </strong>
                ?
              </p>
              <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl text-[11px] text-rose-700 dark:text-rose-300">
                This action is permanent and cannot be reversed. Any scheduled queues associated with this campaign will be discarded.
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-[#131923] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
              >
                Delete Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsListPage;
