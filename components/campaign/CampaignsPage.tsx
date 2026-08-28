import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Campaign, ContactList, CampaignStatus, Contact, EmailTemplate } from '../../types';
import { generateCampaignWithGemini, generateSubjectLinesWithGemini, SubjectLineOption } from '../../services/geminiService';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import RichTextEditor from './RichTextEditor';
import Modal from '../ui/Modal';
import Checkbox from '../ui/Checkbox';
import { useCountdown } from '../../hooks/useCountdown';

const SparklesIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a2.25 2.25 0 01-1.476-1.476L12 18.75l1.938-.648a2.25 2.25 0 011.476-1.476L17.25 15l.648 1.938a2.25 2.25 0 011.476 1.476L21 18.75l-1.938.648a2.25 2.25 0 01-1.476 1.476z" />
    </svg>
);
const BookmarkIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>;
const PaperAirplaneIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;
const XMarkIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const DeviceFloppyIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338A2.25 2.25 0 0017.088 3.75H15M12 13.5h.008v.008H12v-.008z" /></svg>;
const CalendarDaysIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h22.5" /></svg>;
const PaperClipIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.122 2.122l7.81-7.81" /></svg>;
const XCircleIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LightBulbIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.516 0c.85.493 1.508 1.333 1.508 2.316V18" /></svg>;


interface CampaignsPageProps {
  campaign: Campaign | null;
  onSave: (campaign: Omit<Campaign, 'id' | 'created_at' | 'user_id'> & { id?: number }) => Promise<boolean>;
  onClose: () => void;
  contactLists: ContactList[];
  onSaveAsTemplate: (template: Omit<EmailTemplate, 'id' | 'created_at' | 'user_id'>) => void;
}

type CampaignFormState = {
  id?: number;
  name: string;
  subject: string;
  body: string;
  recipient_ids: number[];
  scheduled_at?: string;
  status: CampaignStatus;
  attachment?: {
    name: string;
    content: string;
    type: string;
  };
}

