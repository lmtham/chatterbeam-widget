
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Mic, Settings, Info, ArrowLeft, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Message, TranscriptResult, N8nWebhookConfig } from '@/types';
import VoiceRecorder from '@/components/VoiceRecorder';
import ChatBox from '@/components/ChatBox';
import TranscriptDisplay from '@/components/TranscriptDisplay';
import AudioVisualizer from '@/components/AudioVisualizer';
import Avatar from '@/components/Avatar';
import AvatarConfigPanel from '@/components/AvatarConfig';
import useN8nWebhook from '@/hooks/useN8nWebhook';
import useTTS from '@/hooks/useTTS';
import { toast } from 'sonner';
import avatarService from '@/services/AvatarService';

const AvatarAssistant = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [webhookMode, setWebhookMode] = useState<'standard' | 'popup'>('standard');
  const [ttsProvider, setTtsProvider] = useState<'deepgram' | 'deepseek'>('deepgram');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAIText, setCurrentAIText] = useState<string>('');
  
  const { sendToN8n, isProcessing } = useN8nWebhook({ 
    webhookUrl, 
    apiKey,
    mode: webhookMode
  });
  const { generateSpeech, stopSpeech, isLoading: isSpeaking } = useTTS({ 
    apiKey, 
    ttsProvider 
  });
  
  useEffect(() => {
    // Check if webhook config is already saved in localStorage
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
      // If no webhook URL is saved, show the configuration
      setIsConfiguring(true);
    }
    
    // Add welcome message after a slight delay
    const timer = setTimeout(() => {
      if (messages.length === 0) {
        const welcomeMessage: Message = {
          id: uuidv4(),
          text: 'Hello! I am your interactive avatar assistant. How may I help you today?',
          sender: 'ai',
          timestamp: Date.now()
        };
        
        setMessages([welcomeMessage]);
        setCurrentAIText(welcomeMessage.text);
        generateSpeech(welcomeMessage.text);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleConfigureSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookUrl.trim()) {
      toast.error('Please enter a valid webhook URL');
      return;
    }
    
    // Save to localStorage
    const webhookConfig: N8nWebhookConfig = {
      webhookUrl,
      apiKey,
      mode: webhookMode,
      ttsProvider,
      showAvatar: true
    };
    
    localStorage.setItem('n8nWebhookConfig', JSON.stringify(webhookConfig));
    setIsConfiguring(false);
    toast.success('Webhook configuration saved successfully');
  };
  
  const handleTranscriptReceived = async (result: TranscriptResult) => {
    setTranscript(result);
    
    // If user starts speaking while AI is speaking, immediately interrupt the AI
    if (isSpeaking && result.text.trim()) {
      console.log("User interrupting AI speech");
      stopSpeech(); // Immediately stop AI speech to let user speak
      setCurrentAIText(''); // Reset current AI text to stop avatar animation
    }
    
    if (result.isFinal && result.text.trim()) {
      // Stop any ongoing speech
      stopSpeech();
      setCurrentAIText(''); 
      
      // Add user message
      const userMessage: Message = {
        id: uuidv4(),
        text: result.text,
        sender: 'user',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Add pending AI message
      const pendingAiMessage: Message = {
        id: uuidv4(),
        text: 'Thinking...',
        sender: 'ai',
        timestamp: Date.now(),
        pending: true
      };
      
      setMessages(prev => [...prev, pendingAiMessage]);
      
      try {
        // Process with n8n webhook
        const response = await sendToN8n(result.text, messages);
        
        if (response) {
          // Update with actual AI response
          setMessages(prev => prev.map(msg => 
            msg.id === pendingAiMessage.id
              ? { ...msg, text: response, pending: false }
              : msg
          ));
          
          // Set current AI text for avatar and generate speech
          setCurrentAIText(response);
          generateSpeech(response);
        } else {
          throw new Error('No response from n8n');
        }
      } catch (error) {
        console.error('Error processing with n8n:', error);
        
        // Update with error message
        const errorMsg = "I'm sorry, I couldn't process that request. Please try again.";
        setMessages(prev => prev.map(msg => 
          msg.id === pendingAiMessage.id
            ? { ...msg, text: errorMsg, pending: false }
            : msg
        ));
        
        setCurrentAIText(errorMsg);
        generateSpeech(errorMsg);
      }
    }
  };
  
  // Handle avatar video end event
  const handleAvatarVideoEnd = () => {
    setCurrentAIText('');
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <header className="p-4 border-b border-border backdrop-blur-sm bg-background/50 sticky top-0 z-10">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold">Interactive Avatar Assistant</h1>
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-medium">Beta</span>
          </div>
          <button
            onClick={() => setIsConfiguring(true)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>
      
      {isConfiguring ? (
        <div className="container py-8 px-4">
          <div className="max-w-lg mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Configure Voice Assistant</h2>
              
              <form onSubmit={handleConfigureSave} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="webhookUrl" className="block text-sm font-medium">
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
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="apiKey" className="block text-sm font-medium">
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
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="webhookMode" className="block text-sm font-medium">
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
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="ttsProvider" className="block text-sm font-medium">
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
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Save Webhook Settings
                  </button>
                </div>
              </form>
            </div>
            
            <AvatarConfigPanel onConfigSaved={() => {}} />
          </div>
        </div>
      ) : (
        <main className="flex-1 container py-8 px-4">
          <div className="grid md:grid-cols-12 gap-8 max-w-6xl mx-auto">
            <div className="md:col-span-6 lg:col-span-7">
              <div className="glass-panel h-full overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border">
                  <h2 className="text-xl font-semibold">Interactive Avatar</h2>
                </div>
                
                <div className="p-4">
                  <Avatar 
                    text={currentAIText} 
                    isActive={Boolean(currentAIText)} 
                    onVideoEnd={handleAvatarVideoEnd}
                    className="w-full"
                  />
                </div>
                
                <div className="p-4 relative border-t border-border mt-auto">
                  <TranscriptDisplay 
                    transcript={transcript} 
                    className="mb-4"
                  />
                  
                  <div className="flex items-center justify-center">
                    <AudioVisualizer isRecording={isListening} />
                  </div>
                  
                  <div className="flex justify-center mt-4">
                    <VoiceRecorder
                      onTranscriptReceived={handleTranscriptReceived}
                      isListening={isListening}
                      setIsListening={setIsListening}
                    />
                  </div>
                  
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    {isProcessing && "Processing..."}
                    {isSpeaking && "Speaking... (speak to interrupt)"}
                    {!isProcessing && !isSpeaking && isListening && "Listening..."}
                    {!isProcessing && !isSpeaking && !isListening && "Click the microphone to speak"}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-6 lg:col-span-5">
              <div className="glass-panel h-full overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border">
                  <h2 className="text-xl font-semibold">Conversation</h2>
                </div>
                
                <ChatBox 
                  messages={messages} 
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default AvatarAssistant;
