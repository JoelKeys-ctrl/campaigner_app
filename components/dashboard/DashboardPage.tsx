import React, { useMemo, useState } from 'react';
import CampaignChart from './CampaignChart';
import CreateCampaignModal from './CreateCampaignModal';
import CampaignStatusBadge from '../campaign/CampaignStatusBadge';
import { Campaign, ContactList, AppActivity, EmailTemplate, User } from '../../types';

interface DashboardPageProps {
    campaigns: Campaign[];
    contactLists: ContactList[];
    appActivity: AppActivity[];
    onSaveCampaign?: (campaignData: Omit<Campaign, 'id' | 'created_at' | 'user_id'> & { id?: number }) => Promise<boolean>;
    templates?: EmailTemplate[];
    onCreateCampaignClick?: () => void;
    user?: User;
    onViewReport?: (campaign: Campaign) => void;
    onEditCampaign?: (campaign: Campaign) => void;
    onNavigateToCampaigns?: () => void;
    onNavigateToContacts?: () => void;
    onNavigateToTemplates?: () => void;
}

const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
};

const formatActivityType = (type: string): string => {
    switch (type) {
        case 'campaign-sent': return 'Campaign Dispatch';
        case 'list-imported': return 'Audience Import';
        case 'campaign-created': return 'Campaign Draft';
        case 'template-created': return 'Template Saved';
        default: return 'System Event';
    }
};