const CampaignsPage: React.FC<CampaignsPageProps> = ({ campaign, onSave, onClose, contactLists, onSaveAsTemplate }) => {
    const getInitialState = (): CampaignFormState => ({
        name: '',
        subject: '',
        body: '',
        recipient_ids: [],
        status: 'draft',
        scheduled_at: undefined,
        attachment: undefined,
    });

  const [editedCampaign, setEditedCampaign] = useState<CampaignFormState>(getInitialState());
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [selectionMode, setSelectionMode] = useState<'all' | 'individual'>('all');
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  
  // AI Generator Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTone, setAiTone] = useState('Professional & Persuasive');
  const [aiAudience, setAiAudience] = useState('Customers & Leads');
  const [aiKeyPoints, setAiKeyPoints] = useState('');
  const [aiCta, setAiCta] = useState('');

  // AI Subject Lines Helper State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [subjectSuggestions, setSubjectSuggestions] = useState<SubjectLineOption[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const countdown = useCountdown(editedCampaign.scheduled_at);

  const selectedList = useMemo(() => contactLists.find(list => list.id === selectedListId), [selectedListId, contactLists]);

  useEffect(() => {
    if (campaign) {
      setEditedCampaign({
          ...getInitialState(),
          ...campaign,
      });

      if (campaign.recipient_ids.length > 0) {
        const parentList = contactLists.find(list => 
            campaign.recipient_ids.every(id => list.contacts.some(c => c.id === id))
        );
        
        if (parentList) {
            setSelectedListId(parentList.id);
            const isAllSelected = parentList.contacts.length === campaign.recipient_ids.length && 
                                  parentList.contacts.every(c => campaign.recipient_ids.includes(c.id));

            setSelectionMode(isAllSelected ? 'all' : 'individual');
        } else {
            setSelectedListId(null);
            setSelectionMode('all');
        }
      } else {
        setSelectedListId(null);
        setSelectionMode('all');
      }

    } else {
      setEditedCampaign(getInitialState());
      setSelectedListId(null);
      setSelectionMode('all');
    }
  }, [campaign, contactLists]);

  const handleChange = (field: keyof CampaignFormState, value: any) => {
    setEditedCampaign(prev => ({ ...prev, [field]: value }));
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE_MB = 5;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        alert(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
        event.target.value = '';
        return;
    }

    setIsAttaching(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const result = e.target?.result as string;
        const content = result.split(',')[1];
        
        handleChange('attachment', {
            name: file.name,
            type: file.type,
            content: content,
        });
        setIsAttaching(false);
    };

    reader.onerror = (error) => {
        console.error("Error reading file:", error);
        alert("Sorry, there was an error reading the file.");
        setIsAttaching(false);
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleRemoveAttachment = () => {
    handleChange('attachment', undefined);
  };

  const executeSave = async (status: CampaignStatus) => {
    const isScheduling = status === 'scheduled';
    const scheduledDate = editedCampaign.scheduled_at ? new Date(editedCampaign.scheduled_at) : null;
    if (isScheduling && (!scheduledDate || isNaN(scheduledDate.getTime()) || scheduledDate <= new Date())) {
        alert("Please select a valid future date and time to schedule.");
        return;
    }

    if (status === 'sent') {
        setIsSending(true);
        if (editedCampaign.recipient_ids.length === 0) {
            alert("No recipients selected. Cannot send campaign.");
            setIsSending(false);
            return;
        }

        const success = await onSave({ ...editedCampaign, status: 'sent', scheduled_at: undefined });
        setIsSending(false);

        if (success) {
            setIsSendConfirmOpen(false);
        }
    } else {
        const campaignToSave = { ...editedCampaign, status };
        if (status === 'draft') {
            delete campaignToSave.scheduled_at;
        }
        await onSave(campaignToSave);
    }
  };
  
  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (value) {
      const scheduledDate = new Date(value);
      if (!isNaN(scheduledDate.getTime())) {
          handleChange('scheduled_at', scheduledDate.toISOString());
      }
    } else {
      handleChange('scheduled_at', undefined);
    }
  };
  
  const handleGeneratePreview = async () => {
    if (!editedCampaign.name) {
      alert("Please enter a Campaign Name to generate content.");
      return;
    }
    setIsGeneratingPreview(true);
    try {
      const result = await generateCampaignWithGemini({
        campaignName: editedCampaign.name,
        tone: aiTone,
        targetAudience: aiAudience,
        keyPoints: aiKeyPoints,
        callToAction: aiCta,
      });

      if (result.subject) handleChange('subject', result.subject);
      if (result.body) handleChange('body', result.body);
      setIsAiModalOpen(false);
    } catch (e: any) {
      console.error("Error generating content with Gemini:", e);
      alert(`Failed to generate content: ${e.message || 'Please check Gemini API configuration.'}`);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleOpenSubjectHelper = async () => {
    if (!editedCampaign.name && !editedCampaign.body) {
      alert("Please provide either a Campaign Name or Email Body first.");
      return;
    }
    setIsSubjectModalOpen(true);
    setIsLoadingSubjects(true);
    try {
      const suggestions = await generateSubjectLinesWithGemini(
        editedCampaign.name,
        editedCampaign.body
      );
      setSubjectSuggestions(suggestions);
    } catch (err: any) {
      console.error("Error generating subject lines:", err);
      alert("Could not generate subject line suggestions.");
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const handleListChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const listId = e.target.value ? parseInt(e.target.value, 10) : null;
      setSelectedListId(listId);
      setSelectionMode('all'); 

      if (listId) {
          const list = contactLists.find(l => l.id === listId);
          handleChange('recipient_ids', list ? list.contacts.map(c => c.id) : []);
      } else {
          handleChange('recipient_ids', []);
      }
  };

  const handleModeChange = (mode: 'all' | 'individual') => {
      setSelectionMode(mode);
      if (mode === 'all' && selectedList) {
          handleChange('recipient_ids', selectedList.contacts.map(c => c.id));
      } else if (mode === 'individual') {
          handleChange('recipient_ids', []);
      }
  };

  const handleToggleContact = (contactId: number) => {
      const newIds = new Set(editedCampaign.recipient_ids);
      if (newIds.has(contactId)) {
          newIds.delete(contactId);
      } else {
          newIds.add(contactId);
      }
      handleChange('recipient_ids', Array.from(newIds));
  };
  
  const handleToggleAllInList = () => {
    if (!selectedList) return;
    const allIds = selectedList.contacts.map(c => c.id);
    const allSelected = allIds.length > 0 && allIds.every(id => editedCampaign.recipient_ids.includes(id));
    
    const currentIdsSet = new Set(editedCampaign.recipient_ids);
    if (allSelected) {
        allIds.forEach(id => currentIdsSet.delete(id));
    } else {
        allIds.forEach(id => currentIdsSet.add(id));
    }
    handleChange('recipient_ids', Array.from(currentIdsSet));
  };

  const handleConfirmSaveTemplate = () => {
    if (!newTemplateName.trim()) {
        alert('Please enter a name for the template.');
        return;
    }
    if (!editedCampaign.subject.trim() || !editedCampaign.body.trim()) {
        alert('Cannot save an empty template. Please provide a subject and body.');
        return;
    }

    onSaveAsTemplate({
        name: newTemplateName,
        subject: editedCampaign.subject,
        body: editedCampaign.body,
    });

    setIsSaveTemplateOpen(false);
    setNewTemplateName('');
  };

  const totalRecipients = editedCampaign.recipient_ids.length;
  
  const formatForDateTimeLocal = (isoString?: string) => {
    if (!isoString || typeof isoString !== 'string') return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60000));
    return localDate.toISOString().slice(0, 16);
  };
  
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return formatForDateTimeLocal(now.toISOString());
  };
  
  const canSchedule = useMemo(() => {
    if (!editedCampaign.scheduled_at) return false;
    const scheduledDate = new Date(editedCampaign.scheduled_at);
    return !isNaN(scheduledDate.getTime()) && scheduledDate > new Date();
  }, [editedCampaign.scheduled_at]);
  
  const canSend = !!editedCampaign.name && totalRecipients > 0;
  const canSaveTemplate = !!editedCampaign.subject.trim() && !!editedCampaign.body.trim();

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {campaign ? 'Edit Campaign' : 'Create New Campaign'}
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <div className="space-y-4">
                    <Input 
                        label="Campaign Name"
                        value={editedCampaign.name}
                        onChange={e => handleChange('name', e.target.value)}
                        placeholder="e.g., Q3 Product Launch"
                    />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Subject Line
                        </label>
                        <button
                          type="button"
                          onClick={handleOpenSubjectHelper}
                          className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center font-medium"
                        >
                          <LightBulbIcon className="h-3.5 w-3.5 mr-1" />
                          AI Suggestions
                        </button>
                      </div>
                      <Input 
                        value={editedCampaign.subject}
                        onChange={e => handleChange('subject', e.target.value)}
                        placeholder="e.g., Discover What's New"
                      />
                    </div>
                </div>
            </Card>
            <Card>
                <RichTextEditor 
                    label="Email Body"
                    value={editedCampaign.body}
                    onChange={value => handleChange('body', value)}
                />
            </Card>
        </div>
        <div>
            <Card>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recipients</h3>
                <label htmlFor="contact-list-selector" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact List</label>
                <select
                    id="contact-list-selector"
                    value={selectedListId ?? ''}
                    onChange={handleListChange}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4"
                >
                    <option value="">-- Select a List --</option>
                    {contactLists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
                </select>

                {selectedList && (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Button size="sm" variant={selectionMode === 'all' ? 'secondary' : 'ghost'} onClick={() => handleModeChange('all')} className="flex-1">All</Button>
                            <Button size="sm" variant={selectionMode === 'individual' ? 'secondary' : 'ghost'} onClick={() => handleModeChange('individual')} className="flex-1">Individual</Button>
                        </div>

                        {selectionMode === 'all' && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-2">All {selectedList.contactCount} contacts in this list will be targeted.</p>
                        )}

                        {selectionMode === 'individual' && (() => {
                            const allInListSelected = selectedList.contacts.length > 0 && selectedList.contacts.every(c => editedCampaign.recipient_ids.includes(c.id));
                            const someInListSelected = !allInListSelected && selectedList.contacts.some(c => editedCampaign.recipient_ids.includes(c.id));
                            return (
                                <div className="max-h-48 overflow-y-auto space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2 sticky top-0 bg-white dark:bg-gray-800">
                                        <Checkbox
                                            label="Select All in List"
                                            checked={allInListSelected}
                                            indeterminate={someInListSelected}
                                            onChange={handleToggleAllInList}
                                        />
                                    </div>
                                    {selectedList.contacts.map(contact => (
                                        <Checkbox
                                            key={contact.id}
                                            label={<span className="text-sm text-gray-800 dark:text-gray-300">{contact.name}</span>}
                                            checked={editedCampaign.recipient_ids.includes(contact.id)}
                                            onChange={() => handleToggleContact(contact.id)}
                                        />
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 font-medium">
                    {totalRecipients} contact{totalRecipients !== 1 ? 's' : ''} selected.
                </p>
            </Card>
            <Card className="mt-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Scheduling</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Select a future date and time to send this campaign automatically.
                </p>
                <Input
                    type="datetime-local"
                    label="Schedule Date & Time"
                    value={formatForDateTimeLocal(editedCampaign.scheduled_at)}
                    onChange={handleScheduleChange}
                    min={getMinDateTime()}
                />
            </Card>
            <Card className="mt-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Content & Attachments</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Generate content with AI or attach a file to your campaign.
                </p>
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <Button 
                            variant="secondary" 
                            onClick={() => setIsAiModalOpen(true)}
                            className="w-full"
                        >
                            <SparklesIcon className="h-4 w-4 mr-2 text-brand-500" />
                            AI Draft
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <Button 
                            variant="secondary" 
                            onClick={handleAttachClick}
                            className="w-full"
                            isLoading={isAttaching}
                            disabled={isAttaching}
                        >
                            <PaperClipIcon className="h-4 w-4 mr-2" />
                            {isAttaching ? 'Attaching...' : 'Attach File'}
                        </Button>
                    </div>
                    {editedCampaign.attachment && (
                        <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md flex items-center justify-between animate-fade-in">
                            <div className="flex items-center overflow-hidden">
                                <PaperClipIcon className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-800 dark:text-gray-300 truncate" title={editedCampaign.attachment.name}>
                                    {editedCampaign.attachment.name}
                                </span>
                            </div>
                            <button onClick={handleRemoveAttachment} className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-full transition-colors">
                                <XCircleIcon className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4">
        <Button variant="secondary" onClick={onClose}>
            <XMarkIcon className="h-5 w-5 mr-2" />
            Cancel
        </Button>
        <Button variant="secondary" onClick={() => executeSave('draft')}>
          <DeviceFloppyIcon className="h-5 w-5 mr-2" />
          {campaign?.id ? 'Save Changes' : 'Save as Draft'}
        </Button>
        <Button variant="ghost" onClick={() => setIsSaveTemplateOpen(true)} disabled={!canSaveTemplate}>
            <BookmarkIcon className="h-5 w-5 mr-2" />
            Save as Template
        </Button>
        <div className="flex-grow"></div>
        <Button 
          variant="primary" 
          onClick={() => executeSave('scheduled')} 
          disabled={!canSchedule}
          className="w-48 justify-center"
        >
          <CalendarDaysIcon className="h-5 w-5 mr-2" />
          {canSchedule && countdown ? (
              <span className="truncate">Schedule {countdown}</span>
          ) : (
              <span>{campaign?.status === 'scheduled' ? 'Update Schedule' : 'Schedule'}</span>
          )}
        </Button>
        <Button variant="primary" onClick={() => setIsSendConfirmOpen(true)} disabled={!canSend}>
          <PaperAirplaneIcon className="h-5 w-5 mr-2" />
          Send Now
        </Button>
      </div>

      <Modal isOpen={isSendConfirmOpen} onClose={() => setIsSendConfirmOpen(false)} title="Confirm Campaign Send">
          <p className="text-gray-700 dark:text-gray-300">
              You are about to send the campaign <strong className="text-gray-900 dark:text-white">"{editedCampaign.name}"</strong> to <strong className="text-gray-900 dark:text-white">{totalRecipients}</strong> recipient(s) immediately.
          </p>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">This action cannot be undone. Are you sure you want to proceed?</p>
          <div className="flex justify-end gap-4 pt-6">
              <Button type="button" variant="secondary" onClick={() => setIsSendConfirmOpen(false)} disabled={isSending}>Cancel</Button>
              <Button type="button" variant="primary" onClick={() => executeSave('sent')} isLoading={isSending}>
                <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                Confirm & Send
              </Button>
          </div>
      </Modal>

      <Modal isOpen={isSaveTemplateOpen} onClose={() => setIsSaveTemplateOpen(false)} title="Save as Template">
          <p className="text-gray-700 dark:text-gray-300 mb-4">Save the current subject and body as a reusable template.</p>
          <Input 
              label="Template Name"
              value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
              placeholder="e.g., Monthly Newsletter"
          />
          <div className="flex justify-end gap-4 pt-6">
              <Button type="button" variant="secondary" onClick={() => setIsSaveTemplateOpen(false)}>Cancel</Button>
              <Button type="button" variant="primary" onClick={handleConfirmSaveTemplate}>
                <DeviceFloppyIcon className="h-5 w-5 mr-2" />
                Save Template
              </Button>
          </div>
      </Modal>

      {/* AI Campaign Generator Modal */}
      <Modal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        title="✨ Generate Campaign with Gemini AI"
      >
        <div className="space-y-4">
          <Input
            label="Campaign Topic / Goal"
            value={editedCampaign.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Summer Special 20% Discount on Annual Plans"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tone of Voice
            </label>
            <select
              value={aiTone}
              onChange={(e) => setAiTone(e.target.value)}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Professional & Persuasive">Professional & Persuasive</option>
              <option value="Friendly & Conversational">Friendly & Conversational</option>
              <option value="Direct Value & High Converting">Direct Value & High Converting</option>
              <option value="Urgent & Limited-Time">Urgent & Limited-Time</option>
              <option value="Educational & Insightful">Educational & Insightful</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Key Value Points / Details (Optional)
            </label>
            <textarea
              rows={3}
              value={aiKeyPoints}
              onChange={(e) => setAiKeyPoints(e.target.value)}
              placeholder="e.g., Free 14-day trial, 24/7 dedicated support, 30% speed boost"
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2.5 text-gray-900 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <Input
            label="Call To Action (CTA)"
            value={aiCta}
            onChange={(e) => setAiCta(e.target.value)}
            placeholder="e.g., Claim Your Discount Today / Book a Demo"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={() => setIsAiModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleGeneratePreview}
              isLoading={isGeneratingPreview}
              disabled={!editedCampaign.name.trim()}
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              Generate Content
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Subject Line Suggestions Modal */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title="💡 AI Subject Line Suggestions"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generated tailored subject lines powered by Gemini 3.7:
          </p>

          {isLoadingSubjects ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
              <SparklesIcon className="h-8 w-8 text-brand-500 animate-spin mb-2" />
              <span>Analyzing campaign context & generating variations...</span>
            </div>
          ) : subjectSuggestions.length > 0 ? (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {subjectSuggestions.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    handleChange('subject', item.subject);
                    setIsSubjectModalOpen(false);
                  }}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-400 bg-white dark:bg-gray-800/80 cursor-pointer transition-all hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {item.subject}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-medium whitespace-nowrap">
                      {item.style}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.reasoning}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">No suggestions generated yet.</p>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button 
              size="sm"
              variant="secondary" 
              onClick={handleOpenSubjectHelper}
              isLoading={isLoadingSubjects}
            >
              🔄 Refresh Suggestions
            </Button>
            <Button variant="secondary" onClick={() => setIsSubjectModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
      
    </div>
  );
};

export default CampaignsPage;