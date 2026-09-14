import { EmailAttachment, EmailAttachmentType } from '../types';

export const MAX_ATTACHMENT_SIZE_BYTES = 15 * 1024 * 1024; // 15MB per file
export const MAX_TOTAL_ATTACHMENTS_SIZE_BYTES = 25 * 1024 * 1024; // 25MB total

/**
 * Extracts file extension in uppercase (e.g., 'PNG', 'PDF', 'DOCX').
 */
export function getFileExtension(filename: string): string {
  if (!filename) return 'FILE';
  const parts = filename.split('.');
  if (parts.length <= 1) return 'FILE';
  return parts.pop()?.toUpperCase() || 'FILE';
}

/**
 * Formats byte size into human readable string (e.g., 124 KB, 1.4 MB).
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, i);
  return `${size < 10 && i > 0 ? size.toFixed(1) : Math.round(size)} ${units[i]}`;
}

/**
 * Automatically determines attachment category ('image' vs 'document') and normalized MIME type.
 * Requirement:
 * - If file.type starts with "image/" -> type = "image"
 * - Otherwise -> type = "document"
 * Supported attachment categories:
 * IMAGE: image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml
 * DOCUMENT: application/pdf, application/msword, docx, xls, xlsx, text/plain, text/csv, application/rtf
 * Gracefully handles other file types by classifying them as "document" unless they are an image.
 */
export function detectAttachmentType(file: { name: string; type?: string }): {
  type: EmailAttachmentType;
  mimeType: string;
  extension: string;
} {
  const filename = file.name || 'file';
  const rawMime = (file.type || '').trim().toLowerCase();
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  // Check if MIME type or extension is an image
  const isImageMime = rawMime.startsWith('image/');
  const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
  const isImageExt = imageExtensions.includes(ext);

  if (isImageMime || isImageExt) {
    let mimeType = rawMime;
    if (!mimeType || !mimeType.startsWith('image/')) {
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
      else if (ext === 'webp') mimeType = 'image/webp';
      else if (ext === 'gif') mimeType = 'image/gif';
      else if (ext === 'svg') mimeType = 'image/svg+xml';
      else mimeType = 'image/png';
    }
    // Normalize image/jpg to image/jpeg if needed, or keep standard
    if (mimeType === 'image/jpg') mimeType = 'image/jpeg';

    return {
      type: 'image',
      mimeType,
      extension: getFileExtension(filename),
    };
  }

  // Otherwise, default to "document"
  let mimeType = rawMime;
  if (!mimeType || mimeType === 'application/octet-stream') {
    if (ext === 'pdf') mimeType = 'application/pdf';
    else if (ext === 'doc') mimeType = 'application/msword';
    else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === 'xls') mimeType = 'application/vnd.ms-excel';
    else if (ext === 'xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (ext === 'txt') mimeType = 'text/plain';
    else if (ext === 'csv') mimeType = 'text/csv';
    else if (ext === 'rtf') mimeType = 'application/rtf';
    else mimeType = rawMime || 'application/octet-stream';
  }

  return {
    type: 'document',
    mimeType,
    extension: getFileExtension(filename),
  };
}

/**
 * Validates a file before attachment.
 */
export function validateAttachmentFile(
  file: File,
  currentTotalSize: number = 0
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (file.size === 0) {
    return { valid: false, error: `Attachment "${file.name}" is empty (0 bytes).` };
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: `Attachment "${file.name}" is too large (${formatFileSize(file.size)}). Maximum allowed size is ${formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)}.`,
    };
  }

  if (currentTotalSize + file.size > MAX_TOTAL_ATTACHMENTS_SIZE_BYTES) {
    return {
      valid: false,
      error: `Total attachments size limit reached (${formatFileSize(MAX_TOTAL_ATTACHMENTS_SIZE_BYTES)}). Cannot add "${file.name}".`,
    };
  }

  return { valid: true };
}

/**
 * Reads a browser File object and converts it to pure Base64 data without data URL prefix.
 */
