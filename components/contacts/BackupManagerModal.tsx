import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { User } from '../../types';
import { supabase } from '../../services/supabase';
import type { FileObject } from '@supabase/storage-js';
import Button from '../ui/Button';

const DownloadIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const TrashIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const SpinnerIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
const CloudIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);


interface BackupManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

const BackupManagerModal: React.FC<BackupManagerModalProps> = ({ isOpen, onClose, user }) => {
    const [files, setFiles] = useState<FileObject[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    const fetchFiles = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.storage
                .from('contact-backups')
                .list(user.id, {
                    sortBy: { column: 'created_at', order: 'desc' },
                });
            
            if (error) throw error;
            if (data) setFiles(data);

        } catch (err: any) {
            console.error("Error fetching backups:", err);
            let errorMessage = `Failed to load backups: ${err.message}`;
            if (err.message.includes('security policy') || err.message.includes('permission')) {
                errorMessage = "Could not access backups. Please ensure your 'contact-backups' bucket is private and that the RLS policies for storage are correctly set up to allow access for authenticated users.";
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && user) {
            fetchFiles();
        }
    }, [isOpen, user]);

    const handleDownload = async (fileName: string) => {
        setActionInProgress(`downloading_${fileName}`);
        try {
            const filePath = `${user.id}/${fileName}`;
            const { data, error } = await supabase.storage
                .from('contact-backups')
                .download(filePath);
            
            if (error) throw error;
            if (data) {
                const url = URL.createObjectURL(data);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (err: any) {
            alert(`Failed to download file: ${err.message}`);
        } finally {
            setActionInProgress(null);
        }
    };

    const handleDelete = async (fileName: string) => {
        if (!window.confirm(`Are you sure you want to delete the backup "${fileName}"? This cannot be undone.`)) {
            return;
        }
        setActionInProgress(`deleting_${fileName}`);
        try {
            const filePath = `${user.id}/${fileName}`;
            const { error } = await supabase.storage
                .from('contact-backups')
                .remove([filePath]);
            if (error) throw error;
            setFiles(prev => prev.filter(f => f.name !== fileName));
        } catch (err: any) {
            alert(`Failed to delete file: ${err.message}`);
        } finally {
            setActionInProgress(null);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center p-8"><SpinnerIcon className="h-8 w-8 mx-auto text-brand-500" /></div>;
        }
        if (error) {
            return <div className="p-4 text-sm text-center text-red-700 rounded-lg bg-red-100 dark:bg-red-900/20 dark:text-red-400" role="alert">{error}</div>;
        }
        if (files.length === 0) {
            return (
                <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                    <CloudIcon className="h-10 w-10 mx-auto mb-2" />
                    <p>No backups found.</p>
                    <p className="text-xs">Use the "Export & Backup" option on a contact list to create one.</p>
                </div>
            );
        }
        return (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                {files.map(file => (
                    <li key={file.id} className="p-3 flex justify-between items-center">
                        <div className="overflow-hidden">
                            <p className="font-medium text-gray-800 dark:text-gray-200 truncate" title={file.name}>{file.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Created: {(() => {
                                    const dateString = file.created_at;
                                    if (typeof dateString !== 'string' || !dateString) {
                                        return 'Invalid Date';
                                    }
                                    const date = new Date(dateString);
                                    if (isNaN(date.getTime())) {
                                        return 'Invalid Date';
                                    }
                                    return date.toLocaleString();
                                })()}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleDownload(file.name)}
                                isLoading={actionInProgress === `downloading_${file.name}`}
                                disabled={!!actionInProgress}
                            >
                                <DownloadIcon className="h-4 w-4" />
                            </Button>
                             <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleDelete(file.name)}
                                className="!text-red-500/80 hover:!bg-red-500/10"
                                isLoading={actionInProgress === `deleting_${file.name}`}
                                disabled={!!actionInProgress}
                            >
                                <TrashIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Contact Backups">
            <div>
                {renderContent()}
            </div>
        </Modal>
    );
};

export default BackupManagerModal;