import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Campaign, ContactList, CampaignStatus, EmailTemplate, EmailAttachment } from '../../types';
import { generateCampaignWithGemini, generateSubjectLinesWithGemini, SubjectLineOption } from '../../services/geminiService';
import { AttachmentList } from './AttachmentList';
import { WebhookPayloadModal } from './WebhookPayloadModal';
import { processFileToAttachment, normalizeCampaignAttachments } from '../../services/attachmentUtils';
import RichTextEditor from './RichTextEditor';
import { useCountdown } from '../../hooks/useCountdown';

const SparklesIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a2.25 2.25 0 01-1.476-1.476L12 18.75l1.938-.648a2.25 2.25 0 011.476-1.476L17.25 15l.648 1.938a2.25 2.25 0 011.476 1.476L21 18.75l-1.938.648a2.25 2.25 0 01-1.476 1.476z" />
  </svg>
);
const FolderOpenIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" /></svg>;
const PaperAirplaneIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;
const PaperClipIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.122 2.122l7.81-7.81" /></svg>;
const LightBulbIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.516 0c.85.493 1.508 1.333 1.508 2.316V18" /></svg>;

interface CampaignsPageProps {
  campaign: Campaign | null;
  onSave: (campaign: Omit<Campaign, 'id' | 'created_at' | 'user_id'> & { id?: number }) => Promise<boolean>;
  onClose: () => void;
  contactLists: ContactList[];
  templates?: EmailTemplate[];
  onSaveAsTemplate: (template: Omit<EmailTemplate, 'id' | 'created_at' | 'user_id'>) => void;
  n8nWebhookUrl?: string;
}

type CampaignFormState = {
  id?: number;
  name: string;
  subject: string;
  body: string;
  recipient_ids: number[];
  scheduled_at?: string;
  status: CampaignStatus;
  attachments: EmailAttachment[];
  attachment?: {
    name: string;
    content: string;
    type: string;
    size?: number;
  };
};

