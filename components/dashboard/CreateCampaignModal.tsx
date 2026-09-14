import React, { useState, useMemo, useRef } from 'react';
import { Campaign, ContactList, EmailTemplate, CampaignStatus, Contact } from '../../types';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaignData: Omit<Campaign, 'id' | 'created_at' | 'user_id'> & { id?: number }) => Promise<boolean>;
  contactLists: ContactList[];
  templates?: EmailTemplate[];
}

type EnrichedContact = Contact & {
  listName: string;
};

const PERSONALIZATION_TAGS = [
  { label: 'Full Name', token: '{{name}}', hint: 'Recipient full name' },
  { label: 'First Name', token: '{{first_name}}', hint: 'Recipient first name' },
  { label: 'Last Name', token: '{{last_name}}', hint: 'Recipient last name' },
  { label: 'Email', token: '{{email}}', hint: 'Recipient email address' },
  { label: 'Company', token: '{{company}}', hint: 'Recipient company name' },
];

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contactLists,
  templates = [],
}) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<CampaignStatus>('draft');
  const [scheduledAt, setScheduledAt] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [audienceView, setAudienceView] = useState<'contacts' | 'lists'>('contacts');
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field refs and drag states for personalization tags
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [lastFocusedTarget, setLastFocusedTarget] = useState<'subject' | 'body'>('body');
  const [isDraggingOverSubject, setIsDraggingOverSubject] = useState(false);
  const [isDraggingOverBody, setIsDraggingOverBody] = useState(false);
  const [draggedTag, setDraggedTag] = useState<string | null>(null);

  // Insertion helper for cursor / drop location
  const insertTagAtCursor = (
    inputEl: HTMLInputElement | HTMLTextAreaElement | null,
    tagToken: string,
    currentValue: string,
    setValue: (val: string) => void
  ) => {
    if (!inputEl) {
      setValue(currentValue ? `${currentValue} ${tagToken}` : tagToken);
      return;
    }

    const start = inputEl.selectionStart ?? currentValue.length;
    const end = inputEl.selectionEnd ?? currentValue.length;
    const newValue = currentValue.slice(0, start) + tagToken + currentValue.slice(end);
    setValue(newValue);

    setTimeout(() => {
      inputEl.focus();
      const newPos = start + tagToken.length;
      inputEl.setSelectionRange(newPos, newPos);
    }, 10);
  };

  // Flatten and deduplicate all uploaded contacts across all lists
  const allUploadedContacts: EnrichedContact[] = useMemo(() => {
    const map = new Map<number, EnrichedContact>();
    contactLists.forEach(list => {
      (list.contacts || []).forEach(contact => {
        if (!map.has(contact.id)) {
          map.set(contact.id, {
            ...contact,
            listName: list.name,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [contactLists]);

  // Filter contacts by search query
  const filteredContacts = useMemo(() => {
    const q = contactSearchQuery.trim().toLowerCase();
    if (!q) return allUploadedContacts;
    return allUploadedContacts.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.company && c.company.toLowerCase().includes(q)) ||
      (c.listName && c.listName.toLowerCase().includes(q))
    );
  }, [allUploadedContacts, contactSearchQuery]);

  if (!isOpen) return null;

  // Toggle an individual contact
  const toggleContactSelection = (contactId: number) => {
    setSelectedContactIds(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  // Toggle all contacts belonging to a specific list
  const toggleListSelection = (list: ContactList) => {
    const listContactIds = (list.contacts || []).map(c => c.id);
    const allSelected = listContactIds.every(id => selectedContactIds.includes(id));

    if (allSelected) {
      setSelectedContactIds(prev => prev.filter(id => !listContactIds.includes(id)));
    } else {
      setSelectedContactIds(prev => Array.from(new Set([...prev, ...listContactIds])));
    }
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredContacts.map(c => c.id);
    setSelectedContactIds(prev => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleDeselectAll = () => {
    setSelectedContactIds([]);
  };

  const handleApplyTemplate = (templateId: number) => {
    const tmpl = templates.find(t => t.id === templateId);
    if (tmpl) {
      setSubject(tmpl.subject);
      setBody(tmpl.body);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();

    if (!trimmedName) {
      setErrorMessage('Please provide a campaign name.');
      return;
    }
    if (!trimmedSubject) {
      setErrorMessage('Please provide an email subject line.');
      return;
    }
    if (status === 'sent' && selectedContactIds.length === 0) {
      setErrorMessage('Please select at least one contact to send the campaign immediately.');
      return;
    }
    if (status === 'scheduled') {
      if (!scheduledAt) {
        setErrorMessage('Please select a date and time for scheduled dispatch.');
        return;
      }
      const scheduleTime = new Date(scheduledAt).getTime();
      if (isNaN(scheduleTime) || scheduleTime <= Date.now()) {
        setErrorMessage('Please select a future date and time for scheduling.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const success = await onSave({
        name: trimmedName,
        subject: trimmedSubject,
        body: trimmedBody,
        recipient_ids: selectedContactIds,
        status,
        scheduled_at: status === 'scheduled' ? new Date(scheduledAt).toISOString() : undefined,
      });

      if (success) {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-sm select-none overflow-y-auto">
      {/* Modal Dialog styled with the Quixotic dashboard aesthetic */}
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-[#18202c] rounded-[28px] border border-slate-200/80 dark:border-gray-800 shadow-2xl overflow-hidden my-auto flex flex-col transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header matching dashboard typography */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Create New Campaign
            </h2>
            <p className="text-xs text-gray-400 font-normal mt-0.5">
              Set up campaign details and choose uploaded contacts for outreach.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center text-sm font-semibold transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[78vh]">
          {errorMessage && (
            <div className="p-3 text-xs text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 rounded-2xl">
              {errorMessage}
            </div>
          )}

          {/* Campaign Name */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Campaign Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Q3 Product Announcement"
              className="w-full bg-slate-50 dark:bg-[#11161f] border border-slate-200 dark:border-gray-800 rounded-2xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b7b50] focus:border-transparent transition-all"
            />
          </div>

          {/* Email Subject Line & Template selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Email Subject
              </label>
              {templates.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>Template:</span>
                  <select
                    onChange={e => {
                      if (e.target.value) handleApplyTemplate(Number(e.target.value));
                    }}
                    defaultValue=""
                    className="bg-transparent border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0b7b50]"
                  >
                    <option value="" disabled>Load a template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id} className="dark:bg-[#18202c]">
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <input
              ref={subjectInputRef}
              type="text"
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              onFocus={() => setLastFocusedTarget('subject')}
              onDragOver={e => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                setIsDraggingOverSubject(true);
              }}
              onDragLeave={() => setIsDraggingOverSubject(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDraggingOverSubject(false);
                const token = e.dataTransfer.getData('text/plain') || draggedTag;
                if (token) {
                  insertTagAtCursor(subjectInputRef.current, token, subject, setSubject);
                }
              }}
              placeholder="e.g. Exciting updates inside!"
              className={`w-full bg-slate-50 dark:bg-[#11161f] border rounded-2xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b7b50] focus:border-transparent transition-all ${
                isDraggingOverSubject
                  ? 'border-[#0b7b50] ring-2 ring-[#0b7b50]/50 bg-emerald-50/30 dark:bg-emerald-950/30'
                  : 'border-slate-200 dark:border-gray-800'
              }`}
            />
          </div>

          {/* Audience: Selection of Uploaded Contacts */}
          <div className="border border-slate-200/80 dark:border-gray-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-[#131923]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  Target Audience & Contacts
                </label>
                <p className="text-[11px] text-gray-400 font-normal">
                  Select uploaded contacts or pick entire audience lists.
                </p>
              </div>

              {/* Segmented View Mode Pill */}
              <div className="inline-flex p-0.5 bg-slate-200/80 dark:bg-gray-800 rounded-full text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAudienceView('contacts')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    audienceView === 'contacts'
                      ? 'bg-white dark:bg-[#18202c] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                >
                  Individual Contacts ({allUploadedContacts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAudienceView('lists')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    audienceView === 'lists'
                      ? 'bg-white dark:bg-[#18202c] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                >
                  By Lists ({contactLists.length})
                </button>
              </div>
            </div>

            {/* View 1: Selection of Individual Uploaded Contacts */}
            {audienceView === 'contacts' && (
              <div className="space-y-3">
                {/* Search & Quick Action Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={contactSearchQuery}
                      onChange={e => setContactSearchQuery(e.target.value)}
                      placeholder="Search uploaded contacts by name, email, company..."
                      className="w-full bg-white dark:bg-[#11161f] border border-slate-200 dark:border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0b7b50]"
                    />
                    {contactSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setContactSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-[#0b7b50] hover:underline font-semibold"
                    >
                      Select All ({filteredContacts.length})
                    </button>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* Uploaded Contacts List */}
                {allUploadedContacts.length === 0 ? (
                  <div className="text-center py-6 px-4 bg-white dark:bg-[#11161f] rounded-2xl border border-dashed border-slate-200 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No contacts uploaded yet. Upload contacts in the Contacts page to select them for outreach.
                    </p>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center py-4 bg-white dark:bg-[#11161f] rounded-2xl border border-slate-200 dark:border-gray-800">
                    <p className="text-xs text-gray-400">
                      No uploaded contacts match &ldquo;{contactSearchQuery}&rdquo;.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-[#11161f] divide-y divide-slate-100 dark:divide-gray-800/60">
                    {filteredContacts.map(contact => {
                      const isSelected = selectedContactIds.includes(contact.id);
                      return (
                        <div
                          key={contact.id}
                          onClick={() => toggleContactSelection(contact.id)}
                          className={`flex items-center justify-between p-2.5 sm:px-3 text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#e7f7f0]/60 dark:bg-emerald-950/20'
                              : 'hover:bg-slate-50 dark:hover:bg-gray-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Checkbox indicator */}
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-[#0b7b50] border-[#0b7b50] text-white'
                                  : 'border-slate-300 dark:border-gray-700 bg-white dark:bg-[#18202c]'
                              }`}
                            >
                              {isSelected && (
                                <span className="text-[10px] font-bold leading-none">✓</span>
                              )}
                            </div>

                            {/* Contact Details */}
                            <div className="truncate">
                              <div className="font-semibold text-gray-900 dark:text-white truncate">
                                {contact.name || 'Unnamed Contact'}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400 font-mono text-[11px] truncate">
                                {contact.email}
                              </div>
                            </div>
                          </div>

                          {/* List & Company Tags */}
                          <div className="flex items-center gap-1.5 ml-2 shrink-0">
                            {contact.company && (
                              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                {contact.company}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                              {contact.listName}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* View 2: Selection By Audience Lists */}
            {audienceView === 'lists' && (
              <div className="space-y-3">
                {contactLists.length === 0 ? (
                  <p className="text-xs text-gray-400 bg-white dark:bg-[#11161f] p-3 rounded-2xl border border-slate-200 dark:border-gray-800">
                    No audience lists found. You can import lists in the Contacts section.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {contactLists.map(list => {
                      const listContactIds = (list.contacts || []).map(c => c.id);
                      const isFullySelected = listContactIds.length > 0 && listContactIds.every(id => selectedContactIds.includes(id));
                      const isPartiallySelected = !isFullySelected && listContactIds.some(id => selectedContactIds.includes(id));
                      const count = list.contacts?.length || list.contactCount || 0;

                      return (
                        <button
                          key={list.id}
                          type="button"
                          onClick={() => toggleListSelection(list)}
                          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                            isFullySelected
                              ? 'bg-[#0b7b50] text-white border-[#0b7b50] shadow-sm'
                              : isPartiallySelected
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#0b7b50] dark:text-emerald-300 border-[#0b7b50]'
                                : 'bg-white dark:bg-[#11161f] text-gray-700 dark:text-gray-300 border-slate-200 dark:border-gray-800 hover:border-gray-400'
                          }`}
                        >
                          <span>{list.name}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                            isFullySelected
                              ? 'bg-white/20 text-white' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Live Recipient Count Badge */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Total Audience Selected
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e7f7f0] dark:bg-emerald-950/60 text-[#0b7b50] dark:text-emerald-300">
                {selectedContactIds.length} Contacts Selected
              </span>
            </div>
          </div>

          {/* Draggable Personalization Tags Section */}
          <div className="border border-slate-200/80 dark:border-gray-800 rounded-2xl p-3.5 bg-slate-50/50 dark:bg-[#131923]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  Personalization Tags
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  (Drag tags into subject or message, or click to insert)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {PERSONALIZATION_TAGS.map(tag => (
                <div
                  key={tag.token}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', tag.token);
                    e.dataTransfer.effectAllowed = 'copy';
                    setDraggedTag(tag.token);
                  }}
                  onDragEnd={() => setDraggedTag(null)}
                  onClick={() => {
                    const targetEl = lastFocusedTarget === 'subject' ? subjectInputRef.current : bodyTextareaRef.current;
                    const val = lastFocusedTarget === 'subject' ? subject : body;
                    const setVal = lastFocusedTarget === 'subject' ? setSubject : setBody;
                    insertTagAtCursor(targetEl, tag.token, val, setVal);
                  }}
                  title={`Drag or click to insert ${tag.token} (${tag.hint})`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-[#18202c] hover:bg-[#e7f7f0] dark:hover:bg-emerald-950/40 text-gray-800 dark:text-gray-200 hover:text-[#0b7b50] dark:hover:text-emerald-300 border border-slate-200 dark:border-gray-700 hover:border-[#88d9b9] dark:hover:border-emerald-700 shadow-sm cursor-grab active:cursor-grabbing hover:scale-[1.02] active:scale-[0.98] transition-all select-none"
                >
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono select-none">⠿</span>
                  <span>{tag.label}</span>
                  <code className="text-[10px] font-mono font-normal text-[#0b7b50] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
                    {tag.token}
                  </code>
                </div>
              ))}
            </div>
          </div>

          {/* Email Body Message */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Message Content
              </label>
              {isDraggingOverBody && (
                <span className="text-[10px] font-bold text-[#0b7b50] animate-pulse">
                  Drop tag here to insert
                </span>
              )}
            </div>
            <textarea
              ref={bodyTextareaRef}
              rows={5}
              value={body}
              onChange={e => setBody(e.target.value)}
              onFocus={() => setLastFocusedTarget('body')}
              onDragOver={e => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                setIsDraggingOverBody(true);
              }}
              onDragLeave={() => setIsDraggingOverBody(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDraggingOverBody(false);
                const token = e.dataTransfer.getData('text/plain') || draggedTag;
                if (token) {
                  insertTagAtCursor(bodyTextareaRef.current, token, body, setBody);
                }
              }}
              placeholder="Hi {{name}}, we're reaching out to share..."
              className={`w-full bg-slate-50 dark:bg-[#11161f] border rounded-2xl p-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b7b50] focus:border-transparent transition-all font-normal resize-y ${
                isDraggingOverBody
                  ? 'border-[#0b7b50] ring-2 ring-[#0b7b50]/50 bg-emerald-50/30 dark:bg-emerald-950/30'
                  : 'border-slate-200 dark:border-gray-800'
              }`}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Personalize with recipient tags like <code className="text-[#0b7b50] font-mono">{"{{name}}"}</code>, <code className="text-[#0b7b50] font-mono">{"{{company}}"}</code>, and <code className="text-[#0b7b50] font-mono">{"{{email}}"}</code>.
            </p>
          </div>

          {/* Dispatch Mode Selector (Pills) */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Dispatch Action
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={`py-2 px-3 text-xs font-semibold rounded-2xl border transition-all text-center ${
                  status === 'draft'
                    ? 'bg-[#0b7b50] text-white border-[#0b7b50] shadow-sm'
                    : 'bg-slate-50 dark:bg-[#11161f] text-gray-700 dark:text-gray-300 border-slate-200 dark:border-gray-800 hover:border-gray-400'
                }`}
              >
                Save as Draft
              </button>

              <button
                type="button"
                onClick={() => setStatus('scheduled')}
                className={`py-2 px-3 text-xs font-semibold rounded-2xl border transition-all text-center ${
                  status === 'scheduled'
                    ? 'bg-[#0b7b50] text-white border-[#0b7b50] shadow-sm'
                    : 'bg-slate-50 dark:bg-[#11161f] text-gray-700 dark:text-gray-300 border-slate-200 dark:border-gray-800 hover:border-gray-400'
                }`}
              >
                Schedule
              </button>

              <button
                type="button"
                onClick={() => setStatus('sent')}
                className={`py-2 px-3 text-xs font-semibold rounded-2xl border transition-all text-center ${
                  status === 'sent'
                    ? 'bg-[#0b7b50] text-white border-[#0b7b50] shadow-sm'
                    : 'bg-slate-50 dark:bg-[#11161f] text-gray-700 dark:text-gray-300 border-slate-200 dark:border-gray-800 hover:border-gray-400'
                }`}
              >
                Send Now
              </button>
            </div>
          </div>

          {/* If Scheduled, show date/time input */}
          {status === 'scheduled' && (
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl">
              <label className="block text-[11px] font-semibold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider mb-1.5">
                Dispatch Date & Time
              </label>
              <input
                type="datetime-local"
                required={status === 'scheduled'}
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="w-full bg-white dark:bg-[#11161f] border border-emerald-300 dark:border-emerald-800 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b7b50]"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-gray-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0b7b50] hover:bg-[#09734a] active:bg-[#075939] text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-md shadow-[#0b7b50]/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>
                  {status === 'sent' 
                    ? 'Send Campaign' 
                    : status === 'scheduled' 
                      ? 'Schedule Campaign' 
                      : 'Save Draft'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaignModal;
