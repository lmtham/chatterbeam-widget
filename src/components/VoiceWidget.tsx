
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mic, X, MinusCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { WidgetProps, Message, TranscriptResult } from '@/types';
import VoiceRecorder from './VoiceRecorder';
import ChatBox from './ChatBox';
import TranscriptDisplay from './TranscriptDisplay';
import useN8nWebhook from '@/hooks/useN8nWebhook';
import useTTS from '@/hooks/useTTS';
import { cn } from '@/lib/utils';

const VoiceWidget: React.FC<WidgetProps> = ({
  webhookUrl,
  apiKey,
  position = 'bottom-right',
  buttonLabel = 'Voice Assistant',
  greetingMessage = 'Hello! How can I assist you today?',
  theme = 'system',
  mode = 'standard',
  initialMessages = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const { sendToN8n, isProcessing } = useN8nWebhook({ webhookUrl, apiKey, mode });
  const { generateSpeech, stopSpeech, isLoading: isSpeaking } = useTTS({ apiKey });
  
  // Set theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);
  
  // Add greeting message when widget is first opened
  useEffect(() => {
    if (isOpen && messages.length === 0 && greetingMessage) {
      const message: Message = {
        id: uuidv4(),
        text: greetingMessage,
        sender: 'ai',
        timestamp: Date.now()
      };
      
      setMessages([message]);
      generateSpeech(greetingMessage);
    }
  }, [isOpen, messages.length, greetingMessage, generateSpeech]);
  
  // Create container element for portal rendering
  useEffect(() => {
    const container = document.createElement('div');
    container.id = 'voice-widget-container';
    document.body.appendChild(container);
    containerRef.current = container;
    
    return () => {
      if (container && document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };
  }, []);
  
  const handleToggleWidget = () => {
    if (isOpen) {
      // Stop any ongoing operations when closing
      if (isListening) setIsListening(false);
      if (isSpeaking) stopSpeech();
      setTimeout(() => setIsOpen(false), 300);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };
  
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  const handleTranscriptReceived = async (result: TranscriptResult) => {
    setTranscript(result);
    
    if (result.isFinal && result.text.trim()) {
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
      
      // Process with n8n webhook
      const response = await sendToN8n(result.text, messages);
      
      // Update with actual AI response
      if (response) {
        setMessages(prev => prev.map(msg => 
          msg.id === pendingAiMessage.id
          ? { ...msg, text: response, pending: false }
          : msg
        ));
        
        // Generate speech for AI response
        generateSpeech(response);
      } else {
        // Handle error
        setMessages(prev => prev.map(msg => 
          msg.id === pendingAiMessage.id
          ? { ...msg, text: "Sorry, I couldn't process that request.", pending: false }
          : msg
        ));
      }
    }
  };
  
  // Position classes based on the position prop
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };
  
  if (!containerRef.current) return null;
  
  return createPortal(
    <div className={cn("widget-container", positionClasses[position])}>
      {isOpen && (
        <div 
          className={cn(
            "widget-panel glass-panel animate-scale-in",
            isMinimized && "h-14"
          )}
        >
          {/* Widget Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-medium">Voice Assistant</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleMinimize}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={isMinimized ? "Expand" : "Minimize"}
              >
                <MinusCircle size={18} />
              </button>
              <button 
                onClick={handleToggleWidget}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          {/* Widget Content (hidden when minimized) */}
          {!isMinimized && (
            <>
              <ChatBox 
                messages={messages} 
                className="h-80"
              />
              
              <div className="p-4 border-t border-border">
                <div className="relative mb-4">
                  <TranscriptDisplay 
                    transcript={transcript} 
                    className="w-full"
                  />
                </div>
                
                <VoiceRecorder
                  onTranscriptReceived={handleTranscriptReceived}
                  isListening={isListening}
                  setIsListening={setIsListening}
                />
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Widget Toggle Button */}
      <button
        onClick={handleToggleWidget}
        className={cn(
          "widget-button animate-breathe",
          isOpen && "scale-90 opacity-0 pointer-events-none",
          !isOpen && "scale-100 opacity-100"
        )}
        aria-label={buttonLabel}
        title={buttonLabel}
      >
        <Mic size={24} />
      </button>
    </div>,
    containerRef.current
  );
};

export default VoiceWidget;
