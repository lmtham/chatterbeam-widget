
import React, { useEffect } from 'react';
import { Settings } from 'lucide-react';

import ConfigurationForm from '@/components/ConfigurationForm';
import ConversationPanel from '@/components/ConversationPanel';
import FeaturesPanel from '@/components/FeaturesPanel';
import useWebhookConfig from '@/hooks/useWebhookConfig';
import useConversation from '@/hooks/useConversation';

const Index = () => {
  const {
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
  } = useWebhookConfig();
  
  const {
    transcript,
    messages,
    isListening,
    setIsListening,
    handleTranscriptReceived,
    addWelcomeMessage
  } = useConversation({
    webhookUrl,
    apiKey,
    webhookMode,
    ttsProvider
  });
  
  const handleConfigureSave = (e: React.FormEvent) => {
    const config = saveWebhookConfig(e);
    if (config) {
      addWelcomeMessage();
    }
  };
  
  if (isConfiguring) {
    return (
      <ConfigurationForm
        webhookUrl={webhookUrl}
        apiKey={apiKey}
        webhookMode={webhookMode}
        ttsProvider={ttsProvider}
        setWebhookUrl={setWebhookUrl}
        setApiKey={setApiKey}
        setWebhookMode={setWebhookMode}
        setTtsProvider={setTtsProvider}
        onSave={handleConfigureSave}
      />
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <header className="p-4 border-b border-border backdrop-blur-sm bg-background/50 sticky top-0 z-10">
        <div className="container flex items-center justify-between">
          <h1 className="text-2xl font-bold">Voice AI Assistant</h1>
          <button
            onClick={() => setIsConfiguring(true)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>
      
      <main className="flex-1 container py-8 px-4">
        <div className="grid md:grid-cols-12 gap-8 max-w-6xl mx-auto">
          <div className="md:col-span-7">
            <ConversationPanel
              messages={messages}
              transcript={transcript}
              isListening={isListening}
              setIsListening={setIsListening}
              onTranscriptReceived={handleTranscriptReceived}
            />
          </div>
          
          <div className="md:col-span-5">
            <FeaturesPanel webhookUrl={webhookUrl} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
