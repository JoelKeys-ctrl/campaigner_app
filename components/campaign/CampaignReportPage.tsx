import React, { useMemo, useState } from 'react';
import { Campaign, Contact } from '../../types';
import CampaignStatusBadge from './CampaignStatusBadge';

interface CampaignReportPageProps {
  campaign: Campaign;
  allContacts: Contact[];
  onClose: () => void;
}

const CampaignReportPage: React.FC<CampaignReportPageProps> = ({ campaign, allContacts, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const recipients = useMemo(() => {
    return allContacts.filter(c => campaign.recipient_ids?.includes(c.id));
  }, [campaign, allContacts]);

  const metrics = useMemo(() => {
    const emailsSent = recipients.length;
    const MOCK_DELIVERY_RATE = 0.985;
    const MOCK_OPEN_RATE = 0.452;
    const MOCK_REPLY_RATE = 0.15;

    const emailsDelivered = Math.floor(emailsSent * MOCK_DELIVERY_RATE);
    const emailsOpened = Math.floor(emailsDelivered * MOCK_OPEN_RATE);
    const emailsReplied = Math.floor(emailsOpened * MOCK_REPLY_RATE);

    const deliveryRate = emailsSent > 0 ? (emailsDelivered / emailsSent * 100).toFixed(1) : '98.5';
    const openRate = emailsDelivered > 0 ? (emailsOpened / emailsDelivered * 100).toFixed(1) : '45.2';
    const replyRate = emailsOpened > 0 ? (emailsReplied / emailsOpened * 100).toFixed(1) : '15.0';

    return {
      emailsSent,
      emailsDelivered,
      emailsOpened,
      emailsReplied,
      deliveryRate: `${deliveryRate}%`,
      openRate: `${openRate}%`,
      replyRate: `${replyRate}%`,
    };
  }, [recipients]);

  const filteredRecipients = useMemo(() => {
    if (!searchQuery.trim()) return recipients;
    const q = searchQuery.trim().toLowerCase();
    return recipients.filter(
      r =>
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.company?.toLowerCase().includes(q)
    );
  }, [recipients, searchQuery]);

  return (
    <div className="space-y-6 text-gray-800 dark:text-gray-100 font-sans -mt-1 select-none">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 bg-white dark:bg-[#18202c] border border-slate-200/80 dark:border-gray-800 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-xs hover:border-gray-300 dark:hover:border-gray-700 mb-3 cursor-pointer transition-colors"
          >
            <span>←</span>
            <span>Back to Campaigns</span>
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white tracking-tight">
              {campaign.name}
            </h1>
            <CampaignStatusBadge status={campaign.status} />
          </div>
          <p className="text-xs text-gray-400 font-normal mt-1">
            Subject: &ldquo;{campaign.subject}&rdquo; • ID #{campaign.id}
          </p>
        </div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Sent Card */}
        <div className="bg-white dark:bg-[#18202c] rounded-[24px] p-5 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-gray-400">Emails Sent</span>
          </div>
          <div className="my-2">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {metrics.emailsSent.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Delivered Card */}
        <div className="bg-white dark:bg-[#18202c] rounded-[24px] p-5 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-gray-400">Delivered</span>
            <span className="text-xs font-bold text-[#0b7b50] dark:text-emerald-400">
              {metrics.deliveryRate}
            </span>
          </div>
          <div className="my-2">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {metrics.emailsDelivered.toLocaleString()}
            </p>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-[#0b7b50] rounded-full" style={{ width: metrics.deliveryRate }} />
            </div>
          </div>
        </div>

        {/* Opened Card */}
        <div className="bg-white dark:bg-[#18202c] rounded-[24px] p-5 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-gray-400">Emails Opened</span>
            <span className="text-xs font-bold text-[#0b7b50] dark:text-emerald-400">
              {metrics.openRate}
            </span>
          </div>
          <div className="my-2">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {metrics.emailsOpened.toLocaleString()}
            </p>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-[#88d9b9] rounded-full" style={{ width: metrics.openRate }} />
            </div>
          </div>
        </div>

        {/* Replied Card */}
        <div className="bg-white dark:bg-[#18202c] rounded-[24px] p-5 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-gray-400">Direct Replies</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {metrics.replyRate}
            </span>
          </div>
          <div className="my-2">
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {metrics.emailsReplied.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Recipients Directory Card */}
      <div className="bg-white dark:bg-[#18202c] rounded-[24px] p-5 sm:p-6 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
              Targeted Recipients ({recipients.length})
            </h2>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search recipient name, email..."
              className="bg-slate-50 dark:bg-[#11161f] border border-slate-200/80 dark:border-gray-800 rounded-full px-4 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0b7b50] w-56 sm:w-64"
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

        <div className="overflow-x-auto">
          {filteredRecipients.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">
              No recipients match your search query.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800/80 text-gray-400 dark:text-gray-500 font-medium">
                  <th className="pb-3 pt-1 font-medium">Contact</th>
                  <th className="pb-3 pt-1 font-medium">Email Address</th>
                  <th className="pb-3 pt-1 font-medium">Company</th>
                  <th className="pb-3 pt-1 font-medium text-right">Dispatch Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {filteredRecipients.map((contact, idx) => {
                  const initials = contact.name
                    .split(' ')
                    .slice(0, 2)
                    .map(w => w[0]?.toUpperCase() || '')
                    .join('') || 'CT';

                  return (
                    <tr key={contact.id} className="hover:bg-slate-50/60 dark:hover:bg-gray-800/30">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#e7f7f0] dark:bg-emerald-950/60 text-[#0b7b50] dark:text-emerald-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {contact.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-gray-600 dark:text-gray-300">
                        {contact.email}
                      </td>
                      <td className="py-3.5 pr-4 text-gray-500 dark:text-gray-400">
                        {contact.company || '—'}
                      </td>
                      <td className="py-3.5 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e7f7f0] text-[#0b7b50] dark:bg-emerald-950/60 dark:text-emerald-300">
                          Delivered
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignReportPage;