export function fileToBase64Data(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        // Strip data:*;base64, prefix completely
        const commaIndex = result.indexOf(',');
        const base64Only = commaIndex >= 0 ? result.substring(commaIndex + 1) : result;
        if (!base64Only) {
          reject(new Error(`Failed to extract Base64 data from "${file.name}".`));
          return;
        }
        resolve(base64Only);
      } else {
        reject(new Error(`FileReader returned non-string data for "${file.name}".`));
      }
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file "${file.name}".`));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Converts a browser File into a normalized EmailAttachment object.
 */
export async function processFileToAttachment(
  file: File,
  currentTotalSize: number = 0
): Promise<{ attachment: EmailAttachment | null; error?: string }> {
  const validation = validateAttachmentFile(file, currentTotalSize);
  if (!validation.valid) {
    return { attachment: null, error: validation.error };
  }

  try {
    const data = await fileToBase64Data(file);
    const { type, mimeType } = detectAttachmentType(file);

    const attachment: EmailAttachment = {
      type,
      filename: file.name,
      mimeType,
      size: file.size,
      data,
    };

    return { attachment };
  } catch (err: any) {
    return {
      attachment: null,
      error: `Base64 conversion failed for "${file.name}": ${err?.message || 'Unknown read error'}`,
    };
  }
}

/**
 * Normalizes any campaign data structure (including legacy svg/attachment fields)
 * into a standard array of EmailAttachment objects.
 */
export function normalizeCampaignAttachments(campaign: any): EmailAttachment[] {
  if (!campaign) return [];

  // Parse JSON string if campaign.attachment was stored as a string
  let attachmentObj = campaign.attachment;
  if (typeof attachmentObj === 'string' && attachmentObj.trim().startsWith('{')) {
    try {
      attachmentObj = JSON.parse(attachmentObj);
    } catch {
      // Keep as is
    }
  }

  // Case 1: Already has normalized attachments array
  if (Array.isArray(campaign.attachments) && campaign.attachments.length > 0) {
    return campaign.attachments.map((att: any) => {
      const rawData = (att.data || att.content || '').replace(/^data:.*?;base64,/, '');
      const { type, mimeType } = detectAttachmentType({
        name: att.filename || att.name || 'attachment',
        type: att.mimeType || att.type,
      });

      return {
        type: att.type === 'image' || att.type === 'document' ? att.type : type,
        filename: att.filename || att.name || (type === 'image' ? 'attachment.png' : 'attachment.pdf'),
        mimeType: att.mimeType || mimeType,
        size: typeof att.size === 'number' ? att.size : Math.round((rawData.length * 3) / 4),
        data: rawData,
      };
    });
  }

  // Case 1b: Multiple attachments saved inside attachment.attachments JSON property
  if (attachmentObj && Array.isArray(attachmentObj.attachments) && attachmentObj.attachments.length > 0) {
    return normalizeCampaignAttachments({ attachments: attachmentObj.attachments });
  }

  // Case 2: Legacy single attachment object
  if (attachmentObj && (attachmentObj.content || attachmentObj.name || attachmentObj.filename)) {
    const rawContent = (attachmentObj.content || attachmentObj.data || '').replace(/^data:.*?;base64,/, '');
    const { type, mimeType } = detectAttachmentType({
      name: attachmentObj.filename || attachmentObj.name || 'attachment',
      type: attachmentObj.mimeType || attachmentObj.type,
    });

    return [
      {
        type,
        filename: attachmentObj.filename || attachmentObj.name || (type === 'image' ? 'attachment.png' : 'document.pdf'),
        mimeType: attachmentObj.mimeType || attachmentObj.type || mimeType,
        size: attachmentObj.size || Math.round((rawContent.length * 3) / 4),
        data: rawContent,
      },
    ];
  }

  // Case 3: Legacy svg/svgdataUrl/svgcontent fields
  if (campaign.svgdataUrl || campaign.svgcontent || campaign.svg) {
    const rawDataUrl = campaign.svgdataUrl || '';
    const rawContent = campaign.svgcontent || campaign.svg || '';
    let mimeType = 'image/png';
    let data = '';

    if (rawDataUrl && typeof rawDataUrl === 'string') {
      const mimeMatch = rawDataUrl.match(/^data:([^;]+);base64,/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      data = rawDataUrl.replace(/^data:.*?;base64,/, '');
    } else if (rawContent) {
      data = rawContent.replace(/^data:.*?;base64,/, '');
    }

    if (data) {
      return [
        {
          type: 'image',
          filename: 'attachment.png',
          mimeType,
          size: Math.round((data.length * 3) / 4),
          data,
        },
      ];
    }
  }

  return [];
}

/**
 * Standard test fixtures matching user requirements for testing n8n workflows
 */
export const SAMPLE_PNG_ATTACHMENT: EmailAttachment = {
  type: 'image',
  filename: 'logo.png',
  mimeType: 'image/png',
  size: 68,
  data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
};

export const SAMPLE_PDF_ATTACHMENT: EmailAttachment = {
  type: 'document',
  filename: 'invoice.pdf',
  mimeType: 'application/pdf',
  size: 322,
  data: 'JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgMzAwIDE0NF0KL1Jlc291cmNlcyA8PAo+PgovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA1NQo+PgpzdHJlYW0KQlQKL0YxIDE4IFRmCjUwIDEwMCBUZAooVGVzdCBQREYgZm9yIG44biBBdHRhY2htZW50cykgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyMTcgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA1Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgorMzIyCiUlRU9GCg==',
};

