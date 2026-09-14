import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { SendMethod, User } from '../../types';
import { DEFAULT_N8N_WEBHOOK_URL } from '../../constants';
import { testWebhookConnection } from '../../services/n8nService';

interface SettingsPageProps {
  user: User;
  n8nWebhookUrl: string;
  sendMethod: SendMethod;
  onSaveSettings: (url: string, method: SendMethod) => void;
  onUpdateProfile: (updates: { name: string; avatarFile?: File }) => Promise<void>;
}

const DeviceFloppyIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338A2.25 2.25 0 0017.088 3.75H15M12 13.5h.008v.008H12v-.008z" /></svg>;
const ArrowUpOnSquareIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>;
const BoltIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>;

const SettingsPage: React.FC<SettingsPageProps> = ({ user, n8nWebhookUrl, sendMethod, onSaveSettings, onUpdateProfile }) => {
  // State for campaign settings
  const [url, setUrl] = useState(n8nWebhookUrl || DEFAULT_N8N_WEBHOOK_URL);
  const [method, setMethod] = useState<SendMethod>(sendMethod || 'n8n');
  const [isSaved, setIsSaved] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // State for profile settings
  const [name, setName] = useState(user.name);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  useEffect(() => {
    setName(user.name);
    setAvatarFile(null);
    setAvatarPreview(null);
  }, [user]);

  useEffect(() => {
    setUrl(n8nWebhookUrl || DEFAULT_N8N_WEBHOOK_URL);
  }, [n8nWebhookUrl]);

  useEffect(() => {
    setMethod(sendMethod || 'n8n');
  }, [sendMethod]);

  const handleCampaignSettingsSave = () => {
    const targetUrl = url.trim() || DEFAULT_N8N_WEBHOOK_URL;
    onSaveSettings(targetUrl, method);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setTestResult(null);
    const targetUrl = url.trim() || DEFAULT_N8N_WEBHOOK_URL;
    const result = await testWebhookConnection(targetUrl);
    setTestResult(result);
    setIsTestingWebhook(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert("Image file is too large. Maximum size is 2MB.");
            return;
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    } else {
        alert("Please select a valid image file.");
    }
  };

  const handleProfileSave = async () => {
    if (!name.trim()) {
        alert("Name cannot be empty.");
        return;
    }
    setIsSavingProfile(true);
    await onUpdateProfile({ name, avatarFile: avatarFile || undefined });
    setIsSavingProfile(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
      
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Settings</h2>
        <div className="space-y-6 max-w-xl">
            <div className="flex items-center gap-6">
                <img 
                    src={avatarPreview || user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`} 
                    alt="User Avatar" 
                    className="h-20 w-20 rounded-full object-cover" 
                />
                <div className="relative">
                    <Button as="span" variant="secondary">
                        <ArrowUpOnSquareIcon className="h-5 w-5 mr-2" />
                        Upload Image
                    </Button>
                    <input 
                        type="file"
                        accept="image/png, image/jpeg, image/gif"
                        onChange={handleAvatarChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        aria-label="Upload new avatar"
                    />
                </div>
            </div>
            <Input
                label="Full Name"
                id="full-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
            />
             <Input
                label="Email Address"
                id="email-address"
                type="email"
                value={user.email}
                disabled
                className="!bg-gray-100 dark:!bg-gray-700/50"
            />
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={handleProfileSave} isLoading={isSavingProfile}>
                    <DeviceFloppyIcon className="h-5 w-5 mr-2" />
                    Save Profile
                </Button>
                {isProfileSaved && <p className="text-sm text-green-600 dark:text-green-400 animate-fade-in">Profile saved!</p>}
            </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Campaign Sending</h2>
        <div className="space-y-6 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Send Method</label>
              <div className="flex gap-4 rounded-lg p-1 bg-gray-200 dark:bg-gray-700/50">
                  <button 
                      onClick={() => setMethod('n8n')}
                      className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${method === 'n8n' ? 'bg-white dark:bg-gray-800 shadow text-brand-600 dark:text-brand-300' : 'text-gray-600 dark:text-gray-400'}`}
                  >
                      n8n Webhook
                  </button>
                  <button
                      onClick={() => setMethod('simulate')}
                      className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${method === 'simulate' ? 'bg-white dark:bg-gray-800 shadow text-brand-600 dark:text-brand-300' : 'text-gray-600 dark:text-gray-400'}`}
                  >
                      Simulated Send
                  </button>
              </div>
            </div>

            {method === 'n8n' && (
              <div className="space-y-3 animate-fade-in">
                  <Input
                      label="n8n Webhook URL"
                      id="n8n-webhook-url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://nexflow-hub.app.n8n.cloud/webhook-test/..."
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Connected to n8n webhook workflow for batch sending campaigns.
                    </p>
                    <button
                      type="button"
                      onClick={() => setUrl(DEFAULT_N8N_WEBHOOK_URL)}
                      className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium underline"
                    >
                      Reset to Default URL
                    </button>
                  </div>

                  {url.includes('/webhook-test/') && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                      <p className="font-semibold flex items-center gap-1.5">
                        <span>⚠️ You are using an n8n Test Webhook URL (<code className="px-1 py-0.5 rounded bg-amber-200/50 dark:bg-amber-950/50 text-[11px]">/webhook-test/</code>)</span>
                      </p>
                      <p>
                        In n8n, <strong>Test Webhooks only respond while you have the workflow open in n8n and click &quot;Listen for test event&quot;</strong>. If n8n is not actively listening, it returns <code>404 / Connection Refused</code>.
                      </p>
                      <p>
                        <strong>To send anytime without listening manually:</strong> Activate your workflow in n8n and replace <code className="font-mono">/webhook-test/</code> with <code className="font-mono font-semibold">/webhook/</code> in the URL above.
                      </p>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button 
                      type="button"
                      variant="secondary" 
                      size="sm" 
                      onClick={handleTestWebhook} 
                      isLoading={isTestingWebhook}
                    >
                      <BoltIcon className="h-4 w-4 mr-1.5 text-amber-500" />
                      Test Webhook Connection
                    </Button>
                  </div>

                  {testResult && (
                    <div className={`p-3 rounded-md text-sm ${testResult.success ? 'bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300'}`}>
                      {testResult.message}
                    </div>
                  )}
              </div>
            )}
            {method === 'simulate' && (
              <div className="p-4 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 text-sm animate-fade-in">
                <strong>Simulated Send is active.</strong> Campaigns will be marked as "sent" and generate activity logs, but no actual emails will be dispatched. This is ideal for testing.
              </div>
            )}
            
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={handleCampaignSettingsSave}>
                    <DeviceFloppyIcon className="h-5 w-5 mr-2" />
                    Save Settings
                </Button>
                {isSaved && <p className="text-sm text-green-600 dark:text-green-400 animate-fade-in">Settings saved!</p>}
            </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;