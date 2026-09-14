import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import { ThemeProvider } from './contexts/ThemeContext';
import { Page, User, ContactList, Campaign, EmailTemplate, AppActivity, SearchResults, SendMethod, Contact } from './types';
import Layout from './components/layout/Layout';
import AuthPage from './components/auth/AuthPage';
import UpdatePasswordPage from './components/auth/UpdatePasswordPage';
import DashboardPage from './components/dashboard/DashboardPage';
import ContactsPage from './components/contacts/ContactsPage';
import CampaignsListPage from './components/campaign/CampaignsListPage';
import CampaignsPage from './components/campaign/CampaignsPage';
import TemplatesListPage from './components/templates/TemplatesListPage';
import TemplateEditorPage from './components/templates/TemplateEditorPage';
import SettingsPage from './components/settings/SettingsPage';
import CampaignReportPage from './components/campaign/CampaignReportPage';
import GlobalSearch from './components/search/GlobalSearch';
import { DEFAULT_N8N_WEBHOOK_URL } from './constants';
import { useDebounce } from './hooks/useDebounce';
import { useCampaignScheduler } from './hooks/useCampaignScheduler';
import { sendCampaign as triggerN8nCampaign } from './services/n8nService';
import { normalizeCampaignAttachments } from './services/attachmentUtils';

