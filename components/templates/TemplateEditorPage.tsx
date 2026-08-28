import React, { useState, useEffect } from 'react';
import { EmailTemplate } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import RichTextEditor from '../campaign/RichTextEditor';

const XMarkIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const DeviceFloppyIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338A2.25 2.25 0 0017.088 3.75H15M12 13.5h.008v.008H12v-.008z" /></svg>;

interface TemplateEditorPageProps {
  template: EmailTemplate | null;
  onSave: (template: EmailTemplate) => void;
  onClose: () => void;
}

const TemplateEditorPage: React.FC<TemplateEditorPageProps> = ({ template, onSave, onClose }) => {
    const [editedTemplate, setEditedTemplate] = useState<EmailTemplate>({
        id: 0, name: '', subject: '', body: '', createdAt: ''
    });

    useEffect(() => {
        if (template) {
            setEditedTemplate(template);
        }
    }, [template]);

    const handleChange = (field: keyof Omit<EmailTemplate, 'id' | 'createdAt'>, value: string) => {
        setEditedTemplate(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!editedTemplate.name.trim() || !editedTemplate.subject.trim()) {
            alert('Template name and subject are required.');
            return;
        }
        onSave(editedTemplate);
    };

    if (!template) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-700 dark:text-gray-400">No template selected for editing.</p>
                <Button onClick={onClose} className="mt-4">Go Back</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Edit Template
            </h1>
            
            <div className="space-y-6">
                <Card>
                    <div className="space-y-4">
                        <Input 
                            label="Template Name"
                            value={editedTemplate.name}
                            onChange={e => handleChange('name', e.target.value)}
                            placeholder="e.g., Monthly Newsletter"
                        />
                        <Input 
                            label="Subject Line"
                            value={editedTemplate.subject}
                            onChange={e => handleChange('subject', e.target.value)}
                            placeholder="e.g., Your Monthly Update"
                        />
                    </div>
                </Card>
                <Card>
                    <RichTextEditor 
                        label="Email Body"
                        value={editedTemplate.body}
                        onChange={value => handleChange('body', value)}
                    />
                </Card>
            </div>
          
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-brand-800 flex items-center gap-4">
                <Button variant="secondary" onClick={onClose}>
                    <XMarkIcon className="h-5 w-5 mr-2" />
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleSave}>
                    <DeviceFloppyIcon className="h-5 w-5 mr-2" />
                    Save Changes
                </Button>
            </div>
        </div>
    );
};

export default TemplateEditorPage;