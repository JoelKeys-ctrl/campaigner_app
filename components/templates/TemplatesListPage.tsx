import React, { useState } from 'react';
import { EmailTemplate } from '../../types';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

// Icons
const TrashIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const PencilIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>;
const EyeIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const PlusIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const CollectionIcon: React.FC<{className: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2m14 0H5" />
    </svg>
);
const RocketIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 2.18a14.98 14.98 0 00-2.17 6.16m5.84 2.58v-4.8m-5.84 4.8m5.84-4.8L9.63 2.18m-2.17 6.16a14.98 14.98 0 00-6.16 12.12 14.98 14.98 0 0012.12 6.16" />
    </svg>
);


interface TemplatesListPageProps {
  templates: EmailTemplate[];
  onDeleteTemplate: (templateId: number) => void;
  onNavigateToEditor: (template: EmailTemplate | null) => void;
  onCreateCampaignFromTemplate: (template: EmailTemplate) => void;
}

const TemplatesListPage: React.FC<TemplatesListPageProps> = ({ templates, onDeleteTemplate, onNavigateToEditor, onCreateCampaignFromTemplate }) => {
  const [previewingTemplate, setPreviewingTemplate] = useState<EmailTemplate | null>(null);

  const headers = [
    { key: 'name', label: 'Template Name' },
    { key: 'subject', label: 'Subject Line' },
    { 
      key: 'created_at', 
      label: 'Created At',
      render: (t: EmailTemplate) => {
        if (typeof t.created_at !== 'string' || t.created_at.trim() === '') {
          return <span className="text-gray-500">Invalid Date</span>;
        }
        const date = new Date(t.created_at);
        if (isNaN(date.getTime())) {
          return <span className="text-gray-500">Invalid Date</span>;
        }
        return date.toLocaleDateString();
      }
    },
    { key: 'actions', label: 'Actions', render: (t: EmailTemplate) => (
      <div className="flex items-center justify-end space-x-2">
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => onCreateCampaignFromTemplate(t)} 
            title="Create and send campaign with this template" 
            aria-label={`Send campaign using template ${t.name}`}
            className="flex items-center text-xs py-1 px-2.5"
          >
              <RocketIcon className="h-4 w-4 mr-1.5" />
              <span>Use as Campaign</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setPreviewingTemplate(t)} title="Preview Template" aria-label={`Preview template ${t.name}`}>
              <EyeIcon className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onNavigateToEditor(t)} title="Edit Template" aria-label={`Edit template ${t.name}`}>
              <PencilIcon className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDeleteTemplate(t.id)} title="Delete Template" aria-label={`Delete template ${t.name}`} className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400">
              <TrashIcon className="h-5 w-5" />
          </Button>
      </div>
    ) }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Templates</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Design reusable layouts, newsletters, and promotional structures.</p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => onNavigateToEditor(null)}
            className="flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-1.5" />
            New Template
          </Button>
      </div>
      <Card>
          <Table headers={headers} data={templates} />
          {templates.length === 0 && (
              <div className="text-center py-12">
                  <CollectionIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                  <h3 className="mt-3 text-base font-medium text-gray-800 dark:text-gray-200">No templates created yet</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Create reusable layouts directly or save them while drafting campaigns.
                  </p>
                  <Button 
                    variant="primary" 
                    onClick={() => onNavigateToEditor(null)}
                    className="mt-5"
                  >
                    <PlusIcon className="h-4 w-4 mr-1.5" />
                    Create Your First Template
                  </Button>
              </div>
          )}
      </Card>

      <Modal 
        isOpen={!!previewingTemplate} 
        onClose={() => setPreviewingTemplate(null)} 
        title={previewingTemplate?.name || 'Template Preview'}
      >
        <div className="space-y-4">
            <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-400">Subject</h4>
                <p className="p-2 rounded bg-gray-100 dark:bg-brand-800/50 mt-1 text-gray-800 dark:text-gray-200">{previewingTemplate?.subject}</p>
            </div>
            <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-400">Body</h4>
                <div className="p-2 rounded bg-gray-100 dark:bg-brand-800/50 whitespace-pre-wrap min-h-[10rem] mt-1 max-h-80 overflow-y-auto text-gray-800 dark:text-gray-200">
                    {previewingTemplate?.body}
                </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => {
                  if (previewingTemplate) {
                    onCreateCampaignFromTemplate(previewingTemplate);
                    setPreviewingTemplate(null);
                  }
                }}
              >
                <RocketIcon className="h-4 w-4 mr-1.5" />
                Use in New Campaign
              </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default TemplatesListPage;