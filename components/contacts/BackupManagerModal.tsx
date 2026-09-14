import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { supabase } from '../../services/supabase';
import type { FileObject } from '@supabase/storage-js';

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
      console.error('Error fetching backups:', err);
      let errorMessage = `Failed to load backups: ${err.message}`;
      if (err.message?.includes('security policy') || err.message?.includes('permission')) {
        errorMessage =
          "Could not access backups. Please ensure the 'contact-backups' bucket is private and storage policies allow access.";
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-sm select-none overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-[#18202c] rounded-[28px] border border-slate-200/80 dark:border-gray-800 shadow-2xl overflow-hidden my-auto flex flex-col transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header matching dashboard typography */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Manage Contact Backups
            </h2>
            <p className="text-xs text-gray-400 font-normal mt-0.5">
              Secure archive snapshots in Supabase Cloud Storage
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {isLoading ? (
            <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-7 h-7 border-2 border-[#0b7b50] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Loading backup archives...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-[#11161f] rounded-2xl border border-dashed border-slate-200 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No backup archives found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Use the &ldquo;Backup&rdquo; button on any contact list in the table to create a secure snapshot.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-gray-800/80 border border-slate-200/80 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-[#11161f]">
              {files.map(file => (
                <div key={file.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 dark:hover:bg-gray-800/40 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Created:{' '}
                      {file.created_at ? new Date(file.created_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownload(file.name)}
                      disabled={!!actionInProgress}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-[#e7f7f0] hover:bg-[#d8f3e5] dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-[#0b7b50] dark:text-emerald-300 transition-colors disabled:opacity-50"
                    >
                      {actionInProgress === `downloading_${file.name}` ? 'Downloading...' : 'Download'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(file.name)}
                      disabled={!!actionInProgress}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition-colors disabled:opacity-50"
                    >
                      {actionInProgress === `deleting_${file.name}` ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-[#131923] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#18202c] border border-slate-200 dark:border-gray-700 hover:border-gray-400 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupManagerModal;
