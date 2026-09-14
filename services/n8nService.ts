import { Campaign, Contact, SendMethod, EmailAttachment } from '../types';
import { DEFAULT_N8N_WEBHOOK_URL } from '../constants';
import { normalizeCampaignAttachments } from './attachmentUtils';

/**
 * Interface defining the exact payload sent to the n8n webhook.
 * Fulfills all requirements:
 * - Flat recipient & message fields (recipient, name, company, subject, body)
 * - Exact attachment fields (hasAttachment: boolean, attachments: array)
 * - Preserved existing fields (email, name, company, webhookUrl, executionMode)
 * - Preserved existing image/svg fields (svgcontent, svgdataUrl, svg, etc.)
 * - Preserved legacy campaign/contact structures for backwards compatibility
 */
export interface N8nWebhookPayloadItem {
  recipient: string;
  name: string;
  company: string;
  subject: string;
  body: string;

  hasAttachment: boolean;
  attachments: EmailAttachment[];

  // Preserved fields (Item 8)
  email: string;
  webhookUrl: string;
  executionMode: string;

  // Preserved image / SVG fields (Item 12)
  svgcontent: string;
  svgdataUrl: string;
  svg: string;
  svgcontact: string;
  svgemail: string;
  svgname: string;
  svgcompany: string;

  // Preserved nested campaign & contact objects
  campaign: {
    id: number;
    name: string;
    subject: string;
    body: string;
    hasAttachment: boolean;
    attachments: EmailAttachment[];
    attachment?: {
      name: string;
      content: string;
      type: string;
    };
  };
  contact: {
    email: string;
    name: string;
    company: string;
  };
}

/**
 * Builds a normalized n8n payload item for a single recipient.
 */
export function buildN8nPayloadItem(
  campaign: Campaign,
  recipient: Contact,
  webhookUrl: string,
  sendMethod: SendMethod
): N8nWebhookPayloadItem {
  // Normalize attachments from campaign
  const attachments = normalizeCampaignAttachments(campaign);
  const hasAttachment = attachments.length > 0;

  // Find first image attachment for legacy svg fields
  const firstImage = attachments.find(att => att.type === 'image');
  const legacySvgDataUrl = firstImage ? `data:${firstImage.mimeType};base64,${firstImage.data}` : '';
  const legacySvgContent = firstImage ? firstImage.data : '';

  return {
    recipient: recipient.email || '',
    name: recipient.name || '',
    company: recipient.company || '',
    subject: campaign.subject || '',
    body: campaign.body || '',

    hasAttachment,
    attachments,

    // Preserved fields
    email: recipient.email || '',
    webhookUrl,
    executionMode: sendMethod,

    // Preserved legacy SVG/image fields
    svgcontent: legacySvgContent,
    svgdataUrl: legacySvgDataUrl,
    svg: legacySvgContent,
    svgcontact: recipient.name || '',
    svgemail: recipient.email || '',
    svgname: recipient.name || '',
    svgcompany: recipient.company || '',

    // Nested structures for backward-compatible n8n nodes
    campaign: {
      id: campaign.id,
      name: campaign.name,
      subject: campaign.subject,
      body: campaign.body,
      hasAttachment,
      attachments,
      attachment: attachments[0] ? {
        name: attachments[0].filename,
        content: attachments[0].data,
        type: attachments[0].mimeType,
      } : undefined,
    },
    contact: {
      email: recipient.email || '',
      name: recipient.name || '',
      company: recipient.company || '',
    },
  };
}

/**
 * Tests connection to the specified n8n webhook URL.
 */
export const testWebhookConnection = async (webhookUrl: string): Promise<{ success: boolean; message: string }> => {
  const url = (webhookUrl || DEFAULT_N8N_WEBHOOK_URL).trim();
  if (!url) {
    return { success: false, message: "Webhook URL is missing." };
  }

  const testPayload: N8nWebhookPayloadItem = {
    recipient: 'test.recipient@example.com',
    name: 'Test Contact',
    company: 'Campaigner Pro Test',
    subject: 'Ping Test from Campaigner Pro',
    body: '<p>Testing connection to n8n webhook workflow.</p>',
    hasAttachment: false,
    attachments: [],
    email: 'test.recipient@example.com',
    webhookUrl: url,
    executionMode: 'test',
    svgcontent: '',
    svgdataUrl: '',
    svg: '',
    svgcontact: 'Test Contact',
    svgemail: 'test.recipient@example.com',
    svgname: 'Test Contact',
    svgcompany: 'Campaigner Pro Test',
    campaign: {
      id: 0,
      name: 'Connection Test Campaign',
      subject: 'Ping Test from Campaigner Pro',
      body: '<p>Testing connection to n8n webhook workflow.</p>',
      hasAttachment: false,
      attachments: [],
    },
    contact: {
      email: 'test.recipient@example.com',
      name: 'Test Contact',
      company: 'Campaigner Pro Test',
    },
  };

  let proxyError = '';

  // 1. First attempt via backend proxy (forces IPv4 DNS resolution & handles CORS)
  try {
    const proxyResponse = await fetch('/api/webhook/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhookUrl: url,
        payload: testPayload,
      }),
    });

    const proxyData = await proxyResponse.json().catch(() => null);

    if (proxyResponse.ok && proxyData?.success) {
      return {
        success: true,
        message: 'Connection successful! n8n webhook received the test payload.'
      };
    }

    proxyError = proxyData?.error || `Webhook returned HTTP ${proxyResponse.status}`;

    // If proxy reached n8n and received a response (e.g. 404, 400, 500), return that descriptive message immediately
    if (proxyData && !proxyData.isNetworkError) {
      return {
        success: false,
        message: proxyError,
      };
    }
  } catch (error: any) {
    proxyError = error?.message || 'Proxy request failed';
  }

  // 2. Direct browser fetch fallback (only attempted if local proxy server could not be reached)
  try {
    const directResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    if (directResponse.ok) {
      return {
        success: true,
        message: 'Connection successful! Test payload was received by the n8n webhook (direct connection).'
      };
    }

    const errorText = await directResponse.text().catch(() => '');
    return {
      success: false,
      message: `Webhook returned HTTP ${directResponse.status} (${directResponse.statusText})${errorText ? `: ${errorText}` : ''}`
    };
  } catch (directErr: any) {
    const message = directErr instanceof Error ? directErr.message : 'Network error';
    return {
      success: false,
      message: proxyError || `Failed to connect to webhook: ${message}. If using /webhook-test/, ensure n8n is actively listening in Test mode, or switch to the Production /webhook/ URL.`
    };
  }
};

