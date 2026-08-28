export type Page = 
  | 'dashboard' 
  | 'contacts' 
  | 'campaigns-list' 
  | 'templates' 
  | 'settings' 
  | 'campaign-editor'
  | 'template-editor'
  | 'campaign-report';

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

export type Contact = {
  id: number;
  user_id: string;
  list_id: number;
  name: string;
  email: string;
  company: string;
  status: 'subscribed' | 'unsubscribed';
  last_contacted: string;
  [key: string]: any;
};

export type ContactList = {
  id: number;
  user_id: string;
  name: string;
  contactCount: number;
  importedAt: string;
  contacts: Contact[];
};

export type CampaignStatus = 'draft' | 'scheduled' | 'sent';

export type Campaign = {
  id: number;
  user_id: string;
  name: string;
  subject: string;
  body: string;
  recipient_ids: number[];
  status: CampaignStatus;
  created_at: string;
  scheduled_at?: string;
  attachment?: {
    name: string;
    content: string; // base64
    type: string;
  };
};

export type EmailTemplate = {
  id: number;
  user_id?: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
};

export type AppActivity = {
  id: number;
  user_id: string;
  type: 'campaign-sent' | 'list-imported' | 'campaign-created' | 'template-created';
  description: string;
  timestamp: Date;
  metadata?: {
    campaignId?: number;
    listId?: number;
    templateId?: number;
  }
};

export type DashboardMetrics = {
    emailsSent: number;
    emailsDelivered: number;
    emailsOpened: number;
    emailsReplied: number;
    deliveryRate: string;
    openRate: string;
};

export type CampaignDataPoint = {
    date: string;
    sent: number;
    opened: number;
    replied: number;
};

export type SearchResults = {
  campaigns: Campaign[];
  templates: EmailTemplate[];
  contacts: Contact[];
};

export type SendMethod = 'n8n' | 'simulate';