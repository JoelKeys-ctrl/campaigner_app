import React, { useState } from 'react';
import { EmailAttachment } from '../../types';
import { formatFileSize, getFileExtension } from '../../services/attachmentUtils';
import { 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  Eye, 
  X, 
  Paperclip,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';

interface AttachmentListProps {
  attachments: EmailAttachment[];
  onRemoveAttachment: (index: number) => void;
  disabled?: boolean;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  onRemoveAttachment,
  disabled = false,
}) => {
  const [previewImage, setPreviewImage] = useState<{ filename: string; url: string } | null>(null);

  if (attachments.length === 0) {
    return null;
  }

  const totalSize = attachments.reduce((sum, att) => sum + (att.size || 0), 0);

  const getDocIcon = (mimeType: string, filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (ext === 'xls' || ext === 'xlsx' || ext === 'csv' || mimeType.includes('sheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />;
    }
    if (ext === 'txt' || ext === 'rtf' || ext === 'json') {
      return <FileCode className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />;
    }
    return <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />;
  };

  return (
    <div className="space-y-3 mt-4">
      {/* Header with summary count and total size */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-0.5">
        <div className="flex items-center gap-1.5 font-medium">
          <Paperclip className="w-3.5 h-3.5 text-brand-500" />
          <span>Attachments ({attachments.length})</span>
        </div>
        <span>Total: {formatFileSize(totalSize)}</span>
      </div>

      {/* Attachment item cards */}
      <div className="space-y-2.5">
        {attachments.map((attachment, index) => {
          const isImage = attachment.type === 'image';
          const extension = getFileExtension(attachment.filename);
          const imageUrl = isImage && attachment.data ? `data:${attachment.mimeType};base64,${attachment.data}` : null;

          return (
            <div
              key={`${attachment.filename}-${index}`}
              className="group relative flex items-center justify-between gap-3 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800/90 hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-xs"
            >
              {/* Left Column: Visual Icon / Thumbnail + Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Visual Indicator / Thumbnail */}
                {isImage ? (
                  <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={attachment.filename}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setPreviewImage({ filename: attachment.filename, url: imageUrl })}
                        title="Click to view full preview"
                      />
                    ) : (
                      <span className="text-xl select-none" role="img" aria-label="Image">🖼️</span>
                    )}
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage({ filename: attachment.filename, url: imageUrl })}
                        className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        title="View image"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 flex-shrink-0 flex items-center justify-center">
                    <span className="text-xl select-none" role="img" aria-label="Document">📄</span>
                  </div>
                )}

                {/* Metadata & Labels */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  {/* Category Type Indicator: 🖼️ Image or 📄 Document */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium tracking-wide text-gray-600 dark:text-gray-300">
                      {isImage ? (
                        <>
                          <span>🖼️</span>
                          <span className="font-semibold text-sky-600 dark:text-sky-400">Image</span>
                        </>
                      ) : (
                        <>
                          <span>📄</span>
                          <span className="font-semibold text-amber-600 dark:text-amber-400">Document</span>
                        </>
                      )}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    {/* File Extension Badge (e.g., PNG, PDF) */}
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold tracking-wider uppercase ${
                        isImage
                          ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                      }`}
                    >
                      {extension}
                    </span>
                  </div>

                  {/* Filename */}
                  <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate" title={attachment.filename}>
                    {attachment.filename}
                  </div>

                  {/* MIME type & Size */}
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-600 dark:text-gray-300">
                      {formatFileSize(attachment.size)}
                    </span>
                    <span>•</span>
                    <span className="truncate max-w-[160px] sm:max-w-[240px]" title={attachment.mimeType}>
                      {attachment.mimeType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Delete / Remove Action */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(index)}
                  disabled={disabled}
                  className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors cursor-pointer disabled:opacity-40"
                  title={`Remove ${attachment.filename}`}
                  aria-label={`Remove attachment ${attachment.filename}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] bg-white dark:bg-gray-900 rounded-xl p-4 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🖼️</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-md">
                  {previewImage.filename}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close image preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 dark:bg-gray-950 rounded-lg p-2">
              <img
                src={previewImage.url}
                alt={previewImage.filename}
                className="max-w-full max-h-[65vh] object-contain rounded-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
