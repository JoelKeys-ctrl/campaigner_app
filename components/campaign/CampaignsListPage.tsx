import React, { useState, useEffect } from 'react';
import { Campaign } from '../../types';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Button from '../ui/Button';
import CampaignStatusBadge from './CampaignStatusBadge';
import Modal from '../ui/Modal';

const PlusIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);
const DocumentTextIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
const TrashIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const PencilIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>;
const ChartBarIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;


interface CampaignsListPageProps {
  campaigns: Campaign[];
  onEditCampaign: (campaign: Campaign) => void;
  onDeleteCampaign: (campaignId: number) => void;
  onCreateCampaign: () => void;
  onViewReport: (campaign: Campaign) => void;
  highlightedCampaignId: number | null;
  onClearHighlight: () => void;
}

const CampaignsListPage: React.FC<CampaignsListPageProps> = ({ campaigns, onEditCampaign, onDeleteCampaign, onCreateCampaign, onViewReport, highlightedCampaignId, onClearHighlight }) => {
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);

    useEffect(() => {
        if (highlightedCampaignId) {
            const timer = setTimeout(() => {
                onClearHighlight();
            }, 3000);
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

    const headers = [
        { key: 'name', label: 'Campaign Name' },
        { key: 'subject', label: 'Subject' },
        { key: 'status', label: 'Status', render: (c: Campaign) => <CampaignStatusBadge status={c.status} /> },
        { key: 'recipientCount', label: 'Recipients', render: (c: Campaign) => c.recipient_ids.length.toLocaleString() },
        {
            key: 'actions',
            label: 'Actions',
            render: (campaign: Campaign) => (
                <div className="flex items-center justify-center space-x-2">
                    {campaign.status === 'sent' && (
                        <Button variant="ghost" size="sm" onClick={() => onViewReport(campaign)} title="View Report" aria-label={`View report for ${campaign.name}`}>
                            <ChartBarIcon className="h-5 w-5" />
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onEditCampaign(campaign)} title="Edit" aria-label={`Edit campaign ${campaign.name}`}>
                        <PencilIcon className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openDeleteModal(campaign)} title="Delete" aria-label={`Delete campaign ${campaign.name}`} className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400">
                        <TrashIcon className="h-5 w-5" />
                    </Button>
                </div>
            )
        }
    ];

    const getRowClassName = (campaign: Campaign) => {
        return campaign.id === highlightedCampaignId ? 'bg-brand-100 dark:bg-brand-900/50' : '';
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
                <Button variant="primary" onClick={onCreateCampaign}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Campaign
                </Button>
            </div>
            <Card>
                <Table headers={headers} data={campaigns} rowClassName={getRowClassName} />
                {campaigns.length === 0 && (
                    <div className="text-center py-10">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <h3 className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">No campaigns found</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Get started by creating your first campaign.</p>
                    </div>
                )}
            </Card>
            <Modal 
                isOpen={isDeleteConfirmOpen} 
                onClose={() => setIsDeleteConfirmOpen(false)} 
                title="Delete Campaign"
            >
                <p className="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete the campaign <strong className="text-gray-900 dark:text-white">"{deletingCampaign?.name}"</strong>?
                </p>
                <p className="mt-2 text-red-600 dark:text-red-400/80 text-sm">This action is permanent and cannot be undone.</p>
                <div className="flex justify-end gap-4 pt-6">
                    <Button type="button" variant="secondary" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button type="button" variant="primary" className="!bg-red-600 hover:!bg-red-700 !focus:ring-red-500" onClick={handleConfirmDelete}>
                        Confirm Delete
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default CampaignsListPage;