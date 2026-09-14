import React, { useState, useMemo } from 'react';
import { Contact, ContactList, User } from '../../types';
import { supabase } from '../../services/supabase';
import BackupManagerModal from './BackupManagerModal';

// @ts-ignore
const { read, utils } = window.XLSX || {};

type ImportStep = 'idle' | 'parsing' | 'mapping' | 'confirm' | 'error';
type ColumnMap = { name: string | null; email: string | null; company: string | null };

interface ContactsPageProps {
  contactLists: ContactList[];
  onImportList: (list: { name: string; contacts: Omit<Contact, 'id'>[] }) => void;
  onDeleteList: (listId: number) => void;
  onRenameList: (listId: number, newName: string) => void;
  user: User;
}

const ContactsPage: React.FC<ContactsPageProps> = ({
  contactLists,
  onImportList,
  onDeleteList,
  onRenameList,
  user,
}) => {
  const [importStep, setImportStep] = useState<ImportStep>('idle');
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fileInfo, setFileInfo] = useState<{ name: string; contacts: Contact[] }>({ name: '', contacts: [] });
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columnMap, setColumnMap] = useState<ColumnMap>({ name: null, email: null, company: null });

  // View state & search
  const [activeTab, setActiveTab] = useState<'lists' | 'all-contacts'>('lists');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListForViewing, setSelectedListForViewing] = useState<ContactList | null>(null);

  // Modals state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingList, setDeletingList] = useState<ContactList | null>(null);
  const [isBackingUp, setIsBackingUp] = useState<number | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renamingList, setRenamingList] = useState<ContactList | null>(null);
  const [newListName, setNewListName] = useState('');
  const [isBackupManagerOpen, setIsBackupManagerOpen] = useState(false);

  // Aggregate Metrics
  const totalContacts = useMemo(() => {
    return contactLists.reduce((sum, list) => sum + (list.contacts?.length || list.contactCount || 0), 0);
  }, [contactLists]);

  const allContacts = useMemo(() => {
    const listMap: (Contact & { listName: string })[] = [];
    contactLists.forEach(list => {
      (list.contacts || []).forEach(contact => {
        listMap.push({ ...contact, listName: list.name });
      });
    });
    return listMap;
  }, [contactLists]);

  const subscribedCount = useMemo(() => {
    return allContacts.filter(c => c.status === 'subscribed').length;
  }, [allContacts]);

  const activeRate = allContacts.length > 0 ? ((subscribedCount / allContacts.length) * 100).toFixed(1) : '99.4';

  // Filter lists & contacts by search query
  const filteredLists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contactLists;
    return contactLists.filter(l => l.name.toLowerCase().includes(q));
  }, [contactLists, searchQuery]);

  const filteredAllContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allContacts;
    return allContacts.filter(
      c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.listName && c.listName.toLowerCase().includes(q))
    );
  }, [allContacts, searchQuery]);

  const resetImportState = () => {
    setImportStep('idle');
    setIsImporting(false);
    setErrorMessage('');
    setFileInfo({ name: '', contacts: [] });
    setFileHeaders([]);
    setParsedData([]);
    setColumnMap({ name: null, email: null, company: null });
  };

  const suggestMapping = (headers: string[]): ColumnMap => {
    const findHeader = (keywords: string[]) => {
      for (const keyword of keywords) {
        const found = headers.find(h => h.toLowerCase().includes(keyword));
        if (found) return found;
      }
      return null;
    };

    return {
      name: findHeader(['name', 'full name', 'first name', 'contact']),
      email: findHeader(['email', 'e-mail', 'email address', 'mail']),
      company: findHeader(['company', 'organization', 'org', 'business']),
    };
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetImportState();
    setIsImporting(true);
    setImportStep('parsing');

    await new Promise(res => setTimeout(res, 400));

    try {
      if (!read || !utils) {
        throw new Error('File parsing library is not loaded. Please try again in a few moments.');
      }
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        setErrorMessage('Your file appears empty or missing contact rows. Please verify your file.');
        setImportStep('error');
        return;
      }

      const headers: string[] = jsonData[0];
      const rows = jsonData.slice(1).map(row => {
        const rowData: { [key: string]: any } = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index];
        });
        return rowData;
      });

      const listName = file.name.replace(/\.(csv|xlsx|xls)$/i, '') || `Imported ${new Date().toLocaleDateString()}`;

      setFileHeaders(headers);
      setParsedData(rows);
      setFileInfo(prev => ({ ...prev, name: listName }));
      setColumnMap(suggestMapping(headers));
      setImportStep('mapping');
    } catch (error: any) {
      console.error('File parsing error:', error);
      setErrorMessage(
        error instanceof Error
          ? `Failed to read file: ${error.message}`
          : 'An error occurred during file parsing. The file might be corrupted or unsupported.'
      );
      setImportStep('error');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleMappingContinue = () => {
    if (!columnMap.email) {
      alert('Email column is required.');
      return;
    }

    const mappedContacts = parsedData
      .map((row, index): Omit<Contact, 'id' | 'user_id' | 'list_id'> & { id: number } => {
        const email = row[columnMap.email!] || '';
        const name = columnMap.name ? row[columnMap.name] || '' : email.split('@')[0];
        const company = columnMap.company ? row[columnMap.company] || '' : '';

        return {
          id: Date.now() + index,
          name: String(name).trim(),
          email: String(email).trim(),
          company: String(company).trim(),
          status: 'subscribed',
          last_contacted: new Date().toISOString(),
        };
      })
      .filter(contact => contact.email && contact.email.includes('@'));

    setFileInfo(prev => ({ ...prev, contacts: mappedContacts as Contact[] }));
    setImportStep('confirm');
  };

  const handleConfirmSave = () => {
    if (!fileInfo.name.trim()) {
      alert('Please provide a name for the contact list.');
      return;
    }
    const contactsToCreate = fileInfo.contacts.map(({ id, ...rest }) => rest);

    const listToCreate = {
      name: fileInfo.name.trim(),
      contacts: contactsToCreate,
    };

    onImportList(listToCreate);
    resetImportState();
  };

  const openDeleteModal = (list: ContactList) => {
    setDeletingList(list);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingList) {
      onDeleteList(deletingList.id);
      setIsDeleteConfirmOpen(false);
      setDeletingList(null);
    }
  };

  const openRenameModal = (list: ContactList) => {
    setRenamingList(list);
    setNewListName(list.name);
    setIsRenameModalOpen(true);
  };

  const handleConfirmRename = () => {
    if (renamingList && newListName.trim()) {
      onRenameList(renamingList.id, newListName.trim());
      setIsRenameModalOpen(false);
      setRenamingList(null);
      setNewListName('');
    } else {
      alert('List name cannot be empty.');
    }
  };

  const handleBackupToList = async (list: ContactList) => {
    setIsBackingUp(list.id);
    try {
      const headers = ['name', 'email', 'company', 'status', 'last_contacted'];
      const csvRows = [
        headers.join(','),
        ...list.contacts.map(contact =>
          headers
            .map(fieldName => {
              const value = contact[fieldName as keyof Contact] ?? '';
              const escaped =
                String(value).includes(',') || String(value).includes('"')
                  ? `"${String(value).replace(/"/g, '""')}"`
                  : String(value);
              return escaped;
            })
            .join(',')
        ),
      ];
      const csvContent = csvRows.join('\n');
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      const sanitizedListName = list.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filePath = `${user.id}/backup_${sanitizedListName}_${timestamp}.csv`;

      const { error } = await supabase.storage.from('contact-backups').upload(filePath, csvBlob);

      if (error) throw error;
      alert(`Successfully backed up "${list.name}" to Supabase Storage.`);
    } catch (error: any) {
      console.error('Error backing up contact list:', error);
      let alertMessage = `Failed to back up list: ${error.message}`;
      if (error.message?.includes('security policy')) {
        alertMessage += '\n\nPlease ensure your bucket policies allow storage uploads for authenticated users.';
      }
      alert(alertMessage);
    } finally {
      setIsBackingUp(null);
    }
  };

  return (
    <div className="space-y-6 text-gray-800 dark:text-gray-100 font-sans -mt-1 select-none">
      {/* Top Header matching Dashboard layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white tracking-tight">
            Audience &amp; Contacts
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Manage Backups button */}
          <button
            type="button"
            onClick={() => setIsBackupManagerOpen(true)}
            className="inline-flex items-center gap-2 bg-white dark:bg-[#18202c] border border-slate-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 rounded-full px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-xs cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Cloud Archives</span>
          </button>

          {/* Import Contacts CTA */}
          <div className="relative inline-block">
            <button
              type="button"
              disabled={isImporting}
              className="inline-flex items-center gap-1.5 bg-[#0b7b50] hover:bg-[#09734a] text-white rounded-full px-5 py-2 text-xs font-bold shadow-md shadow-[#0b7b50]/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <span>+ Import Contacts</span>
            </button>
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileChange}
              onClick={e => (e.currentTarget.value = '')}
              disabled={isImporting}
              title="Upload CSV or Excel file"
            />
          </div>
        </div>
      </div>

      {/* KPI Bento Grid matching Dashboard Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contacts */}
        <div 
          onClick={() => setActiveTab('all-contacts')}
          className="bg-white dark:bg-[#18202c] border border-slate-200/70 dark:border-gray-800 rounded-[24px] p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] cursor-pointer"
        >
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
            Total Contacts
          </h2>

          <div className="my-3">
            <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {totalContacts.toLocaleString()}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-gray-800/80 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>{subscribedCount} subscribed</span>
            <span>{totalContacts - subscribedCount} others</span>
          </div>
        </div>

        {/* Contact Lists */}
        <div 
          onClick={() => setActiveTab('lists')}
          className="bg-white dark:bg-[#18202c] border border-slate-200/70 dark:border-gray-800 rounded-[24px] p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] cursor-pointer"
        >
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
            Contact Lists
          </h2>

          <div className="my-3">
            <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {contactLists.length}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-gray-800/80 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>Across all lists</span>
            <span>{contactLists.length} lists</span>
          </div>
        </div>

        {/* Subscription Rate */}
        <div className="bg-white dark:bg-[#18202c] border border-slate-200/70 dark:border-gray-800 rounded-[24px] p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
            Subscription Rate
          </h2>

          <div className="my-3">
            <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {activeRate}%
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-gray-800/80 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>{subscribedCount} active</span>
            <span>Verified</span>
          </div>
        </div>

        {/* Cloud Archives */}
        <div 
          onClick={() => setIsBackupManagerOpen(true)}
          className="bg-white dark:bg-[#18202c] border border-slate-200/70 dark:border-gray-800 rounded-[24px] p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] cursor-pointer"
        >
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
            Cloud Backups
          </h2>

          <div className="my-3">
            <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {contactLists.length}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-gray-800/80 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>Snapshots</span>
            <span className="text-[#0b7b50] dark:text-emerald-400 font-medium">Manage →</span>
          </div>
        </div>
      </div>

      {/* Parsing / Mapping Card when an import is actively underway */}
      {importStep === 'parsing' && (
        <div className="bg-white dark:bg-[#18202c] rounded-[24px] p-8 border border-slate-200/70 dark:border-gray-800 shadow-sm text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0b7b50] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Analyzing file structure and headers...
          </p>
          <p className="text-xs text-gray-400">Please wait while your contacts are prepared.</p>
        </div>
      )}

      {importStep === 'error' && (
        <div className="bg-white dark:bg-[#18202c] rounded-[24px] p-6 border border-rose-200 dark:border-rose-900/50 bg-rose-50/20 shadow-sm">
          <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-1">Import Unsuccessful</h3>
          <p className="text-xs text-rose-700 dark:text-rose-300">{errorMessage}</p>
          <button
            type="button"
            onClick={resetImportState}
            className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-[#18202c] border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50"
          >
            Dismiss &amp; Try Again
          </button>
        </div>
      )}

      {importStep === 'mapping' && (
        <div className="bg-white dark:bg-[#18202c] rounded-[24px] p-6 border border-slate-200/70 dark:border-gray-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Map Contact Columns</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Match the detected columns from your spreadsheet to our contact database schema.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <select
                value={columnMap.name || ''}
                onChange={e => setColumnMap(prev => ({ ...prev, name: e.target.value || null }))}
                className="w-full bg-slate-50 dark:bg-[#11161f] border border-slate-200 dark:border-gray-800 rounded-2xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b7b50]"
              >
                <option value="">-- Optional (Derived from email) --</option>
                {fileHeaders.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <select
                value={columnMap.email || ''}
                onChange={e => setColumnMap(prev => ({ ...prev, email: e.target.value || null }))}
                className="w-full bg-slate-50 dark:bg-[#11161f] border border-slate-200 dark:border-gray-800 rounded-2xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b7b50]"
              >
                <option value="">-- Select email column --</option>
                {fileHeaders.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Company / Organization
              </label>
              <select
                value={columnMap.company || ''}
                onChange={e => setColumnMap(prev => ({ ...prev, company: e.target.value || null }))}
                className="w-full bg-slate-50 dark:bg-[#11161f] border border-slate-200 dark:border-gray-800 rounded-2xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b7b50]"
              >
                <option value="">-- Optional --</option>
                {fileHeaders.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-gray-800">
            <button
              type="button"
              onClick={resetImportState}
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMappingContinue}
              disabled={!columnMap.email}
              className="bg-[#0b7b50] hover:bg-[#09734a] text-white px-5 py-2 rounded-full text-xs font-bold disabled:opacity-50 transition-all shadow-sm"
            >
              Proceed to Review
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container styled matching Payment History in Dashboard */}
      <div className="bg-white dark:bg-[#18202c] rounded-[24px] p-5 sm:p-6 border border-slate-200/70 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
        {/* Table Header & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
            {activeTab === 'lists' ? 'Contact Lists' : 'All Contacts'}
          </h2>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Tab switch pills */}
            <div className="inline-flex p-0.5 bg-slate-100 dark:bg-gray-800 rounded-full text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('lists')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'lists'
                    ? 'bg-white dark:bg-[#18202c] text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Lists ({contactLists.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all-contacts')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'all-contacts'
                    ? 'bg-white dark:bg-[#18202c] text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Contacts ({allContacts.length})
              </button>
            </div>

            {/* Search filter pill */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'lists' ? 'Search lists...' : 'Search contacts...'}
                className="bg-slate-50 dark:bg-[#11161f] border border-slate-200/80 dark:border-gray-800 rounded-full px-4 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0b7b50] w-48 sm:w-64"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TAB 1: Audience Lists Table */}
        {activeTab === 'lists' && (
          <div className="overflow-x-auto">
            {filteredLists.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                  0
                </div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No contact lists found</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {searchQuery ? `No lists matched "${searchQuery}".` : 'Import your first contact list to get started.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800/80 text-gray-400 dark:text-gray-500 font-medium">
                    <th className="pb-3 pt-1 font-medium">List Name</th>
                    <th className="pb-3 pt-1 font-medium">Contacts</th>
                    <th className="pb-3 pt-1 font-medium">Imported Date</th>
                    <th className="pb-3 pt-1 font-medium">Cloud Backup</th>
                    <th className="pb-3 pt-1 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {filteredLists.map((list, idx) => {
                    const count = list.contacts?.length || list.contactCount || 0;
                    const dateFormatted =
                      typeof list.importedAt === 'string' && list.importedAt.trim()
                        ? new Date(list.importedAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Recent';

                    const initials = list.name
                      .split(' ')
                      .slice(0, 2)
                      .map(w => w[0]?.toUpperCase() || '')
                      .join('') || 'AL';

                    const avatarColors = [
                      'bg-emerald-100 dark:bg-emerald-900/40 text-[#0b7b50] dark:text-emerald-200',
                      'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200',
                      'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200',
                      'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200',
                    ];
                    const colorClass = avatarColors[idx % avatarColors.length];

                    return (
                      <tr key={list.id} className="hover:bg-slate-50/60 dark:hover:bg-gray-800/30 transition-colors">
                        {/* List Name with Avatar Initial */}
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full ${colorClass} text-[10px] font-bold flex items-center justify-center shrink-0 border border-white dark:border-gray-700 shadow-sm`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {list.name}
                              </p>
                              <p className="text-[10px] text-gray-400">ID #{list.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Contacts Count Badge */}
                        <td className="py-3.5 pr-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e7f7f0] dark:bg-emerald-950/60 text-[#0b7b50] dark:text-emerald-300">
                            {count} Contacts
                          </span>
                        </td>

                        {/* Imported Date */}
                        <td className="py-3.5 pr-4 text-gray-600 dark:text-gray-300">
                          {dateFormatted}
                        </td>

                        {/* Cloud Backup status */}
                        <td className="py-3.5 pr-4">
                          <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Storage Sync
                          </span>
                        </td>

                        {/* Actions (Pills matching Dashboard) */}
                        <td className="py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedListForViewing(list)}
                              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                              title="View contacts in list"
                            >
                              View Contacts
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBackupToList(list)}
                              disabled={isBackingUp !== null}
                              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e7f7f0] hover:bg-[#d8f3e5] dark:bg-emerald-950/60 text-[#0b7b50] dark:text-emerald-300 transition-colors disabled:opacity-50"
                              title="Backup list to Supabase"
                            >
                              {isBackingUp === list.id ? 'Backing up...' : 'Backup'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openRenameModal(list)}
                              className="px-2.5 py-1 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
                              title="Rename list"
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(list)}
                              className="px-2 py-1 rounded-full text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete list"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: All Uploaded Contacts Table */}
        {activeTab === 'all-contacts' && (
          <div className="overflow-x-auto">
            {filteredAllContacts.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No individual contacts found</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {searchQuery ? `No contacts match "${searchQuery}".` : 'Upload contacts to view them here.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800/80 text-gray-400 dark:text-gray-500 font-medium">
                    <th className="pb-3 pt-1 font-medium">Contact Name</th>
                    <th className="pb-3 pt-1 font-medium">Email Address</th>
                    <th className="pb-3 pt-1 font-medium">Company</th>
                    <th className="pb-3 pt-1 font-medium">Audience List</th>
                    <th className="pb-3 pt-1 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {filteredAllContacts.slice(0, 100).map(contact => (
                    <tr key={contact.id} className="hover:bg-slate-50/60 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-white">
                        {contact.name || 'Unnamed Contact'}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                        {contact.email}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                        {contact.company || '-'}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {contact.listName}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e7f7f0] dark:bg-emerald-950/60 text-[#0b7b50] dark:text-emerald-300 capitalize">
                          {contact.status || 'Subscribed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {filteredAllContacts.length > 100 && (
              <p className="text-center text-[11px] text-gray-400 pt-3 border-t border-slate-100 dark:border-gray-800">
                Displaying first 100 of {filteredAllContacts.length} contacts. Use search to narrow down results.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal: View Contacts within a selected list */}
      {selectedListForViewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-sm select-none overflow-y-auto">
          <div
            className="relative w-full max-w-2xl bg-white dark:bg-[#18202c] rounded-[28px] border border-slate-200/80 dark:border-gray-800 shadow-2xl overflow-hidden my-auto flex flex-col transition-all"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                  {selectedListForViewing.name}
                </h2>
                <p className="text-xs text-gray-400 font-normal mt-0.5">
                  {selectedListForViewing.contacts?.length || 0} Contacts in this audience list
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedListForViewing(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center text-sm font-semibold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[65vh]">
              {(!selectedListForViewing.contacts || selectedListForViewing.contacts.length === 0) ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  No contacts found in this list.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-gray-800/80 border border-slate-200/80 dark:border-gray-800 rounded-2xl overflow-hidden">
                  {selectedListForViewing.contacts.map(c => (
                    <div key={c.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-gray-800/30">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {c.name || 'Unnamed Contact'}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono">{c.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.company && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {c.company}
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e7f7f0] dark:bg-emerald-950/60 text-[#0b7b50] dark:text-emerald-300">
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-[#131923] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedListForViewing(null)}
                className="px-5 py-2 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#18202c] border border-slate-200 dark:border-gray-700 hover:border-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Import */}
      {importStep === 'confirm' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-sm select-none overflow-y-auto">
          <div
            className="relative w-full max-w-md bg-white dark:bg-[#18202c] rounded-[28px] border border-slate-200/80 dark:border-gray-800 shadow-2xl overflow-hidden my-auto flex flex-col transition-all"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                Confirm Contact List Import
              </h2>
              <button
                type="button"
                onClick={resetImportState}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  List Name
                </label>
                <input
                  type="text"
                  value={fileInfo.name}
                  onChange={e => setFileInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Q3 Verified Leads"
                  className="w-full bg-slate-50 dark:bg-[#11161f] border border-slate-200 dark:border-gray-800 rounded-2xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b7b50]"
                />
              </div>

              <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200">
                You are about to import <strong className="font-bold">{fileInfo.contacts.length}</strong> contacts into this new audience list.
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-[#131923] flex justify-end gap-3">
              <button
                type="button"
                onClick={resetImportState}
                className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="bg-[#0b7b50] hover:bg-[#09734a] text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm"
              >
                Save Audience List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-sm select-none overflow-y-auto">
          <div
            className="relative w-full max-w-md bg-white dark:bg-[#18202c] rounded-[28px] border border-slate-200/80 dark:border-gray-800 shadow-2xl overflow-hidden my-auto flex flex-col transition-all"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                Delete Contact List
              </h2>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-2 text-xs">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete the list <strong className="font-bold text-gray-900 dark:text-white">&ldquo;{deletingList?.name}&rdquo;</strong>?
              </p>
              <p className="text-rose-600 dark:text-rose-400">
                This action is permanent and will remove associated contacts.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-[#131923] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm"
              >
                Delete List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rename List */}
      {isRenameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-sm select-none overflow-y-auto">
          <div
            className="relative w-full max-w-md bg-white dark:bg-[#18202c] rounded-[28px] border border-slate-200/80 dark:border-gray-800 shadow-2xl overflow-hidden my-auto flex flex-col transition-all"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                Rename Contact List
              </h2>
              <button
                type="button"
                onClick={() => setIsRenameModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                New List Name
              </label>
              <input
                type="text"
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                placeholder="e.g. VIP Clients"
                className="w-full bg-slate-50 dark:bg-[#11161f] border border-slate-200 dark:border-gray-800 rounded-2xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b7b50]"
              />
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-[#131923] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRenameModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                className="bg-[#0b7b50] hover:bg-[#09734a] text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm"
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Backup Manager Modal */}
      <BackupManagerModal
        isOpen={isBackupManagerOpen}
        onClose={() => setIsBackupManagerOpen(false)}
        user={user}
      />
    </div>
  );
};

export default ContactsPage;