type NotificationType = 'success' | 'error';
interface NotificationState {
    message: string;
    type: NotificationType;
}

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [notification, setNotification] = useState<NotificationState | null>(null);
    const [authEvent, setAuthEvent] = useState('');

    // App Data State
    const [contactLists, setContactLists] = useState<ContactList[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [appActivity, setAppActivity] = useState<AppActivity[]>([]);
    const [n8nWebhookUrl, setN8nWebhookUrl] = useState(DEFAULT_N8N_WEBHOOK_URL);
    const [sendMethod, setSendMethod] = useState<SendMethod>('n8n');

    // Editor/Report State
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [reportingCampaign, setReportingCampaign] = useState<Campaign | null>(null);
    const [highlightedCampaignId, setHighlightedCampaignId] = useState<number | null>(null);

    // Global Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [searchResults, setSearchResults] = useState<SearchResults>({ campaigns: [], templates: [], contacts: [] });
    const justSignedInRef = React.useRef(false);
    
    // Auth Listener
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            setAuthEvent(event);
            if (event === 'SIGNED_IN') {
                justSignedInRef.current = true;
            } else if (event === 'PASSWORD_RECOVERY') {
                // User needs to set a new password
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsLoading(false);
                justSignedInRef.current = false;
            }
        });

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const showNotification = useCallback((message: string, type: NotificationType = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    }, []);
    
    const fetchAllData = useCallback(async (user: User) => {
        setIsLoading(true);
        try {
            const [listsRes, campaignsRes, templatesRes, activityRes, profileRes] = await Promise.all([
                supabase.from('contact_lists').select('*, contacts(*)').eq('user_id', user.id),
                supabase.from('campaigns').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
                supabase.from('templates').select('*').eq('user_id', user.id),
                supabase.from('app_activity').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }).limit(10),
                supabase.from('profiles').select('n8n_webhook_url, send_method').eq('id', user.id).maybeSingle(),
            ]);

            if (listsRes.error) throw listsRes.error;
            const formattedLists = listsRes.data.map(list => ({ ...list, contacts: list.contacts || [], contactCount: (list.contacts || []).length, importedAt: list.created_at }));
            setContactLists(formattedLists);

            if (campaignsRes.error) throw campaignsRes.error;
            const formattedCampaigns = campaignsRes.data.map((campaign: any) => {
                const normalizedAttachments = normalizeCampaignAttachments(campaign);
                return {
                    ...campaign,
                    recipient_ids: campaign.recipient_ids || [],
                    attachments: normalizedAttachments,
                    hasAttachment: normalizedAttachments.length > 0,
                };
            });
            setCampaigns(formattedCampaigns);

            if (templatesRes.error) throw templatesRes.error;
            setTemplates(templatesRes.data);

            if (activityRes.error) throw activityRes.error;
            const formattedActivity = activityRes.data.map((act: any) => ({...act, timestamp: new Date(act.timestamp)}));
            setAppActivity(formattedActivity);
            
            if (profileRes.data) {
                setN8nWebhookUrl(profileRes.data.n8n_webhook_url || DEFAULT_N8N_WEBHOOK_URL);
                setSendMethod(profileRes.data.send_method || 'n8n');
            } else {
                setN8nWebhookUrl(DEFAULT_N8N_WEBHOOK_URL);
                setSendMethod('n8n');
            }

        } catch (error: any) {
            console.error("Error fetching data:", error);
            const errorMessage = `Error fetching data: ${error.message}`;
            showNotification(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showNotification]);

    const fetchUser = useCallback(async (session: Session) => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            if (error) {
                console.warn("Could not fetch user profile details from database:", error);
            }

            const fetchedUser: User = {
                id: session.user.id,
                name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || 'user@example.com',
                avatarUrl: profile?.avatar_url || session.user.user_metadata?.avatar_url,
            };
            setUser(fetchedUser);

            if (justSignedInRef.current) {
                showNotification(`Welcome back, ${fetchedUser.name}!`, 'success');
                justSignedInRef.current = false;
            }

            // If profile does not exist yet, seed it in background
            if (!profile && !error) {
                supabase.from('profiles').upsert({
                    id: session.user.id,
                    full_name: fetchedUser.name,
                    email: fetchedUser.email,
                }).then(() => {}, () => {});
            }

            await fetchAllData(fetchedUser);
        } catch (err: any) {
            console.error("Error fetching user profile:", err);
            // Graceful resilience: do NOT sign the user out on network glitches
            const fallbackUser: User = {
                id: session.user.id,
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || 'user@example.com',
            };
            setUser(fallbackUser);
            setIsLoading(false);
        }
    }, [fetchAllData]);

    useEffect(() => {
        if (session && !user) {
            fetchUser(session);
        } else if (!session) {
            setIsLoading(false);
        }
    }, [session, user, fetchUser]);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error logging out:', error);
        setCurrentPage('dashboard');
        setUser(null);
    };

    const recordActivity = useCallback(async (type: AppActivity['type'], description: string, metadata: AppActivity['metadata']) => {
        if (!user) return;
        const newActivity: Omit<AppActivity, 'id' | 'timestamp'> = {
            user_id: user.id,
            type,
            description,
            metadata
        };
        const { data, error } = await supabase.from('app_activity').insert(newActivity).select().single();
        if (error) {
            console.error('Error recording activity:', error);
        } else if (data) {
            setAppActivity(prev => [ { ...data, timestamp: new Date(data.timestamp) }, ...prev].slice(0, 10));
        }
    }, [user]);

    // This function is called by the scheduler when a campaign is due.
    const handleScheduledCampaignSend = useCallback(async (campaign: Campaign) => {
        if (!user) return;
        
        console.log(`[Scheduler] Triggering send for scheduled campaign: ${campaign.name}`);

        const allContacts = contactLists.flatMap(list => list.contacts);
        const recipients = allContacts.filter(contact => campaign.recipient_ids.includes(contact.id));
        
        if (recipients.length === 0) {
            showNotification(`Scheduled campaign "${campaign.name}" has no recipients. Moving to drafts.`, "error");
            await supabase.from('campaigns').update({ status: 'draft', scheduled_at: null }).eq('id', campaign.id);
            setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: 'draft', scheduled_at: undefined } : c));
            return;
        }
        
        const result = await triggerN8nCampaign(campaign, recipients, n8nWebhookUrl, sendMethod);

        if (!result.success) {
            showNotification(`Failed to send scheduled campaign "${campaign.name}": ${result.message}`, 'error');
            // The campaign remains as 'scheduled' and the user can investigate/retry.
            return;
        }
        
        // On success, update the campaign status to 'sent' in the database and local state.
        const { data, error } = await supabase
            .from('campaigns')
            .update({ status: 'sent', scheduled_at: null })
            .eq('id', campaign.id)
            .select()
            .single();

        if (error) {
            showNotification(`Error updating status for sent campaign: ${error.message}`, 'error');
            console.error(error);
        } else if (data) {
            const normalizedAttachments = normalizeCampaignAttachments(data);
            const updatedCampaign: Campaign = {
                ...data,
                recipient_ids: data.recipient_ids || [],
                attachments: normalizedAttachments,
                hasAttachment: normalizedAttachments.length > 0,
            };
            setCampaigns(prev => prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
            recordActivity('campaign-sent', `Sent scheduled campaign: "${updatedCampaign.name}"`, { campaignId: updatedCampaign.id });
            showNotification(`Campaign "${updatedCampaign.name}" has been successfully sent!`);
            setHighlightedCampaignId(updatedCampaign.id);
        }

    }, [user, contactLists, n8nWebhookUrl, sendMethod, showNotification, recordActivity]);
        
    // Initialize the campaign scheduler
    useCampaignScheduler(campaigns, handleScheduledCampaignSend);
    
    // Campaign Handlers
    const handleSaveCampaign = async (campaignData: Omit<Campaign, 'id' | 'created_at' | 'user_id'> & { id?: number }): Promise<boolean> => {
        if (!user) return false;

        if (campaignData.status === 'sent') {
            const allContacts = contactLists.flatMap(list => list.contacts);
            const recipients = allContacts.filter(contact => campaignData.recipient_ids.includes(contact.id));

            if (recipients.length === 0) {
                showNotification("No recipients selected. Cannot send campaign.", "error");
                return false;
            }

            const campaignForN8n: Campaign = {
                id: campaignData.id || 0,
                user_id: user.id,
                name: campaignData.name,
                subject: campaignData.subject,
                body: campaignData.body,
                recipient_ids: campaignData.recipient_ids,
                status: 'sent',
                created_at: editingCampaign?.created_at || new Date().toISOString(),
                attachment: campaignData.attachment,
                attachments: campaignData.attachments || [],
                hasAttachment: Boolean(campaignData.attachments && campaignData.attachments.length > 0)
            };

            const result = await triggerN8nCampaign(campaignForN8n, recipients, n8nWebhookUrl, sendMethod);

            if (!result.success) {
                showNotification(`Failed to send campaign: ${result.message}`, 'error');
                return false;
            }
        }

        let attachmentPayload: any = null;
        if (campaignData.attachments && campaignData.attachments.length > 0) {
            attachmentPayload = {
                name: campaignData.attachments[0].filename,
                type: campaignData.attachments[0].mimeType,
                content: campaignData.attachments[0].data,
                size: campaignData.attachments[0].size,
                attachments: campaignData.attachments, // multi-attachments preserved in JSON column
            };
        } else if (campaignData.attachment) {
            attachmentPayload = campaignData.attachment;
        }

        // Only pass valid columns to Supabase PostgreSQL (schema does NOT have hasAttachment or attachments columns)
        const dbUpsert: Record<string, any> = {
            user_id: user.id,
            name: campaignData.name || '',
            subject: campaignData.subject || '',
            body: campaignData.body || '',
            recipient_ids: campaignData.recipient_ids || [],
            status: campaignData.status || 'draft',
            attachment: attachmentPayload,
        };

        if (campaignData.id) {
            dbUpsert.id = campaignData.id;
        }
        if (campaignData.scheduled_at !== undefined) {
            dbUpsert.scheduled_at = campaignData.scheduled_at;
        }

        const { data, error } = await supabase
            .from('campaigns')
            .upsert(dbUpsert)
            .select()
            .single();
        
        if (error) {
            showNotification(`Error saving campaign: ${error.message}`, 'error');
            console.error("Error saving campaign:", error);
            return false;
        } else if (data) {
            const normalizedAttachments = normalizeCampaignAttachments(data);
            const savedCampaign: Campaign = {
                ...data,
                recipient_ids: data.recipient_ids || [],
                attachments: normalizedAttachments,
                hasAttachment: normalizedAttachments.length > 0,
            };
            setCampaigns(prev => {
                const existing = prev.find(c => c.id === savedCampaign.id);
                if (existing) {
                    return prev.map(c => c.id === savedCampaign.id ? savedCampaign : c);
                }
                return [savedCampaign, ...prev];
            });

            if (!campaignData.id) { // New campaign
                recordActivity('campaign-created', `Created campaign: "${savedCampaign.name}"`, { campaignId: savedCampaign.id });
            }
            
            let message = '';
            if (campaignData.status === 'sent') {
                message = `Campaign "${savedCampaign.name}" has been successfully sent!`;
                recordActivity('campaign-sent', `Sent campaign: "${savedCampaign.name}"`, { campaignId: savedCampaign.id });
            } else if (campaignData.status === 'scheduled') {
                 message = `Campaign "${savedCampaign.name}" has been scheduled.`;
            } else {
                 message = `Campaign "${savedCampaign.name}" saved as draft.`;
            }
            showNotification(message);
            
            setCurrentPage('campaigns-list');
            setEditingCampaign(null);
            setHighlightedCampaignId(savedCampaign.id);
            return true;
        }

        return false;
    };

    const handleDeleteCampaign = async (campaignId: number) => {
        const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);
        if (error) {
            showNotification(`Error deleting campaign: ${error.message}`, 'error');
        } else {
            setCampaigns(prev => prev.filter(c => c.id !== campaignId));
            showNotification("Campaign successfully deleted.");
        }
    };

    const handleCreateCampaign = () => {
        setEditingCampaign(null);
        setCurrentPage('campaign-editor');
    };

    const handleEditCampaign = (campaign: Campaign) => {
        setEditingCampaign(campaign);
        setCurrentPage('campaign-editor');
    };

    const handleViewReport = (campaign: Campaign) => {
        setReportingCampaign(campaign);
        setCurrentPage('campaign-report');
    };
    
    const handleCloseEditor = () => {
        setEditingCampaign(null);
        setEditingTemplate(null);
        setReportingCampaign(null);
        setCurrentPage(prev => {
            if (prev === 'campaign-editor') return 'campaigns-list';
            if (prev === 'template-editor') return 'templates';
            if (prev === 'campaign-report') return 'campaigns-list';
            return prev;
        });
    };

    // Contact List Handlers
    const handleImportList = async ({ name, contacts }: { name: string, contacts: Omit<Contact, 'id'|'user_id'|'list_id'>[] }) => {
        if (!user) return;
        
        // 1. Insert the list
        const { data: listData, error: listError } = await supabase
            .from('contact_lists')
            .insert({ name, user_id: user.id })
            .select()
            .single();
        
        if (listError) {
            showNotification(`Error creating list: ${listError.message}`, 'error');
            return;
        }

        // 2. Prepare contacts with the new list_id
        const contactsToInsert = contacts.map(c => ({
            ...c,
            user_id: user.id,
            list_id: listData.id
        }));

        // 3. Insert contacts
        const { data: contactsData, error: contactsError } = await supabase
            .from('contacts')
            .insert(contactsToInsert)
            .select();

        if (contactsError) {
            showNotification(`Error importing contacts: ${contactsError.message}`, 'error');
            // Optional: Rollback list creation
            await supabase.from('contact_lists').delete().eq('id', listData.id);
            return;
        }

        // 4. Update state
        const newList: ContactList = {
            ...listData,
            contacts: contactsData,
            contactCount: contactsData.length,
            importedAt: listData.created_at,
        };
        setContactLists(prev => [newList, ...prev]);
        showNotification(`Successfully imported ${contactsData.length} contacts into "${name}".`);
        recordActivity('list-imported', `Imported list "${name}" with ${contactsData.length} contacts.`, { listId: listData.id });
    };
    
    const handleDeleteList = async (listId: number) => {
        const { error } = await supabase.from('contact_lists').delete().eq('id', listId);
        if (error) {
            showNotification(`Error deleting list: ${error.message}`, 'error');
        } else {
            setContactLists(prev => prev.filter(l => l.id !== listId));
            showNotification("Contact list and all associated contacts deleted.");
        }
    };
    
    const handleRenameList = async (listId: number, newName: string) => {
        const { data, error } = await supabase
            .from('contact_lists')
            .update({ name: newName })
            .eq('id', listId)
            .select()
            .single();
        
        if (error) {
            showNotification(`Error renaming list: ${error.message}`, 'error');
        } else if (data) {
            setContactLists(prev => prev.map(l => l.id === listId ? { ...l, name: data.name } : l));
            showNotification("List renamed successfully.");
        }
    };

    // Template Handlers
    const handleSaveTemplate = async (templateData: Omit<EmailTemplate, 'id' | 'created_at' | 'user_id'> & { id?: number }) => {
        if (!user) return;
        const isNew = !templateData.id || templateData.id === 0;
        const templateToUpsert: any = {
            name: templateData.name,
            subject: templateData.subject,
            body: templateData.body,
            user_id: user.id
        };
        if (!isNew) {
            templateToUpsert.id = templateData.id;
        }

        const { data, error } = await supabase.from('templates').upsert(templateToUpsert).select().single();
        if (error) {
            showNotification(`Error saving template: ${error.message}`, 'error');
        } else if (data) {
            setTemplates(prev => {
                const existing = prev.find(t => t.id === data.id);
                if (existing) {
                    return prev.map(t => t.id === data.id ? data : t);
                }
                return [data, ...prev];
            });
            if (isNew) {
                recordActivity('template-created', `Created template: "${data.name}"`, { templateId: data.id });
            }
            showNotification(`Template "${data.name}" saved.`);
            setCurrentPage('templates');
            setEditingTemplate(null);
        }
    };
    
    const handleDeleteTemplate = async (templateId: number) => {
        const { error } = await supabase.from('templates').delete().eq('id', templateId);
        if (error) {
            showNotification(`Error deleting template: ${error.message}`, 'error');
        } else {
            setTemplates(prev => prev.filter(t => t.id !== templateId));
            showNotification("Template deleted.");
        }
    };

    const handleEditTemplate = (template: EmailTemplate | null) => {
        setEditingTemplate(template);
        setCurrentPage('template-editor');
    };

    const handleCreateCampaignFromTemplate = (template: EmailTemplate) => {
        const newCampaign: Campaign = {
            id: 0, // Placeholder
            user_id: user?.id || '',
            name: `Campaign from ${template.name}`,
            subject: template.subject,
            body: template.body,
            recipient_ids: [],
            status: 'draft',
            created_at: new Date().toISOString(),
        };
        setEditingCampaign(newCampaign);
        setCurrentPage('campaign-editor');
    };

    // Settings Handlers
    const handleSaveSettings = async (url: string, method: SendMethod) => {
        if (!user) return;
        const { error } = await supabase.from('profiles').update({ n8n_webhook_url: url, send_method: method }).eq('id', user.id);
        if (error) {
            showNotification(`Error saving settings: ${error.message}`, 'error');
        } else {
            setN8nWebhookUrl(url);
            setSendMethod(method);
        }
    };

    const handleUpdateProfile = async (updates: { name: string; avatarFile?: File }) => {
        if (!user) return;
        let avatar_url = user.avatarUrl;
    
        if (updates.avatarFile) {
            const file = updates.avatarFile;
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${Math.random()}.${fileExt}`;
    
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
            if (uploadError) {
                showNotification(`Error uploading avatar: ${uploadError.message}`, 'error');
                return;
            }
    
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            avatar_url = data.publicUrl;
        }
    
        const { data, error } = await supabase
            .from('profiles')
            .update({ full_name: updates.name, avatar_url })
            .eq('id', user.id)
            .select()
            .single();
    
        if (error) {
            showNotification(`Error updating profile: ${error.message}`, 'error');
        } else if (data) {
            setUser(prev => prev ? ({ ...prev, name: data.full_name, avatarUrl: data.avatar_url }) : null);
            showNotification("Profile updated successfully.");
        }
    };
    
    // Global Search
    useEffect(() => {
        const performSearch = async () => {
            if (!debouncedSearchQuery || !user) {
                setSearchResults({ campaigns: [], templates: [], contacts: [] });
                return;
            }
            
            const query = `%${debouncedSearchQuery}%`;

            const [campaignsRes, templatesRes, contactsRes] = await Promise.all([
                supabase.from('campaigns').select('*').eq('user_id', user.id).or(`name.ilike.${query},subject.ilike.${query}`).limit(5),
                supabase.from('templates').select('*').eq('user_id', user.id).or(`name.ilike.${query},subject.ilike.${query}`).limit(5),
                supabase.from('contacts').select('*').eq('user_id', user.id).or(`name.ilike.${query},email.ilike.${query},company.ilike.${query}`).limit(5)
            ]);
            
            setSearchResults({
                campaigns: campaignsRes.data || [],
                templates: templatesRes.data || [],
                contacts: contactsRes.data || [],
            });
        };
        performSearch();
    }, [debouncedSearchQuery, user]);

    const handleSelectSearchResult = (item: Campaign | EmailTemplate | Contact, type: 'campaign' | 'template' | 'contact') => {
        if (type === 'campaign') {
            handleEditCampaign(item as Campaign);
        } else if (type === 'template') {
            handleEditTemplate(item as EmailTemplate);
        } else if (type === 'contact') {
            // Future enhancement: show contact details view
            showNotification(`Selected contact: ${item.name}`);
        }
        setIsSearchOpen(false);
        setSearchQuery('');
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return (
                    <DashboardPage 
                        campaigns={campaigns} 
                        contactLists={contactLists} 
                        appActivity={appActivity} 
                        onSaveCampaign={handleSaveCampaign}
                        templates={templates}
                        user={user || undefined}
                        onViewReport={handleViewReport}
                        onEditCampaign={handleEditCampaign}
                        onCreateCampaignClick={handleCreateCampaign}
                        onNavigateToCampaigns={() => setCurrentPage('campaigns-list')}
                        onNavigateToContacts={() => setCurrentPage('contacts')}
                        onNavigateToTemplates={() => setCurrentPage('templates')}
                    />
                );
            case 'contacts':
                return <ContactsPage contactLists={contactLists} onImportList={handleImportList} onDeleteList={handleDeleteList} onRenameList={handleRenameList} user={user!} />;
            case 'campaigns-list':
                return <CampaignsListPage campaigns={campaigns} onEditCampaign={handleEditCampaign} onDeleteCampaign={handleDeleteCampaign} onCreateCampaign={handleCreateCampaign} onViewReport={handleViewReport} highlightedCampaignId={highlightedCampaignId} onClearHighlight={() => setHighlightedCampaignId(null)} />;
            case 'campaign-editor':
                return <CampaignsPage campaign={editingCampaign} onSave={handleSaveCampaign} onClose={handleCloseEditor} contactLists={contactLists} templates={templates} onSaveAsTemplate={handleSaveTemplate} n8nWebhookUrl={n8nWebhookUrl} />;
            case 'templates':
                return <TemplatesListPage templates={templates} onDeleteTemplate={handleDeleteTemplate} onNavigateToEditor={handleEditTemplate} onCreateCampaignFromTemplate={handleCreateCampaignFromTemplate} />;
            case 'template-editor':
                return <TemplateEditorPage template={editingTemplate} onSave={handleSaveTemplate} onClose={handleCloseEditor} />;
            case 'settings':
                return <SettingsPage user={user!} n8nWebhookUrl={n8nWebhookUrl} sendMethod={sendMethod} onSaveSettings={handleSaveSettings} onUpdateProfile={handleUpdateProfile} />;
            case 'campaign-report':
                if (!reportingCampaign) {
                    setCurrentPage('campaigns-list');
                    return null;
                }
                return <CampaignReportPage campaign={reportingCampaign} allContacts={contactLists.flatMap(l => l.contacts)} onClose={handleCloseEditor} />;
            default:
                return <DashboardPage campaigns={campaigns} contactLists={contactLists} appActivity={appActivity} user={user || undefined} />;
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <svg className="animate-spin h-10 w-10 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    if (authEvent === 'PASSWORD_RECOVERY' && session) {
        return <UpdatePasswordPage onSuccess={() => { setAuthEvent(''); showNotification('Password updated successfully. Please sign in.'); }} />;
    }
    
    if (!session || !user) {
        const initialNotification = notification ? notification.message : null;
        return <AuthPage notification={initialNotification} onSetNotification={(msg) => showNotification(msg || '')} onClearNotification={() => setNotification(null)} />;
    }

    return (
        <>
            <Layout
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onLogout={handleLogout}
                user={user}
                onOpenSearch={() => setIsSearchOpen(true)}
            >
                {renderPage()}
            </Layout>
            <GlobalSearch 
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                query={searchQuery}
                onQueryChange={setSearchQuery}
                results={searchResults}
                onSelect={handleSelectSearchResult}
            />
            {notification && (
              <div className={`fixed bottom-5 right-5 text-white py-2.5 px-4 rounded-xl shadow-xl z-50 flex items-center gap-2.5 text-sm font-medium animate-fade-in-up ${notification.type === 'success' ? 'bg-[#0b7b50] shadow-[#0b7b50]/25' : 'bg-red-600'}`}>
                {notification.type === 'success' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                )}
                {notification.message}
              </div>
            )}
        </>
    );
};

export default App;
