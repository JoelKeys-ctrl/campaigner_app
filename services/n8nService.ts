import { Campaign, Contact, SendMethod } from '../types';
import { DEFAULT_N8N_WEBHOOK_URL } from '../constants';

// This interface defines the structure for each item sent to n8n.
interface N8nWorkflowItem {
  campaign: {
    id: number;
    name: string;
    subject: string;
    body: string;
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
 * Tests connection to the specified n8n webhook URL.
 */
export const testWebhookConnection = async (webhookUrl: string): Promise<{ success: boolean; message: string }> => {
  const url = (webhookUrl || DEFAULT_N8N_WEBHOOK_URL).trim();
  if (!url) {
    return { success: false, message: "Webhook URL is missing." };
  }

  const testPayload = [
    {
      test: true,
      event: 'connection_test',
      timestamp: new Date().toISOString(),
      campaign: {
        id: 0,
        name: 'Connection Test Campaign',
        subject: 'Ping Test from Campaigner Pro',
        body: '<p>Testing connection to n8n webhook workflow.</p>',
      },
      contact: {
        email: 'test.recipient@example.com',
        name: 'Test Contact',
        company: 'Nexflow Test',
      }
    }
  ];

  try {
    console.log("Testing n8n webhook connection with payload:", testPayload, "to:", url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `Webhook returned HTTP ${response.status} (${response.statusText})${errorText ? `: ${errorText}` : ''}`
      };
    }

    return {
      success: true,
      message: 'Connection successful! Test payload was received by the n8n webhook.'
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown network error';
    return {
      success: false,
      message: `Failed to connect to webhook: ${message}`
    };
  }
};

/**
 * Triggers an n8n workflow or simulates sending an email campaign.
 * The payload is an array of items, where each item contains the full campaign
 * details and the details for a single contact. This structure is ideal for
 * batch processing in workflows like n8n.
 * 
 * @param campaign The campaign object.
 * @param recipients A list of contacts to send the campaign to.
 * @param n8nWebhookUrl The webhook URL for the n8n workflow.
 * @param sendMethod Determines whether to use n8n or simulate the send.
 */
export const sendCampaign = async (campaign: Campaign, recipients: Contact[], n8nWebhookUrl: string, sendMethod: SendMethod): Promise<{ success: boolean; message: string }> => {
  if (recipients.length === 0) {
    const message = "No recipients selected for this campaign.";
    console.warn(message);
    return { success: false, message };
  }

  // Handle simulated send for testing
  if (sendMethod === 'simulate') {
    console.log(`Simulating send for campaign "${campaign.name}" to ${recipients.length} recipients.`);
    // Mimic network delay
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    console.log("Simulation complete.");
    return { success: true, message: "Campaign sent successfully (Simulated)." };
  }

  const effectiveWebhookUrl = (n8nWebhookUrl || DEFAULT_N8N_WEBHOOK_URL).trim();

  // Proceed with n8n webhook if not simulating
  if (!effectiveWebhookUrl) {
    const message = "n8n webhook URL is not configured. Please set it on the Settings page.";
    console.warn(message);
    return { success: false, message };
  }

  const campaignDetails = {
    id: campaign.id,
    name: campaign.name,
    subject: campaign.subject,
    body: campaign.body,
    attachment: campaign.attachment,
  };

  // Create an array payload. Each item combines campaign data with one contact.
  const payload: N8nWorkflowItem[] = recipients.map(recipient => ({
    campaign: campaignDetails,
    contact: {
      email: recipient.email,
      name: recipient.name,
      company: recipient.company,
    }
  }));


  try {
    console.log("Sending campaign via n8n with payload:", payload);
    const response = await fetch(effectiveWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // The body is the stringified array.
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`n8n webhook returned an error: ${response.status} ${response.statusText}. Response: ${errorText}`);
    }

    try {
        const responseText = await response.text();
        if (responseText) {
            const result = JSON.parse(responseText);
            console.log("n8n response:", result);
        } else {
            console.log("n8n workflow responded with an empty body, which is acceptable.");
        }
    } catch (e) {
        console.warn("Could not parse n8n response as JSON. This might be expected if the webhook returns no content.", e);
    }
    
    return { success: true, message: "Campaign sent to n8n workflow." };

  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred while sending the campaign.";
    console.error("Failed to send campaign:", message);
    return { success: false, message };
  }
};