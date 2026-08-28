import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { Contact, ContactList, User } from '../../types';
import { supabase } from '../../services/supabase';
import BackupManagerModal from './BackupManagerModal';

// @ts-ignore
const { read, utils } = window.XLSX;

const FileIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
const TrashIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const PencilIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>;
const EyeIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;

const ArrowUpOnSquareIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);
const CloudArrowUpIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const SpinnerIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
const FolderIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
);




type ImportStep = 'idle' | 'parsing' | 'mapping' | 'confirm' | 'error';
type ColumnMap = { name: string | null; email: string | null; company: string | null; };

interface ContactsPageProps {
    contactLists: ContactList[];
    onImportList: (list: { name: string, contacts: Omit<Contact, 'id'>[] }) => void;
    onDeleteList: (listId: number) => void;
    onRenameList: (listId: number, newName: string) => void;
    user: User;
}

const ContactsPage: React.FC<ContactsPageProps> = ({ contactLists, onImportList, onDeleteList, onRenameList, user }) => {
    const [importStep, setImportStep] = useState<ImportStep>('idle');
    const [isImporting, setIsImporting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [fileInfo, setFileInfo] = useState<{name: string, contacts: Contact[]}>({ name: '', contacts: []});
    const [fileHeaders, setFileHeaders] = useState<string[]>([]);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [columnMap, setColumnMap] = useState<ColumnMap>({ name: null, email: null, company: null });

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deletingList, setDeletingList] = useState<ContactList | null>(null);
    const [isBackingUp, setIsBackingUp] = useState<number | null>(null);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [renamingList, setRenamingList] = useState<ContactList | null>(null);
    const [newListName, setNewListName] = useState('');
    const [isBackupManagerOpen, setIsBackupManagerOpen] = useState(false);

    const resetImportState = () => {
        setImportStep('idle');
        setIsImporting(false);
        setErrorMessage('');
        setFileInfo({ name: '', contacts: []});
        setFileHeaders([]);
        setParsedData([]);
        setColumnMap({ name: null, email: null, company: null });
    };
    
    const suggestMapping = (headers: string[]): ColumnMap => {
        const lowerCaseHeaders = headers.map(h => h.toLowerCase());
        
        const findHeader = (keywords: string[]) => {
            for (const keyword of keywords) {
                const found = headers.find(h => h.toLowerCase().includes(keyword));
                if (found) return found;
            }
            return null;
        };

        return {
            name: findHeader(['name', 'full name']),
            email: findHeader(['email', 'e-mail', 'email address']),
            company: findHeader(['company', 'organization']),
        };
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        resetImportState();
        setIsImporting(true);
        setImportStep('parsing');
        
        await new Promise(res => setTimeout(res, 500));

        try {
            if (!read || !utils) {
                throw new Error("File parsing library (XLSX) is not available.");
            }
            const data = await file.arrayBuffer();
            const workbook = read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData: any[] = utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length < 2) {
                setErrorMessage("Your file seems to be empty or missing contact rows. Please check the file and try again.");
                setImportStep('error');
                return;
            }

            const headers: string[] = jsonData[0];
            const rows = jsonData.slice(1).map(row => {
                const rowData: {[key: string]: any} = {};
                headers.forEach((header, index) => {
                    rowData[header] = row[index];
                });
                return rowData;
            });
            
            const listName = file.name.replace(/\.(csv|xlsx|xls)$/i, '') || `Imported on ${new Date().toLocaleDateString()}`;

            setFileHeaders(headers);
            setParsedData(rows);
            setFileInfo(prev => ({ ...prev, name: listName }));
            setColumnMap(suggestMapping(headers));
            setImportStep('mapping');

        } catch (error) {
            console.error("File parsing error:", error);
            setErrorMessage(error instanceof Error ? `Failed to read file: ${error.message}` : "An unknown error occurred during file parsing. The file might be corrupted or in an unsupported format.");
            setImportStep('error');
        } finally {
            setIsImporting(false);
            event.target.value = '';
        }
    };
    
    const handleMappingContinue = () => {
        if (!columnMap.email) {
            alert("Email column is required.");
            return;
        }

        const mappedContacts = parsedData.map((row, index): Omit<Contact, 'id' | 'user_id' | 'list_id'> & {id: number} => {
            const email = row[columnMap.email!] || '';
            const name = columnMap.name ? (row[columnMap.name] || '') : email.split('@')[0];
            const company = columnMap.company ? (row[columnMap.company] || '') : '';
            
            return {
                id: Date.now() + index, // temporary ID
                name: String(name),
                email: String(email),
                company: String(company),
                status: 'subscribed',
                last_contacted: new Date().toISOString(),
            };
        }).filter(contact => contact.email && contact.email.includes('@')); // Must have a valid email

        setFileInfo(prev => ({...prev, contacts: mappedContacts as Contact[]}));
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
            alert("List name cannot be empty.");
        }
    };

    const handleBackupToList = async (list: ContactList) => {
        setIsBackingUp(list.id);
        try {
            // 1. Convert to CSV
            const headers = ['name', 'email', 'company', 'status', 'last_contacted'];
            const csvRows = [
                headers.join(','), // header row
                ...list.contacts.map(contact => 
                    headers.map(fieldName => {
                        const value = contact[fieldName as keyof Contact] ?? '';
                        // Simple CSV escape: wrap in quotes if it contains comma or quote
                        const escaped = String(value).includes(',') || String(value).includes('"') 
                            ? `"${String(value).replace(/"/g, '""')}"` 
                            : String(value);
                        return escaped;
                    }).join(',')
                )
            ];
            const csvContent = csvRows.join('\n');
            const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

            // 2. Prepare file path
            const sanitizedListName = list.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const filePath = `${user.id}/backup_${sanitizedListName}_${timestamp}.csv`;

            // 3. Upload to Supabase Storage
            const { error } = await supabase.storage
                .from('contact-backups')
                .upload(filePath, csvBlob);

            if (error) {
                throw error;
            }

            alert(`Successfully backed up "${list.name}" to Supabase Storage.`);

        } catch (error: any) {
            console.error('Error backing up contact list:', error);
            let alertMessage = `Failed to back up list. Error: ${error.message}`;
            if (error.message.includes('security policy')) {
                alertMessage += "\n\nThis is often due to missing or incorrect Storage RLS policies. Please ensure your bucket is private and policies are set up to allow inserts for authenticated users.";
            } else if (error.statusCode === '404') {
                 alertMessage += "\n\nThe 'contact-backups' bucket could not be found. Please ensure it has been created in your Supabase project.";
            }
            alert(alertMessage);
        } finally {
            setIsBackingUp(null);
        }
    };


    const headers = [
        { key: 'name', label: 'List Name' },
        { key: 'contactCount', label: 'Contacts' },
        { 
            key: 'importedAt', 
            label: 'Imported Date',
            render: (list: ContactList) => {
                if (typeof list.importedAt !== 'string' || list.importedAt.trim() === '') {
                    return <span className="text-gray-500">Invalid Date</span>;
                }
                const date = new Date(list.importedAt);
                if (isNaN(date.getTime())) {
                    return <span className="text-gray-500">Invalid Date</span>;
                }
                return date.toLocaleDateString();
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (list: ContactList) => (
                <div className="flex items-center justify-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => alert(`Viewing contacts for ${list.name}`)} title="View Contacts" aria-label={`View contacts for ${list.name}`}>
                        <EyeIcon className="h-5 w-5" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleBackupToList(list)}
                        disabled={isBackingUp !== null}
                        title="Export & Backup" 
                        aria-label={`Export and backup ${list.name}`}
                    >
                        {isBackingUp === list.id ? <SpinnerIcon className="h-5 w-5" /> : <CloudArrowUpIcon className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openRenameModal(list)} title="Rename" aria-label={`Rename list ${list.name}`}>
                        <PencilIcon className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openDeleteModal(list)} title="Delete List" aria-label={`Delete list ${list.name}`} className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400">
                        <TrashIcon className="h-5 w-5" />
                    </Button>
                </div>
            )
        }
    ];

    const renderImportContent = () => {
        switch (importStep) {
            case 'parsing':
                return (
                    <Card className="text-center p-10">
                        <div className="flex justify-center items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-gray-700 dark:text-gray-300">Analyzing your file, please wait...</p>
                        </div>
                    </Card>
                );
            case 'error':
                return (
                    <Card className="border-red-500/50 bg-red-500/10 text-center p-10">
                        <h3 className="text-lg font-semibold text-red-500 dark:text-red-400 mb-2">Import Failed</h3>
                        <p className="text-red-600 dark:text-red-300/80">{errorMessage}</p>
                        <Button variant="secondary" onClick={resetImportState} className="mt-6">Try Again</Button>
                    </Card>
                );
            case 'mapping':
                return (
                    <Card>
                        <h2 className="text-xl font-bold mb-4">Map Columns</h2>
                        <p className="mb-6 text-gray-700 dark:text-gray-400">Match the columns from your file to the contact fields.</p>
                        <div className="space-y-4">
                            {Object.keys(columnMap).map((field) => (
                                <div key={field} className="grid grid-cols-2 items-center gap-4">
                                    <label htmlFor={`map-${field}`} className="capitalize font-medium text-right text-gray-700 dark:text-gray-300">
                                        {field} {field === 'email' && <span className="text-red-500">*</span>}
                                    </label>
                                    <select
                                        id={`map-${field}`}
                                        value={columnMap[field as keyof ColumnMap] || ''}
                                        onChange={(e) => setColumnMap(prev => ({...prev, [field]: e.target.value || null}))}
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="">-- Select a column --</option>
                                        {fileHeaders.map(header => <option key={header} value={header}>{header}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-4 mt-8">
                            <Button variant="secondary" onClick={resetImportState}>Cancel</Button>
                            <Button variant="primary" onClick={handleMappingContinue} disabled={!columnMap.email}>Continue</Button>
                        </div>
                    </Card>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contact Lists</h1>
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={() => setIsBackupManagerOpen(true)}>
                        <FolderIcon className="h-5 w-5 mr-2" />
                        Manage Backups
                    </Button>
                    <div className="relative">
                        <Button as="span" variant="primary" isLoading={isImporting}>
                            <ArrowUpOnSquareIcon className="h-5 w-5 mr-2" />
                            {isImporting ? 'Processing...' : 'Import Contacts'}
                        </Button>
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            onChange={handleFileChange}
                            onClick={(e) => (e.currentTarget.value = '')} // Allow re-uploading the same file
                            disabled={isImporting}
                        />
                    </div>
                </div>
            </div>

            {importStep !== 'idle' && (
                <div className="my-8">
                    {renderImportContent()}
                </div>
            )}

            <Card>
                <Table headers={headers} data={contactLists} />
                {contactLists.length === 0 && importStep === 'idle' && (
                    <div className="text-center py-10">
                        <FileIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <h3 className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">No contact lists</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Get started by importing your first contact list.</p>
                    </div>
                )}
            </Card>

            <Modal isOpen={importStep === 'confirm'} onClose={resetImportState} title="Confirm Import">
                <div className="space-y-4">
                    <Input
                        label="List Name"
                        id="list-name"
                        value={fileInfo.name}
                        onChange={(e) => setFileInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Leads from Q2"
                    />
                    <p className="text-gray-700 dark:text-gray-400">
                        You are about to import <strong className="text-gray-900 dark:text-white">{fileInfo.contacts.length}</strong> contacts into this new list.
                    </p>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">Please confirm to proceed.</p>
                </div>
                <div className="flex justify-end gap-4 pt-6">
                    <Button type="button" variant="secondary" onClick={resetImportState}>Cancel</Button>
                    <Button type="button" variant="primary" onClick={handleConfirmSave}>Confirm & Save</Button>
                </div>
            </Modal>

            <Modal 
                isOpen={isDeleteConfirmOpen} 
                onClose={() => setIsDeleteConfirmOpen(false)} 
                title="Delete Contact List"
            >
                <p className="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete the list <strong className="text-gray-900 dark:text-white">"{deletingList?.name}"</strong>?
                </p>
                <p className="mt-2 text-red-600 dark:text-red-400/80 text-sm">This action is permanent and will also delete all <strong className="font-semibold">{deletingList?.contactCount}</strong> contacts associated with it. This cannot be undone.</p>
                <div className="flex justify-end gap-4 pt-6">
                    <Button type="button" variant="secondary" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button type="button" variant="primary" className="!bg-red-600 hover:!bg-red-700 !focus:ring-red-500" onClick={handleConfirmDelete}>
                        Confirm Delete
                    </Button>
                </div>
            </Modal>

            <Modal
                isOpen={isRenameModalOpen}
                onClose={() => setIsRenameModalOpen(false)}
                title="Rename Contact List"
            >
                <Input
                    label="New list name"
                    id="new-list-name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g., Q3 Leads"
                />
                <div className="flex justify-end gap-4 pt-6">
                    <Button type="button" variant="secondary" onClick={() => setIsRenameModalOpen(false)}>Cancel</Button>
                    <Button type="button" variant="primary" onClick={handleConfirmRename}>
                        Save Changes
                    </Button>
                </div>
            </Modal>
            
            <BackupManagerModal 
                isOpen={isBackupManagerOpen}
                onClose={() => setIsBackupManagerOpen(false)}
                user={user}
            />
        </div>
    );
};

export default ContactsPage;