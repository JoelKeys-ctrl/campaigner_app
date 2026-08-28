import React, { useMemo } from 'react';
import { Campaign, Contact } from '../../types';
import Card from '../ui/Card';
import StatCard from '../dashboard/StatCard';
import Table from '../ui/Table';
import Button from '../ui/Button';
import CampaignStatusBadge from './CampaignStatusBadge';

const ArrowLeftIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);


interface CampaignReportPageProps {
  campaign: Campaign;
  allContacts: Contact[];
  onClose: () => void;
}

const CampaignReportPage: React.FC<CampaignReportPageProps> = ({ campaign, allContacts, onClose }) => {
    
    const recipients = useMemo(() => {
        return allContacts.filter(c => campaign.recipient_ids.includes(c.id));
    }, [campaign, allContacts]);

    const metrics = useMemo(() => {
        const emailsSent = recipients.length;
        const MOCK_DELIVERY_RATE = 0.985;
        const MOCK_OPEN_RATE = 0.452;
        const MOCK_REPLY_RATE = 0.15;

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
    }, [recipients]);

    const recipientHeaders = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'company', label: 'Company' },
        { key: 'status', label: 'Status (Mock)', render: () => <CampaignStatusBadge status="sent" /> },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <Button variant="ghost" onClick={onClose} className="mb-4">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Back to Campaigns
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{campaign.name}</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">Subject: {campaign.subject}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Emails Sent" value={metrics.emailsSent.toLocaleString()} />
                <StatCard title="Emails Delivered" value={metrics.emailsDelivered.toLocaleString()} rate={`${metrics.deliveryRate} delivery rate`} />
                <StatCard title="Emails Opened" value={metrics.emailsOpened.toLocaleString()} rate={`${metrics.openRate} open rate`} />
                <StatCard title="Emails Replied" value={metrics.emailsReplied.toLocaleString()} />
            </div>

            <Card>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recipients ({recipients.length})</h2>
                <Table headers={recipientHeaders} data={recipients} />
            </Card>
        </div>
    );
};

export default CampaignReportPage;