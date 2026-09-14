import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { EmailAttachment } from '../../types';
import { SAMPLE_PNG_ATTACHMENT, SAMPLE_PDF_ATTACHMENT, formatFileSize } from '../../services/attachmentUtils';
import { testWebhookConnection, N8nWebhookPayloadItem } from '../../services/n8nService';
import { Check, Copy, Send, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';

interface WebhookPayloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  subject: string;
  body: string;
  currentAttachments: EmailAttachment[];
  onApplyPresetAttachments: (attachments: EmailAttachment[]) => void;
  webhookUrl?: string;
  recipientEmail?: string;
  recipientName?: string;
}

export const WebhookPayloadModal: React.FC<WebhookPayloadModalProps> = ({
  isOpen,
  onClose,
  campaignName,
  subject,
  body,
  currentAttachments,
  onApplyPresetAttachments,
  webhookUrl = '',
  recipientEmail = 'rubaimam3@gmail.com',
  recipientName = 'Ruba',
}) => {
  const [copied, setCopied] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const hasAttachment = currentAttachments.length > 0;

  // Build the clean JSON payload matching Section 5 & Section 13 exactly
  const payloadPreview: N8nWebhookPayloadItem = {
    recipient: recipientEmail,
    name: recipientName,
    company: '',
    subject: subject || 'Email subject',
    body: body || '<p>Email body</p>',

    hasAttachment,
    attachments: currentAttachments,

    // Preserved fields
    email: recipientEmail,
    webhookUrl: webhookUrl || 'https://your-n8n-instance.com/webhook/...',
    executionMode: 'n8n',

    // Preserved legacy SVG/image fields
    svgcontent: currentAttachments[0]?.type === 'image' ? currentAttachments[0].data : '',
    svgdataUrl: currentAttachments[0]?.type === 'image' ? `data:${currentAttachments[0].mimeType};base64,${currentAttachments[0].data}` : '',
    svg: currentAttachments[0]?.type === 'image' ? currentAttachments[0].data : '',
    svgcontact: recipientName,
    svgemail: recipientEmail,
    svgname: recipientName,
    svgcompany: '',

    campaign: {
      id: 1,
      name: campaignName || 'Sample Campaign',
      subject: subject || 'Email subject',
      body: body || '<p>Email body</p>',
      hasAttachment,
      attachments: currentAttachments,
      attachment: currentAttachments[0] ? {
        name: currentAttachments[0].filename,
        content: currentAttachments[0].data,
        type: currentAttachments[0].mimeType,
      } : undefined,
    },
    contact: {
      email: recipientEmail,
      name: recipientName,
      company: '',
    },
  };

  // Truncate Base64 data for display so modal doesn't freeze with megabytes of text
  const displayPayload = {
    recipient: payloadPreview.recipient,
    name: payloadPreview.name,
    company: payloadPreview.company,
    subject: payloadPreview.subject,
    body: payloadPreview.body,
    hasAttachment: payloadPreview.hasAttachment,
    attachments: payloadPreview.attachments.map(att => ({
      type: att.type,
      filename: att.filename,
      mimeType: att.mimeType,
      size: att.size,
      data: att.data.length > 60 
        ? `${att.data.substring(0, 40)}... [${formatFileSize(att.size)} Base64 data truncated for display]` 
        : att.data
    })),
    email: payloadPreview.email,
    webhookUrl: payloadPreview.webhookUrl,
    executionMode: payloadPreview.executionMode,
  };

  const jsonString = JSON.stringify(displayPayload, null, 2);

  const handleCopy = () => {
    // Copy full payload with raw data
    navigator.clipboard.writeText(JSON.stringify(payloadPreview, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTestToWebhook = async () => {
    if (!webhookUrl) {
      setTestResult({ success: false, message: 'Please configure your n8n Webhook URL in Settings first.' });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/webhook/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          payload: payloadPreview,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setTestResult({
          success: true,
          message: `Successfully delivered payload to n8n webhook (HTTP ${data.status || 200}).`,
        });
      } else {
        setTestResult({
          success: false,
          message: data?.error || `Webhook returned status ${response.status}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Network request to n8n failed.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="n8n Webhook Payload Inspector & Tests">
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Test Preset Buttons */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Load Test Scenarios (1-Click Presets)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                onApplyPresetAttachments([]);
                setTestResult(null);
              }}
              className={`p-2 rounded-lg border text-left transition-all text-xs font-medium cursor-pointer ${
                currentAttachments.length === 0
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                <span>🚫</span> TEST 1
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">No attachment</div>
              <div className="text-[10px] text-brand-600 dark:text-brand-400 mt-1">hasAttachment: false</div>
            </button>

            <button
              type="button"
              onClick={() => {
                onApplyPresetAttachments([SAMPLE_PNG_ATTACHMENT]);
                setTestResult(null);
              }}
              className={`p-2 rounded-lg border text-left transition-all text-xs font-medium cursor-pointer ${
                currentAttachments.length === 1 && currentAttachments[0].type === 'image'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                <span>🖼️</span> TEST 2
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Sample PNG</div>
              <div className="text-[10px] text-sky-600 dark:text-sky-400 mt-1">type: "image"</div>
            </button>

            <button
              type="button"
              onClick={() => {
                onApplyPresetAttachments([SAMPLE_PDF_ATTACHMENT]);
                setTestResult(null);
              }}
              className={`p-2 rounded-lg border text-left transition-all text-xs font-medium cursor-pointer ${
                currentAttachments.length === 1 && currentAttachments[0].type === 'document'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                <span>📄</span> TEST 3
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Sample PDF</div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">type: "document"</div>
            </button>

            <button
              type="button"
              onClick={() => {
                onApplyPresetAttachments([SAMPLE_PNG_ATTACHMENT, SAMPLE_PDF_ATTACHMENT]);
                setTestResult(null);
              }}
              className={`p-2 rounded-lg border text-left transition-all text-xs font-medium cursor-pointer ${
                currentAttachments.length === 2
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                <span>📦</span> TEST 4
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">PNG + PDF</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">2 attachments</div>
            </button>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-gray-500 dark:text-gray-400">hasAttachment: </span>
              <span className={`font-mono font-bold ${hasAttachment ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {String(hasAttachment)}
              </span>
            </div>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Attachments: </span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">
                {currentAttachments.length}
              </span>
            </div>
          </div>
          <div className="text-gray-500 dark:text-gray-400 truncate max-w-xs font-mono text-[11px]">
            {webhookUrl ? 'Target: ' + webhookUrl.substring(0, 35) + '...' : 'No webhook URL set'}
          </div>
        </div>

        {/* Test execution result banner */}
        {testResult && (
          <div
            className={`p-3 rounded-lg flex items-start gap-2.5 text-xs ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{testResult.message}</div>
          </div>
        )}

        {/* JSON Code Viewer */}
        <div className="relative">
          <div className="flex items-center justify-between pb-1.5 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5 font-medium">
              <FileCode className="w-4 h-4 text-brand-500" />
              <span>Exact POST Body (application/json)</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-[11px] font-mono leading-relaxed overflow-x-auto max-h-64 border border-gray-800 selection:bg-brand-600">
            {jsonString}
          </pre>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={handleSendTestToWebhook}
              isLoading={isSendingTest}
              disabled={isSendingTest}
            >
              <Send className="w-4 h-4 mr-1.5" />
              Send Payload to n8n Webhook
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
