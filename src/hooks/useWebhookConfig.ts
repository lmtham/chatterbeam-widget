
import { useState, useEffect } from 'react';
import { N8nWebhookConfig } from '@/types';
import { toast } from 'sonner';

const useWebhookConfig = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [webhookMode, setWebhookMode] = useState<'standard' | 'popup'>('standard');
  const [ttsProvider, setTtsProvider] = useState<'deepgram' | 'deepseek'>('deepgram');
  const [isConfiguring, setIsConfiguring] = useState(false);

  useEffect(() => {
    const savedWebhookConfig = localStorage.getItem('n8nWebhookConfig');
    if (savedWebhookConfig) {
      try {
        const config: N8nWebhookConfig = JSON.parse(savedWebhookConfig);
        setWebhookUrl(config.webhookUrl || '');
        setApiKey(config.apiKey || '');
        setWebhookMode(config.mode || 'standard');
        setTtsProvider(config.ttsProvider || 'deepgram');
      } catch (error) {
        console.error('Error parsing saved webhook config:', error);
        setIsConfiguring(true);
      }
    } else {
      setIsConfiguring(true);
    }
  }, []);

  const saveWebhookConfig = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookUrl.trim()) {
      toast.error('Please enter a valid webhook URL');
      return;
    }
    
    const webhookConfig: N8nWebhookConfig = {
      webhookUrl,
      apiKey,
      mode: webhookMode,
      ttsProvider
    };
    
    localStorage.setItem('n8nWebhookConfig', JSON.stringify(webhookConfig));
    setIsConfiguring(false);
    toast.success('Webhook configuration saved successfully');
    
    return webhookConfig;
  };

  return {
    webhookUrl,
    setWebhookUrl,
    apiKey,
    setApiKey,
    webhookMode,
    setWebhookMode,
    ttsProvider,
    setTtsProvider,
    isConfiguring,
    setIsConfiguring,
    saveWebhookConfig
  };
};

export default useWebhookConfig;