const CampaignsPage: React.FC<CampaignsPageProps> = ({
  campaign,
  onSave,
  onClose,
  contactLists,
  templates = [],
  onSaveAsTemplate,
  n8nWebhookUrl = '',
}) => {
  const getInitialState = (): CampaignFormState => ({
    name: '',
    subject: '',
    body: '',
    recipient_ids: [],
    status: 'draft',
    scheduled_at: undefined,
    attachments: [],
    attachment: undefined,
  });

  const [editedCampaign, setEditedCampaign] = useState<CampaignFormState>(getInitialState());
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [selectionMode, setSelectionMode] = useState<'all' | 'individual'>('all');
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [isFetchTemplateOpen, setIsFetchTemplateOpen] = useState(false);
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
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const [isSubjectDragOver, setIsSubjectDragOver] = useState(false);
  const countdown = useCountdown(editedCampaign.scheduled_at);

  const CAMPAIGN_TAGS = [
    { label: 'Full Name', tag: '{{name}}' },
    { label: 'First Name', tag: '{{first_name}}' },
    { label: 'Company', tag: '{{company}}' },
    { label: 'Email', tag: '{{email}}' },
  ];

  const handleSubjectDrop = (e: React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
    setIsSubjectDragOver(false);
    const tag = e.dataTransfer.getData('text/plain');
    if (!tag) return;

    const input = subjectInputRef.current;
    if (!input) {
      handleChange('subject', editedCampaign.subject + tag);
      return;
    }
    const start = input.selectionStart ?? editedCampaign.subject.length;
    const end = input.selectionEnd ?? editedCampaign.subject.length;
    const newSubject = editedCampaign.subject.slice(0, start) + tag + editedCampaign.subject.slice(end);
    handleChange('subject', newSubject);
    setTimeout(() => {
      input.focus();
      input.selectionStart = start + tag.length;
      input.selectionEnd = start + tag.length;
    }, 0);
  };

  const selectedList = useMemo(
    () => contactLists.find(list => list.id === selectedListId),
    [selectedListId, contactLists]
  );

  useEffect(() => {
    if (campaign) {
      const normalizedAttachments = normalizeCampaignAttachments(campaign);
      setEditedCampaign({
        ...getInitialState(),
        ...campaign,
        attachments: normalizedAttachments,
        attachment: normalizedAttachments[0]
          ? {
              name: normalizedAttachments[0].filename,
              type: normalizedAttachments[0].mimeType,
              content: normalizedAttachments[0].data,
              size: normalizedAttachments[0].size,
            }
          : undefined,
      });

      if (campaign.recipient_ids.length > 0) {
        const parentList = contactLists.find(list =>
          campaign.recipient_ids.every(id => list.contacts.some(c => c.id === id))
        );

        if (parentList) {
          setSelectedListId(parentList.id);
          const isAllSelected =
            parentList.contacts.length === campaign.recipient_ids.length &&
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const files: File[] = Array.from(fileList);
    setIsAttaching(true);
    setAttachmentError(null);

    const addedAttachments: EmailAttachment[] = [];
    const errors: string[] = [];

    let currentTotal = editedCampaign.attachments.reduce((sum, att) => sum + (att.size || 0), 0);

    for (const file of files) {
      const result = await processFileToAttachment(file, currentTotal);
      if (result.error) {
        errors.push(result.error);
      } else if (result.attachment) {
        addedAttachments.push(result.attachment);
        currentTotal += result.attachment.size;
      }
    }

    if (errors.length > 0) {
      setAttachmentError(errors.join(' '));
    }

    if (addedAttachments.length > 0) {
      setEditedCampaign(prev => {
        const nextAttachments = [...prev.attachments, ...addedAttachments];
        return {
          ...prev,
          attachments: nextAttachments,
          attachment: nextAttachments[0]
            ? {
                name: nextAttachments[0].filename,
                type: nextAttachments[0].mimeType,
                content: nextAttachments[0].data,
                size: nextAttachments[0].size,
              }
            : undefined,
        };
      });
    }

    setIsAttaching(false);
    event.target.value = '';
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setEditedCampaign(prev => {
      const nextAttachments = prev.attachments.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        attachments: nextAttachments,
        attachment: nextAttachments[0]
          ? {
              name: nextAttachments[0].filename,
              type: nextAttachments[0].mimeType,
              content: nextAttachments[0].data,
              size: nextAttachments[0].size,
            }
          : undefined,
      };
    });
  };

  const handleApplyPresetAttachments = (presets: EmailAttachment[]) => {
    setEditedCampaign(prev => ({
      ...prev,
      attachments: presets,
      attachment: presets[0]
        ? {
            name: presets[0].filename,
            type: presets[0].mimeType,
            content: presets[0].data,
            size: presets[0].size,
          }
        : undefined,
    }));
  };

  const executeSave = async (status: CampaignStatus) => {
    const isScheduling = status === 'scheduled';
    const scheduledDate = editedCampaign.scheduled_at ? new Date(editedCampaign.scheduled_at) : null;
    if (isScheduling && (!scheduledDate || isNaN(scheduledDate.getTime()) || scheduledDate <= new Date())) {
      alert('Please select a valid future date and time to schedule.');
      return;
    }

    const campaignPayload = {
      ...editedCampaign,
      status,
      attachments: editedCampaign.attachments,
      hasAttachment: editedCampaign.attachments.length > 0,
      attachment: editedCampaign.attachments[0]
        ? {
            name: editedCampaign.attachments[0].filename,
            type: editedCampaign.attachments[0].mimeType,
            content: editedCampaign.attachments[0].data,
            size: editedCampaign.attachments[0].size,
          }
        : undefined,
    };

    if (status === 'sent') {
      setIsSending(true);
      if (editedCampaign.recipient_ids.length === 0) {
        alert('No recipients selected. Cannot send campaign.');
        setIsSending(false);
        return;
      }

      const success = await onSave({ ...campaignPayload, status: 'sent', scheduled_at: undefined });
      setIsSending(false);

      if (success) {
        setIsSendConfirmOpen(false);
      }
    } else {
      const campaignToSave = { ...campaignPayload };
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
      alert('Please enter a Campaign Name to generate content.');
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
      console.error('Error generating content with Gemini:', e);
      alert(`Failed to generate content: ${e.message || 'Please check Gemini API configuration.'}`);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleOpenSubjectHelper = async () => {
    if (!editedCampaign.name && !editedCampaign.body) {
      alert('Please provide either a Campaign Name or Email Body first.');
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
      console.error('Error generating subject lines:', err);
      alert('Could not generate subject line suggestions.');
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
    const allSelected =
      allIds.length > 0 && allIds.every(id => editedCampaign.recipient_ids.includes(id));

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
    const localDate = new Date(date.getTime() - offset * 60000);
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
    <div className="space-y-6 text-gray-800 dark:text-gray-100 font-sans -mt-1 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              ← Campaigns
            </button>
            <span className="text-gray-300 dark:text-gray-700">/</span>
            <span className="text-xs font-semibold text-[#0b7b50] dark:text-emerald-400">
              {campaign ? 'Edit Campaign' : 'New Campaign'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white tracking-tight">
            {campaign ? 'Edit Campaign' : 'Create New Campaign'}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {templates.length > 0 && (
            <button
              type="button"
              onClick={() => setIsFetchTemplateOpen(true)}
              className="inline-flex items-center gap-1.5 bg-white dark:bg-[#18202c] border border-slate-200/80 dark:border-gray-800 rounded-full px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-xs hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer transition-colors"
            >
              <FolderOpenIcon className="h-3.5 w-3.5 text-gray-500" />
              <span>Fetch Template</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-[#0b7b50] hover:bg-[#09734a] text-white rounded-full px-4 py-2 text-xs font-bold shadow-md shadow-[#0b7b50]/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            <span>AI Draft</span>
          </button>
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Campaign Messaging */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Title & Subject Line */}
          <div className="bg-white dark:bg-[#18202c] rounded-[24px] p-5 sm:p-6 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1.5">
                Campaign Name
              </label>
              <input
                type="text"
                value={editedCampaign.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="e.g., Q3 Product Launch or High-Intent Follow-Up"
                className="w-full bg-slate-50 dark:bg-[#11161f] border border-slate-200/80 dark:border-gray-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b7b50] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-900 dark:text-white">
                  Subject Line
                </label>
                <button
                  type="button"
                  onClick={handleOpenSubjectHelper}
                  className="text-[11px] font-semibold text-[#0b7b50] dark:text-emerald-400 bg-[#e7f7f0] dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full hover:bg-[#d8f3e5] dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                >
                  AI Suggestions
                </button>
              </div>
              <input
                ref={subjectInputRef}
                type="text"
                value={editedCampaign.subject}
                onChange={e => handleChange('subject', e.target.value)}
                onDragOver={e => {
                  e.preventDefault();
                  setIsSubjectDragOver(true);
                }}
                onDragLeave={() => setIsSubjectDragOver(false)}
                onDrop={handleSubjectDrop}
                placeholder="e.g., Quick question about your Q3 goals, {{name}}"
                className={`w-full bg-slate-50 dark:bg-[#11161f] border rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b7b50] transition-all ${
                  isSubjectDragOver
                    ? 'border-[#0b7b50] ring-2 ring-[#0b7b50]/30 bg-emerald-50/40 dark:bg-emerald-950/30'
                    : 'border-slate-200/80 dark:border-gray-800'
                }`}
              />
            </div>

            {/* Personalization Tags Bar (Draggable into Subject or Body) */}
            <div className="pt-2 border-t border-slate-100 dark:border-gray-800/80">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-medium text-gray-400 shrink-0">
                  Personalisation tags:
                </span>
                {CAMPAIGN_TAGS.map(({ label, tag }) => (
                  <span
                    key={tag}
                    draggable
                    onDragStart={e => e.dataTransfer.setData('text/plain', tag)}
                    onClick={() => {
                      if (document.activeElement === subjectInputRef.current) {
                        const input = subjectInputRef.current;
                        const start = input?.selectionStart ?? editedCampaign.subject.length;
                        const end = input?.selectionEnd ?? editedCampaign.subject.length;
                        handleChange('subject', editedCampaign.subject.slice(0, start) + tag + editedCampaign.subject.slice(end));
                      } else {
                        handleChange('body', editedCampaign.body ? `${editedCampaign.body} ${tag}` : tag);
                      }
                    }}
                    title="Drag this tag into Subject Line or Email Body"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e7f7f0] dark:bg-emerald-950/60 text-[#0b7b50] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/50 cursor-grab active:cursor-grabbing hover:bg-[#d8f3e5] dark:hover:bg-emerald-900/50 hover:scale-105 active:scale-95 transition-all shadow-2xs select-none"
                  >
                    <span>{tag}</span>
                    <span className="text-[10px] text-emerald-700/60 dark:text-emerald-300/60 font-normal">({label})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Rich Text Editor & Personalization Tags */}
          <div className="bg-white dark:bg-[#18202c] rounded-[24px] p-5 sm:p-6 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
            <RichTextEditor
              label="Email Body & Personalization"
              value={editedCampaign.body}
              onChange={value => handleChange('body', value)}
            />
          </div>
        </div>

        {/* Right Column: Audience, Scheduling, Attachments */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Audience & Contact Selection */}
          <div className="bg-white dark:bg-[#18202c] rounded-[24px] p-5 sm:p-6 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight mb-3">
              Target Audience
            </h3>

            <label
              htmlFor="contact-list-selector"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Contact List
            </label>
            <select
              id="contact-list-selector"
              value={selectedListId ?? ''}
              onChange={handleListChange}
              className="w-full bg-slate-50 dark:bg-[#11161f] border border-slate-200/80 dark:border-gray-800 rounded-2xl py-2.5 px-3.5 text-xs text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0b7b50] mb-3 transition-all"
            >
              <option value="">-- Choose Contact List --</option>
              {contactLists.map(list => (
                <option key={list.id} value={list.id}>
                  {list.name} ({list.contactCount} contacts)
                </option>
              ))}
            </select>

            {selectedList && (
              <div className="space-y-3 pt-1">
                {/* Segment Switcher: All vs Individual */}
                <div className="inline-flex p-0.5 bg-slate-100 dark:bg-gray-800 rounded-full text-xs w-full">
                  <button
                    type="button"
                    onClick={() => handleModeChange('all')}
                    className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      selectionMode === 'all'
                        ? 'bg-white dark:bg-[#18202c] text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    All in List ({selectedList.contactCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('individual')}
                    className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      selectionMode === 'individual'
                        ? 'bg-white dark:bg-[#18202c] text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    Individual Selection
                  </button>
                </div>

                {selectionMode === 'individual' && (() => {
                  const allInListSelected =
                    selectedList.contacts.length > 0 &&
                    selectedList.contacts.every(c => editedCampaign.recipient_ids.includes(c.id));

                  return (
                    <div className="max-h-52 overflow-y-auto space-y-1.5 border border-slate-100 dark:border-gray-800 rounded-2xl p-2 bg-slate-50/30 dark:bg-[#11161f]/40">
                      <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-100 dark:border-gray-800 px-1">
                        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                          Contacts
                        </span>
                        <button
                          type="button"
                          onClick={handleToggleAllInList}
                          className="text-[11px] font-semibold text-[#0b7b50] hover:underline"
                        >
                          {allInListSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      {selectedList.contacts.map(contact => {
                        const isChecked = editedCampaign.recipient_ids.includes(contact.id);
                        return (
                          <label
                            key={contact.id}
                            className="flex items-center gap-2.5 p-1.5 hover:bg-slate-100 dark:hover:bg-gray-800/60 rounded-xl cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleContact(contact.id)}
                              className="rounded border-gray-300 text-[#0b7b50] focus:ring-[#0b7b50] w-3.5 h-3.5"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                {contact.name}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate">{contact.email}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-gray-800 mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-400">Target Reach:</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#e7f7f0] dark:bg-emerald-950/60 text-[#0b7b50] dark:text-emerald-300">
                {totalRecipients.toLocaleString()} {totalRecipients === 1 ? 'Contact' : 'Contacts'}
              </span>
            </div>
          </div>

          {/* Card 2: Scheduling */}
          <div className="bg-white dark:bg-[#18202c] rounded-[24px] p-5 sm:p-6 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight mb-3">
              Schedule Delivery
            </h3>

            <div>
              <input
                type="datetime-local"
                value={formatForDateTimeLocal(editedCampaign.scheduled_at)}
                onChange={handleScheduleChange}
                min={getMinDateTime()}
                className="w-full bg-slate-50 dark:bg-[#11161f] border border-slate-200/80 dark:border-gray-800 rounded-2xl py-2 px-3 text-xs text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0b7b50]"
              />
              {countdown && (
                <div className="mt-2.5 p-2 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 rounded-xl text-[11px] text-amber-700 dark:text-amber-300 flex items-center justify-between">
                  <span>Queue countdown:</span>
                  <span className="font-bold">{countdown}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Attachments & Webhook */}
          <div className="bg-white dark:bg-[#18202c] rounded-[24px] p-5 sm:p-6 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
                Attachments
              </h3>
              <button
                type="button"
                onClick={() => setIsPayloadModalOpen(true)}
                className="text-[11px] font-semibold text-[#0b7b50] dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Payload Inspector
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleAttachClick}
                disabled={isAttaching}
                className="w-full py-2 px-3 rounded-full text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-center cursor-pointer"
              >
                {isAttaching ? 'Attaching files...' : 'Add Attachments'}
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.rtf"
              />

              {attachmentError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 rounded-xl text-[11px] border border-rose-200/60 dark:border-rose-900/40">
                  {attachmentError}
                </div>
              )}

              <AttachmentList
                attachments={editedCampaign.attachments}
                onRemoveAttachment={handleRemoveAttachment}
                disabled={isAttaching}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="sticky bottom-4 z-40 bg-white/95 dark:bg-[#18202c]/95 backdrop-blur-md rounded-[24px] p-4 border border-slate-200/80 dark:border-gray-800 shadow-xl flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => executeSave('draft')}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
          >
            {campaign?.id ? 'Save Changes' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={() => setIsSaveTemplateOpen(true)}
            disabled={!canSaveTemplate}
            className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-40 transition-colors cursor-pointer"
          >
            Save as Template
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => executeSave('scheduled')}
            disabled={!canSchedule}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 disabled:opacity-40 transition-all cursor-pointer"
          >
            {canSchedule && countdown ? `Schedule in ${countdown}` : 'Schedule Campaign'}
          </button>

          <button
            type="button"
            onClick={() => setIsSendConfirmOpen(true)}
            disabled={!canSend}
            className="inline-flex items-center gap-2 bg-[#0b7b50] hover:bg-[#09734a] text-white rounded-full px-6 py-2 text-xs font-bold shadow-md shadow-[#0b7b50]/20 disabled:opacity-40 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
            <span>Send Now ({totalRecipients})</span>
          </button>
        </div>
      </div>

      {/* Confirm Send Modal with rounded-[28px] geometry */}
      {isSendConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-sm select-none overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-[#18202c] rounded-[28px] border border-slate-200/80 dark:border-gray-800 shadow-2xl overflow-hidden my-auto flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                  Confirm Campaign Send
                </h2>
                <p className="text-xs text-gray-400 font-normal mt-0.5">
                  Immediate transmission through n8n webhook
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSendConfirmOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-gray-700 dark:text-gray-300">
                You are about to send{' '}
                <strong className="text-gray-900 dark:text-white font-semibold">
                  &ldquo;{editedCampaign.name}&rdquo;
                </strong>{' '}
                to{' '}
                <strong className="text-gray-900 dark:text-white font-semibold">
                  {totalRecipients} recipient(s)
                </strong>{' '}
                immediately.
              </p>

              {editedCampaign.attachments.length > 0 ? (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#11161f] border border-slate-100 dark:border-gray-800 text-xs">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    Attachments ({editedCampaign.attachments.length}):
                  </span>
                  <ul className="mt-1 space-y-0.5 text-gray-500">
                    {editedCampaign.attachments.map((att, i) => (
                      <li key={i} className="truncate">
                        • {att.filename}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-[11px] text-gray-400">📎 No attachments included.</p>
              )}

              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl text-[11px] text-amber-700 dark:text-amber-300">
                Please verify subject line and recipient list. Sent dispatches cannot be recalled.
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-[#131923] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSendConfirmOpen(false)}
                disabled={isSending}
                className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeSave('sent')}
                disabled={isSending}
                className="px-6 py-2 rounded-full text-xs font-bold bg-[#0b7b50] hover:bg-[#09734a] text-white shadow-md shadow-[#0b7b50]/20 transition-all flex items-center gap-1.5"
              >
                <PaperAirplaneIcon className="h-3.5 w-3.5" />
                <span>{isSending ? 'Sending Dispatches...' : 'Confirm & Send'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save as Template Modal */}
      {isSaveTemplateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-sm select-none overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-[#18202c] rounded-[28px] border border-slate-200/80 dark:border-gray-800 shadow-2xl overflow-hidden my-auto flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                  Save as Template
                </h2>
                <p className="text-xs text-gray-400 font-normal mt-0.5">
                  Store current subject &amp; body for future campaigns
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveTemplateOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3">
              <label className="block text-xs font-semibold text-gray-900 dark:text-white">
                Template Name
              </label>
              <input
                type="text"
                value={newTemplateName}
                onChange={e => setNewTemplateName(e.target.value)}
                placeholder="e.g., Monthly Product Showcase"
                className="w-full bg-slate-50 dark:bg-[#11161f] border border-slate-200/80 dark:border-gray-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b7b50]"
              />
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-[#131923] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSaveTemplateOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveTemplate}
                className="px-5 py-2 rounded-full text-xs font-bold bg-[#0b7b50] hover:bg-[#09734a] text-white shadow-sm"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Campaign Generator Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-sm select-none overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#18202c] rounded-[28px] border border-slate-200/80 dark:border-gray-800 shadow-2xl overflow-hidden my-auto flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-[#0b7b50]" />
                  <span>Generate Campaign with Gemini AI</span>
                </h2>
                <p className="text-xs text-gray-400 font-normal mt-0.5">
                  AI will draft an engaging subject and high-converting copy
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                  Campaign Goal / Topic
                </label>
                <input
                  type="text"
                  value={editedCampaign.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="e.g., Summer 20% Discount on Annual Plans"
                  className="w-full bg-slate-50 dark:bg-[#11161f] border border-slate-200/80 dark:border-gray-800 rounded-2xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b7b50]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                  Tone of Voice
                </label>
                <select
                  value={aiTone}
                  onChange={e => setAiTone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#11161f] border border-slate-200/80 dark:border-gray-800 rounded-2xl py-2 px-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b7b50]"
                >
                  <option value="Professional & Persuasive">Professional &amp; Persuasive</option>
                  <option value="Friendly & Conversational">Friendly &amp; Conversational</option>
                  <option value="Direct Value & High Converting">Direct Value &amp; High Converting</option>
                  <option value="Urgent & Limited-Time">Urgent &amp; Limited-Time</option>
                  <option value="Educational & Insightful">Educational &amp; Insightful</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                  Key Value Points (Optional)
                </label>
                <textarea
                  rows={3}
                  value={aiKeyPoints}
                  onChange={e => setAiKeyPoints(e.target.value)}
                  placeholder="e.g., Free 14-day trial, 24/7 dedicated support, 30% faster setup"
                  className="w-full bg-slate-50 dark:bg-[#11161f] border border-slate-200/80 dark:border-gray-800 rounded-2xl p-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b7b50]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                  Call To Action (CTA)
                </label>
                <input
                  type="text"
                  value={aiCta}
                  onChange={e => setAiCta(e.target.value)}
                  placeholder="e.g., Claim Your Discount / Schedule a Quick Call"
                  className="w-full bg-slate-50 dark:bg-[#11161f] border border-slate-200/80 dark:border-gray-800 rounded-2xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b7b50]"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-[#131923] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGeneratePreview}
                disabled={isGeneratingPreview || !editedCampaign.name.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold bg-[#0b7b50] hover:bg-[#09734a] text-white shadow-md shadow-[#0b7b50]/20 disabled:opacity-50"
              >
                <SparklesIcon className="h-3.5 w-3.5" />
                <span>{isGeneratingPreview ? 'Drafting with Gemini...' : 'Generate Content'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Subject Suggestions Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-sm select-none overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#18202c] rounded-[28px] border border-slate-200/80 dark:border-gray-800 shadow-2xl overflow-hidden my-auto flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                  <LightBulbIcon className="h-5 w-5 text-amber-500" />
                  <span>AI Subject Line Suggestions</span>
                </h2>
                <p className="text-xs text-gray-400 font-normal mt-0.5">
                  Tailored subject line variations with open-rate analysis
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {isLoadingSubjects ? (
                <div className="py-12 text-center text-gray-400 text-xs flex flex-col items-center">
                  <SparklesIcon className="h-6 w-6 text-[#0b7b50] animate-spin mb-2" />
                  <span>Analyzing campaign context and generating options...</span>
                </div>
              ) : subjectSuggestions.length > 0 ? (
                <div className="space-y-2.5">
                  {subjectSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        handleChange('subject', item.subject);
                        setIsSubjectModalOpen(false);
                      }}
                      className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-gray-800 hover:border-[#0b7b50] dark:hover:border-emerald-500 bg-slate-50/40 dark:bg-[#11161f] cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white text-xs">
                          {item.subject}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e7f7f0] text-[#0b7b50] dark:bg-emerald-950 dark:text-emerald-300 font-bold whitespace-nowrap">
                          {item.style}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {item.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">No suggestions generated yet.</p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-[#131923] flex items-center justify-between">
              <button
                type="button"
                onClick={handleOpenSubjectHelper}
                disabled={isLoadingSubjects}
                className="text-xs font-semibold text-[#0b7b50] hover:underline"
              >
                🔄 Refresh Suggestions
              </button>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fetch Template Modal */}
      {isFetchTemplateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-sm select-none overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#18202c] rounded-[28px] border border-slate-200/80 dark:border-gray-800 shadow-2xl overflow-hidden my-auto flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                  <FolderOpenIcon className="h-5 w-5 text-gray-500" />
                  <span>Fetch from Saved Templates</span>
                </h2>
                <p className="text-xs text-gray-400 font-normal mt-0.5">
                  Click a template below to load its subject and message body
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFetchTemplateOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-2.5 max-h-[60vh] overflow-y-auto">
              {templates.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => {
                    setEditedCampaign(prev => ({
                      ...prev,
                      name: prev.name || tpl.name,
                      subject: tpl.subject,
                      body: tpl.body,
                    }));
                    setIsFetchTemplateOpen(false);
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-gray-800 hover:border-[#0b7b50] bg-slate-50/40 dark:bg-[#11161f] cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white text-xs">
                      {tpl.name}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(tpl.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 truncate">
                    <span className="font-medium text-gray-400">Subject:</span> {tpl.subject}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-[#131923] flex justify-end">
              <button
                type="button"
                onClick={() => setIsFetchTemplateOpen(false)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Payload Inspector Modal */}
      <WebhookPayloadModal
        isOpen={isPayloadModalOpen}
        onClose={() => setIsPayloadModalOpen(false)}
        campaignName={editedCampaign.name}
        subject={editedCampaign.subject}
        body={editedCampaign.body}
        currentAttachments={editedCampaign.attachments}
        onApplyPresetAttachments={handleApplyPresetAttachments}
        webhookUrl={n8nWebhookUrl}
        recipientEmail={selectedList?.contacts[0]?.email || 'rubaimam3@gmail.com'}
        recipientName={selectedList?.contacts[0]?.name || 'Ruba'}
      />
    </div>
  );
};

export default CampaignsPage;