const DashboardPage: React.FC<DashboardPageProps> = ({ 
    campaigns, 
    contactLists, 
    appActivity,
    onSaveCampaign,
    templates = [],
    onCreateCampaignClick,
    user,
    onViewReport,
    onEditCampaign,
    onNavigateToCampaigns,
    onNavigateToContacts,
    onNavigateToTemplates,
}) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeTableTab, setActiveTableTab] = useState<'campaigns' | 'activity'>('campaigns');

    // Real campaigner stats calculated strictly from the database
    const stats = useMemo(() => {
        const totalCampaigns = campaigns.length;
        const sentCampaigns = campaigns.filter(c => c.status === 'sent');
        const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled');
        const draftCampaigns = campaigns.filter(c => c.status === 'draft');
        
        const sentCount = sentCampaigns.length;
        const scheduledCount = scheduledCampaigns.length;
        const draftCount = draftCampaigns.length;

        const totalEmailsSent = sentCampaigns.reduce((acc, c) => acc + (c.recipient_ids?.length || 0), 0);
        const totalScheduledEmails = scheduledCampaigns.reduce((acc, c) => acc + (c.recipient_ids?.length || 0), 0);

        const totalContacts = contactLists.reduce((sum, list) => sum + (list.contacts?.length || 0), 0);
        const totalLists = contactLists.length;
        const allContacts = contactLists.flatMap(l => l.contacts || []);
        const subscribedCount = allContacts.filter(c => c.status === 'subscribed').length;

        const sentPercentage = totalCampaigns > 0 ? Math.round((sentCount / totalCampaigns) * 100) : 0;
        const scheduledPercentage = totalCampaigns > 0 ? Math.round((scheduledCount / totalCampaigns) * 100) : 0;
        const draftPercentage = totalCampaigns > 0 ? Math.round((draftCount / totalCampaigns) * 100) : 0;

        return {
            totalCampaigns,
            sentCount,
            scheduledCount,
            draftCount,
            totalEmailsSent,
            totalScheduledEmails,
            totalContacts,
            totalLists,
            subscribedCount,
            totalTemplates: templates.length,
            sentPercentage,
            scheduledPercentage,
            draftPercentage,
            sentCampaigns,
            scheduledCampaigns,
            draftCampaigns,
        };
    }, [campaigns, contactLists, templates]);

    const recentActivity = useMemo(() => {
        return appActivity.slice(0, 8).map(activity => ({
            ...activity,
            formattedType: formatActivityType(activity.type),
            relativeTime: getRelativeTime(activity.timestamp),
            formattedDate: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(activity.timestamp),
            formattedTime: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).format(activity.timestamp),
        }));
    }, [appActivity]);

    // Sorted recent campaigns from database
    const recentCampaigns = useMemo(() => {
        return [...campaigns]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 6);
    }, [campaigns]);

    // Next scheduled campaign in queue
    const nextScheduledCampaign = useMemo(() => {
        return stats.scheduledCampaigns
            .sort((a, b) => {
                const dateA = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity;
                const dateB = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity;
                return dateA - dateB;
            })[0] || null;
    }, [stats.scheduledCampaigns]);

    const handleCreateClick = () => {
        if (onCreateCampaignClick) {
            onCreateCampaignClick();
        } else {
            setIsCreateModalOpen(true);
        }
    };

    return (
        <div className="space-y-6 text-gray-800 dark:text-gray-100 font-sans -mt-1 select-none">
            
            {/* Top Greeting Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white tracking-tight">
                        Welcome Back, {user?.name || 'User'}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleCreateClick}
                        className="inline-flex items-center gap-1.5 bg-[#0b7b50] hover:bg-[#09734a] text-white rounded-full px-4 py-2 text-xs font-semibold shadow-xs cursor-pointer transition-all hover:shadow hover:scale-[1.01] active:scale-[0.99]"
                    >
                        <span>+ New Campaign</span>
                    </button>
                </div>
            </div>

            {/* Campaigner Stats KPI Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Total Campaigns */}
                <div 
                    onClick={onNavigateToCampaigns}
                    className="bg-white dark:bg-[#18202c] border border-slate-200/70 dark:border-gray-800 rounded-[24px] p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] cursor-pointer"
                >
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
                        Campaigns
                    </h2>

                    <div className="my-3">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {stats.totalCampaigns}
                        </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-gray-800/80 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                        <span>{stats.sentCount} sent</span>
                        <span>{stats.scheduledCount} scheduled</span>
                        <span>{stats.draftCount} drafts</span>
                    </div>
                </div>

                {/* Emails Dispatched */}
                <div className="bg-white dark:bg-[#18202c] border border-slate-200/70 dark:border-gray-800 rounded-[24px] p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
                        Emails Sent
                    </h2>

                    <div className="my-3">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {stats.totalEmailsSent.toLocaleString()}
                        </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-gray-800/80 text-xs text-gray-500 dark:text-gray-400">
                        <span>Across {stats.sentCount} campaigns</span>
                    </div>
                </div>

                {/* Total Audience Contacts */}
                <div 
                    onClick={onNavigateToContacts}
                    className="bg-white dark:bg-[#18202c] border border-slate-200/70 dark:border-gray-800 rounded-[24px] p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] cursor-pointer"
                >
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
                        Audience
                    </h2>

                    <div className="my-3">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {stats.totalContacts.toLocaleString()}
                        </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-gray-800/80 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                        <span>{stats.subscribedCount} subscribed</span>
                        <span>{stats.totalLists} lists</span>
                    </div>
                </div>

                {/* Templates Library */}
                <div 
                    onClick={onNavigateToTemplates}
                    className="bg-white dark:bg-[#18202c] border border-slate-200/70 dark:border-gray-800 rounded-[24px] p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] cursor-pointer"
                >
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
                        Templates
                    </h2>

                    <div className="my-3">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {stats.totalTemplates}
                        </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-gray-800/80 text-xs text-gray-500 dark:text-gray-400">
                        <span>Saved templates</span>
                    </div>
                </div>

            </div>

            {/* Middle Section: Performance Chart + Pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Column 1 (Left 8 cols): Real Campaign Performance Chart */}
                <div className="lg:col-span-8 bg-white dark:bg-[#18202c] rounded-[24px] p-5 sm:p-6 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                    <div>
                        <div className="mb-2">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
                                Performance
                            </h2>
                        </div>

                        {/* Chart Component */}
                        <CampaignChart campaigns={campaigns} />
                    </div>
                </div>

                {/* Column 2 (Right 4 cols): Pipeline */}
                <div className="lg:col-span-4 bg-white dark:bg-[#18202c] rounded-[24px] p-5 sm:p-6 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                    <div>
                        <div className="mb-4">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
                                Pipeline
                            </h2>
                        </div>

                        {/* Visual Breakdown Bar */}
                        <div className="space-y-3">
                            <div>
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        Sent ({stats.sentCount})
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {stats.sentPercentage}%
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-[#0b7b50] rounded-full transition-all duration-500"
                                        style={{ width: `${stats.sentPercentage}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        Scheduled ({stats.scheduledCount})
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {stats.scheduledPercentage}%
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                        style={{ width: `${stats.scheduledPercentage}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        Drafts ({stats.draftCount})
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {stats.draftPercentage}%
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gray-400 rounded-full transition-all duration-500"
                                        style={{ width: `${stats.draftPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Next Scheduled Campaign */}
                        {nextScheduledCampaign && (
                            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-gray-800/80">
                                <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                            {nextScheduledCampaign.name}
                                        </span>
                                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-100/70 dark:bg-amber-900/50">
                                            Scheduled
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                                        <span>{nextScheduledCampaign.recipient_ids?.length || 0} recipients</span>
                                        {nextScheduledCampaign.scheduled_at && (
                                            <span>
                                                {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(nextScheduledCampaign.scheduled_at))}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Bottom Section: Campaigns & Activity */}
            <div className="bg-white dark:bg-[#18202c] rounded-[24px] p-5 sm:p-6 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
                        Campaigns
                    </h2>

                    {/* Tab Selector */}
                    <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800/80 rounded-full p-1 border border-gray-200/50 dark:border-gray-700/50 text-xs">
                        <button
                            type="button"
                            onClick={() => setActiveTableTab('campaigns')}
                            className={`px-3 py-1 font-medium rounded-full transition-all ${
                                activeTableTab === 'campaigns'
                                    ? 'bg-[#0b7b50] text-white shadow-xs'
                                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            Campaigns ({campaigns.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTableTab('activity')}
                            className={`px-3 py-1 font-medium rounded-full transition-all ${
                                activeTableTab === 'activity'
                                    ? 'bg-[#0b7b50] text-white shadow-xs'
                                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            Activity ({appActivity.length})
                        </button>
                    </div>
                </div>

                {/* Tab 1: Recent Campaigns Table */}
                {activeTableTab === 'campaigns' ? (
                    <div className="overflow-x-auto">
                        {recentCampaigns.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    No campaigns found.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleCreateClick}
                                    className="mt-2 text-xs font-semibold text-[#0b7b50] dark:text-emerald-400 hover:underline"
                                >
                                    Create Campaign
                                </button>
                            </div>
                        ) : (
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-800/80 text-gray-400 dark:text-gray-500 font-medium">
                                        <th className="pb-3 pt-1 font-medium">Name</th>
                                        <th className="pb-3 pt-1 font-medium">Subject</th>
                                        <th className="pb-3 pt-1 font-medium">Status</th>
                                        <th className="pb-3 pt-1 font-medium">Recipients</th>
                                        <th className="pb-3 pt-1 font-medium">Date</th>
                                        <th className="pb-3 pt-1 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                                    {recentCampaigns.map((camp) => (
                                        <tr key={camp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                                            <td className="py-3.5 font-semibold text-gray-900 dark:text-white">
                                                {camp.name}
                                            </td>
                                            <td className="py-3.5 text-gray-600 dark:text-gray-300 max-w-[200px] truncate">
                                                {camp.subject || '—'}
                                            </td>
                                            <td className="py-3.5">
                                                <CampaignStatusBadge status={camp.status} />
                                            </td>
                                            <td className="py-3.5 font-medium text-gray-700 dark:text-gray-300">
                                                {camp.recipient_ids?.length || 0}
                                            </td>
                                            <td className="py-3.5 text-gray-500 dark:text-gray-400">
                                                {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(camp.created_at))}
                                            </td>
                                            <td className="py-3.5 text-right">
                                                {camp.status === 'sent' && onViewReport ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => onViewReport(camp)}
                                                        className="text-xs font-semibold text-[#0b7b50] dark:text-emerald-400 hover:underline"
                                                    >
                                                        Report ↗
                                                    </button>
                                                ) : onEditCampaign ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => onEditCampaign(camp)}
                                                        className="text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-[#0b7b50] dark:hover:text-emerald-400"
                                                    >
                                                        Edit
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                ) : (
                    /* Tab 2: Activity Log Table */
                    <div className="overflow-x-auto">
                        {recentActivity.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    No activity records.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-800/80 text-gray-400 dark:text-gray-500 font-medium">
                                        <th className="pb-3 pt-1 font-medium">Activity</th>
                                        <th className="pb-3 pt-1 font-medium">Event</th>
                                        <th className="pb-3 pt-1 font-medium">Date</th>
                                        <th className="pb-3 pt-1 font-medium">Time</th>
                                        <th className="pb-3 pt-1 font-medium text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                                    {recentActivity.map((act) => (
                                        <tr key={act.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                                            <td className="py-3.5 font-semibold text-gray-900 dark:text-white">
                                                {act.description}
                                            </td>
                                            <td className="py-3.5">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#e7f7f0] dark:bg-emerald-950/60 text-[#0b7b50] dark:text-emerald-300">
                                                    {act.formattedType}
                                                </span>
                                            </td>
                                            <td className="py-3.5 text-gray-600 dark:text-gray-300">
                                                {act.formattedDate}
                                            </td>
                                            <td className="py-3.5 text-gray-400">
                                                {act.relativeTime}
                                            </td>
                                            <td className="py-3.5 text-right">
                                                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Logged
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Create Campaign Modal */}
            <CreateCampaignModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={onSaveCampaign || (async () => true)}
                contactLists={contactLists}
                templates={templates}
            />

        </div>
    );
};

export default DashboardPage;
