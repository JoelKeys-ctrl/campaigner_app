import React, { useState, useEffect } from 'react';
import { EmailTemplate } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import RichTextEditor from '../campaign/RichTextEditor';

const XMarkIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const DeviceFloppyIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338A2.25 2.25 0 0017.088 3.75H15M12 13.5h.008v.008H12v-.008z" /></svg>;
const SparklesIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>;

const STARTER_PRESETS = [
    {
        name: 'Product Announcement',
        subject: 'Introducing {{company}}\'s Latest Innovation',
        body: `Dear {{name}},\n\nWe're thrilled to announce our newest release designed to help your team achieve more.\n\nHere is what you can look forward to:\n• Key Feature 1: Enhanced workflow speed\n• Key Feature 2: Deep integrations and automation\n• Key Feature 3: 24/7 dedicated assistance\n\nExperience it first-hand today!\n\nBest regards,\nThe {{company}} Team`
    },
    {
        name: 'Weekly Digest / Newsletter',
        subject: 'Your Weekly Insights from {{company}}',
        body: `Hi {{name}},\n\nHere are this week's top stories, industry insights, and updates curated just for you.\n\n1. Trending Topic: What leaders are focusing on\n2. Quick Tip of the Week: Boost your productivity\n3. Community Spotlight: Member success story\n\nHave questions or feedback? Just reply to this email!\n\nCheers,\n{{company}} Editorial Team`
    },
    {
        name: 'Exclusive VIP Discount',
        subject: 'Special Offer Just for You, {{name}}',
        body: `Dear {{name}},\n\nAs a valued member of our community, we'd like to extend an exclusive 20% discount on your next order.\n\nUse code: VIP20 at checkout.\n\nOffer valid through the end of this month.\n\nWarmly,\nThe {{company}} Team`
    }
];

interface TemplateEditorPageProps {
  template: EmailTemplate | null;
  onSave: (template: EmailTemplate) => void;
  onClose: () => void;
}

const TemplateEditorPage: React.FC<TemplateEditorPageProps> = ({ template, onSave, onClose }) => {
    const isNew = !template || template.id === 0;

    const [editedTemplate, setEditedTemplate] = useState<EmailTemplate>({
        id: 0,
        name: '',
        subject: '',
        body: '',
        created_at: new Date().toISOString()
    });

    useEffect(() => {
        if (template) {
            setEditedTemplate(template);
        } else {
            setEditedTemplate({
                id: 0,
                name: '',
                subject: '',
                body: '',
                created_at: new Date().toISOString()
            });
        }
    }, [template]);

    const handleChange = (field: keyof Omit<EmailTemplate, 'id' | 'created_at' | 'user_id'>, value: string) => {
        setEditedTemplate(prev => ({ ...prev, [field]: value }));
    };

    const handleApplyPreset = (preset: typeof STARTER_PRESETS[0]) => {
        setEditedTemplate(prev => ({
            ...prev,
            name: prev.name || preset.name,
            subject: preset.subject,
            body: preset.body
        }));
    };

    const handleSave = () => {
        if (!editedTemplate.name.trim()) {
            alert('Please provide a template name.');
            return;
        }
        if (!editedTemplate.subject.trim()) {
            alert('Please provide a subject line for this template.');
            return;
        }
        onSave(editedTemplate);
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {isNew ? 'Create New Template' : `Edit "${template?.name}"`}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {isNew 
                            ? 'Define a reusable email structure with personalization tokens.' 
                            : 'Update and refine your saved email template.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" onClick={onClose}>
                        <XMarkIcon className="h-4 w-4 mr-1.5" />
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        <DeviceFloppyIcon className="h-4 w-4 mr-1.5" />
                        {isNew ? 'Save Template' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            {/* Quick Starter Presets (if new template) */}
            {isNew && (
                <div className="p-4 rounded-xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900">
                    <div className="flex items-center gap-2 mb-2 text-brand-800 dark:text-brand-300 font-semibold text-sm">
                        <SparklesIcon className="h-4 w-4" />
                        <span>Quick Starter Presets (Optional)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {STARTER_PRESETS.map((preset, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleApplyPreset(preset)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-brand-300 dark:border-brand-700 hover:border-brand-500 text-gray-800 dark:text-gray-200 font-medium transition-all shadow-sm"
                            >
                                + {preset.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="space-y-6">
                <Card>
                    <div className="space-y-4">
                        <Input 
                            label="Template Name"
                            value={editedTemplate.name}
                            onChange={e => handleChange('name', e.target.value)}
                            placeholder="e.g., Monthly Newsletter / VIP Welcome"
                        />
                        <Input 
                            label="Default Subject Line"
                            value={editedTemplate.subject}
                            onChange={e => handleChange('subject', e.target.value)}
                            placeholder="e.g., Welcome to {{company}}, {{name}}!"
                        />
                    </div>
                </Card>
                <Card>
                    <RichTextEditor 
                        label="Template Body Content"
                        value={editedTemplate.body}
                        onChange={value => handleChange('body', value)}
                    />
                </Card>
            </div>
          
            <div className="pt-4 border-t border-gray-200 dark:border-brand-800 flex justify-end items-center gap-4">
                <Button variant="secondary" onClick={onClose}>
                    <XMarkIcon className="h-4 w-4 mr-1.5" />
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleSave}>
                    <DeviceFloppyIcon className="h-4 w-4 mr-1.5" />
                    {isNew ? 'Create Template' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );
};

export default TemplateEditorPage;