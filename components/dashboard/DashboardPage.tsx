import React, { useMemo } from 'react';
import StatCard from './StatCard';
import CampaignChart from './CampaignChart';
import Card from '../ui/Card';
import Table from '../ui/Table';
import { Campaign, ContactList, AppActivity, DashboardMetrics } from '../../types';

interface DashboardPageProps {
    campaigns: Campaign[];
    contactLists: ContactList[];
    appActivity: AppActivity[];
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

const activityIcon = (type: string) => {
    switch (type) {
        case 'campaign-sent': return '🚀';
        case 'list-imported': return '📥';
        case 'campaign-created': return '📝';
        case 'template-created': return '🔖';
        default: return '➡️';
    }
};

const DashboardPage: React.FC<DashboardPageProps> = ({ campaigns, contactLists, appActivity }) => {
    
    const metrics: DashboardMetrics = useMemo(() => {
        const sentCampaigns = campaigns.filter(c => c.status === 'sent');
        const emailsSent = sentCampaigns.reduce((acc, c) => acc + c.recipient_ids.length, 0);

        // Mocked rates for derived metrics, as we don't have real tracking
        const MOCK_DELIVERY_RATE = 0.985;
        const MOCK_OPEN_RATE = 0.452;
        const MOCK_REPLY_RATE = 0.15; // of opened

        const emailsDelivered = Math.floor(emailsSent * MOCK_DELIVERY_RATE);
        const emailsOpened = Math.floor(emailsDelivered * MOCK_OPEN_RATE);
        const emailsReplied = Math.floor(emailsOpened * MOCK_REPLY_RATE);
        
        const deliveryRate = emailsSent > 0 ? (emailsDelivered / emailsSent * 100).toFixed(1) : '0.0';
        const openRate = emailsDelivered > 0 ? (emailsOpened / emailsDelivered * 100).toFixed(1) : '0.0';

        return {
            emailsSent,
            emailsDelivered,
            emailsOpened,
            emailsReplied,
            deliveryRate: `${deliveryRate}%`,
            openRate: `${openRate}%`,
        };
    }, [campaigns]);

    const recentActivity = useMemo(() => {
        return appActivity.slice(0, 5).map(activity => ({
            ...activity,
            icon: activityIcon(activity.type),
            relativeTime: getRelativeTime(activity.timestamp),
        }));
    }, [appActivity]);
    
    const activityHeaders = [
        { key: 'description', label: 'Activity', render: (item: any) => (
            <div className="flex items-center">
                <span className="mr-3">{item.icon}</span>
                <span>{item.description}</span>
            </div>
        )},
        { key: 'relativeTime', label: 'Time' },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Emails Sent" value={metrics.emailsSent.toLocaleString()} />
                <StatCard title="Emails Delivered" value={metrics.emailsDelivered.toLocaleString()} rate={`${metrics.deliveryRate} delivery rate`} />
                <StatCard title="Emails Opened" value={metrics.emailsOpened.toLocaleString()} rate={`${metrics.openRate} open rate`} />
                <StatCard title="Emails Replied" value={metrics.emailsReplied.toLocaleString()} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Campaign Performance</h2>
                    <CampaignChart campaigns={campaigns} />
                </Card>
                <Card>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
                    <Table headers={activityHeaders} data={recentActivity} />
                    {recentActivity.length === 0 && (
                        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                            No recent activity.
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;