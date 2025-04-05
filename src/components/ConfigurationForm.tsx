
import React from 'react';
import { Info } from 'lucide-react';
import { N8nWebhookConfig } from '@/types';
import { toast } from 'sonner';

interface ConfigurationFormProps {
  webhookUrl: string;
  apiKey: string;
  webhookMode: 'standard' | 'popup';
  ttsProvider: 'deepgram' | 'deepseek';
  setWebhookUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setWebhookMode: (mode: 'standard' | 'popup') => void;
  setTtsProvider: (provider: 'deepgram' | 'deepseek') => void;
  onSave: (e: React.FormEvent) => void;
}

const ConfigurationForm: React.FC<ConfigurationFormProps> = ({
  webhookUrl,
  apiKey,
  webhookMode,
  ttsProvider,
  setWebhookUrl,
  setApiKey,
  setWebhookMode,
  setTtsProvider,
  onSave
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
      <div className="glass-panel w-full max-w-md p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Voice AI Setup</h1>
          <p className="text-muted-foreground">Configure your n8n webhook to get started</p>
        </div>
        
        <form onSubmit={onSave}>
          <div className="mb-4">
            <label htmlFor="webhookUrl" className="block text-sm font-medium mb-1">
              n8n Webhook URL
            </label>
            <input
              id="webhookUrl"
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full p-2 rounded-md border border-input bg-background"
              placeholder="https://your-n8n-instance.com/webhook/..."
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Enter the webhook URL from your n8n workflow
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="apiKey" className="block text-sm font-medium mb-1">
              API Key (Optional)
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 rounded-md border border-input bg-background"
              placeholder="Your API key for authentication"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              If your n8n webhook requires authentication
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="webhookMode" className="block text-sm font-medium mb-1">
              Webhook Mode
            </label>
            <select
              id="webhookMode"
              value={webhookMode}
              onChange={(e) => setWebhookMode(e.target.value as 'standard' | 'popup')}
              className="w-full p-2 rounded-md border border-input bg-background"
            >
              <option value="standard">Standard</option>
              <option value="popup">Popup</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose how the webhook should be displayed
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="ttsProvider" className="block text-sm font-medium mb-1">
              TTS Provider
            </label>
            <select
              id="ttsProvider"
              value={ttsProvider}
              onChange={(e) => setTtsProvider(e.target.value as 'deepgram' | 'deepseek')}
              className="w-full p-2 rounded-md border border-input bg-background"
            >
              <option value="deepgram">Deepgram</option>
              <option value="deepseek">Deepseek</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose the TTS provider
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Save and Continue
            </button>
          </div>
        </form>
        
        <div className="mt-8 p-4 bg-secondary rounded-md">
          <div className="flex items-start gap-2">
            <Info size={18} className="text-primary mt-0.5" />
            <div>
              <h3 className="text-sm font-medium">How to set up n8n</h3>
              <p className="text-xs text-muted-foreground mt-1">
                1. Create a new workflow in n8n<br />
                2. Add a Webhook node as a trigger<br />
                3. Configure the node to accept POST requests<br />
                4. Copy the webhook URL and paste it here<br />
                5. Set up your workflow to process voice inputs and return responses
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationForm;