/**
 * Triggers an n8n workflow or simulates sending an email campaign.
 * Handles single or multiple recipients and all attachment types (image, document, or none).
 * 
 * @param campaign The campaign object containing subject, body, and attachments.
 * @param recipients A list of contacts to send the campaign to.
 * @param n8nWebhookUrl The webhook URL for the n8n workflow.
 * @param sendMethod Determines whether to use n8n or simulate the send.
 */
export const sendCampaign = async (
  campaign: Campaign,
  recipients: Contact[],
  n8nWebhookUrl: string,
  sendMethod: SendMethod
): Promise<{ success: boolean; message: string }> => {
  if (recipients.length === 0) {
    const message = "No recipients selected for this campaign.";
    console.warn(message);
    return { success: false, message };
  }

  // Handle simulated send for testing
  if (sendMethod === 'simulate') {
    console.log(`Simulating send for campaign "${campaign.name}" to ${recipients.length} recipients.`);
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    return { success: true, message: "Campaign sent successfully (Simulated)." };
  }

  const effectiveWebhookUrl = (n8nWebhookUrl || DEFAULT_N8N_WEBHOOK_URL).trim();

  // Proceed with n8n webhook if not simulating
  if (!effectiveWebhookUrl) {
    const message = "n8n webhook URL is not configured. Please set it on the Settings page.";
    console.warn(message);
    return { success: false, message };
  }

  // Build normalized payloads for all recipients
  const items: N8nWebhookPayloadItem[] = recipients.map(recipient => 
    buildN8nPayloadItem(campaign, recipient, effectiveWebhookUrl, sendMethod)
  );

  // If 1 recipient, send object matching Section 5 format; if multiple, send array for batch processing
  const payload = items.length === 1 ? items[0] : items;

  try {
    console.log("Sending campaign via n8n with payload:", {
      recipientCount: recipients.length,
      hasAttachment: items[0]?.hasAttachment,
      attachmentCount: items[0]?.attachments.length,
      sampleRecipient: items[0]?.recipient,
    });

    let sentSuccessfully = false;
    let proxyErrorMessage = '';
    let reachedN8nEndpoint = false;

    // 1. Try server-side proxy first (bypasses browser CORS & mixed-content blocks)
    try {
      const proxyResponse = await fetch('/api/webhook/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookUrl: effectiveWebhookUrl,
          payload: payload,
        }),
      });

      const proxyData = await proxyResponse.json().catch(() => null);

      if (proxyResponse.ok && proxyData?.success) {
        sentSuccessfully = true;
      } else if (proxyData) {
        reachedN8nEndpoint = !proxyData.isNetworkError;
        proxyErrorMessage = proxyData.error || `n8n webhook returned status ${proxyResponse.status}`;
      } else {
        proxyErrorMessage = `Local server proxy returned HTTP ${proxyResponse.status}`;
      }
    } catch (proxyErr: any) {
      console.warn("[n8n Dispatch] Server proxy error:", proxyErr);
      proxyErrorMessage = proxyErr?.message || 'Proxy request failed';
    }

    // If the proxy reached the remote n8n server and n8n rejected the request (e.g. 404 test webhook inactive, 400, 500),
    // DO NOT attempt direct browser fetch across origins (it will trigger a CORS "Failed to fetch" masking the real error).
    if (!sentSuccessfully && reachedN8nEndpoint) {
      throw new Error(proxyErrorMessage);
    }

    // 2. Direct browser fallback ONLY if the local proxy server was unreachable
    if (!sentSuccessfully) {
      try {
        const response = await fetch(effectiveWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(`n8n webhook returned HTTP ${response.status} (${response.statusText})${errorText ? `: ${errorText}` : ''}`);
        }
        sentSuccessfully = true;
      } catch (directErr: any) {
        const message = directErr instanceof Error ? directErr.message : 'Network error';
        throw new Error(proxyErrorMessage || `Could not send to webhook: ${message}. If using an n8n Test URL (/webhook-test/), click "Listen for test event" in n8n first, or switch to Simulated Send in Settings.`);
      }
    }
    
    return { 
      success: true, 
      message: `Campaign sent to n8n webhook workflow (${recipients.length} recipient${recipients.length === 1 ? '' : 's'}).` 
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred while sending the campaign.";
    console.error("Failed to send campaign:", message);
    return { success: false, message };
  }
};
