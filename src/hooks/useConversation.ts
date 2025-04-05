
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, TranscriptResult } from '@/types';
import useN8nWebhook from './useN8nWebhook';
import useTTS from './useTTS';

interface UseConversationProps {
  webhookUrl: string;
  apiKey: string;
  webhookMode: 'standard' | 'popup';
  ttsProvider: 'deepgram' | 'deepseek';
}

const useConversation = ({ 
  webhookUrl, 
  apiKey, 
  webhookMode,
  ttsProvider 
}: UseConversationProps) => {
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);

  const { sendToN8n, isProcessing } = useN8nWebhook({ 
    webhookUrl, 
    apiKey,
    mode: webhookMode
  });
  
  const { generateSpeech, isLoading: isSpeaking } = useTTS({ 
    apiKey, 
    ttsProvider 
  });

  const addWelcomeMessage = useCallback(() => {
    const welcomeMessage: Message = {
      id: uuidv4(),
      text: 'Hello! I am your voice assistant. How may I help you today?',
      sender: 'ai',
      timestamp: Date.now()
    };
    
    setMessages([welcomeMessage]);
    generateSpeech(welcomeMessage.text);
  }, [generateSpeech]);

  const handleTranscriptReceived = async (result: TranscriptResult) => {
    setTranscript(result);
    
    if (result.isFinal && result.text) {
      const userMessage: Message = {
        id: uuidv4(),
        text: result.text,
        sender: 'user',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      const pendingAiMessage: Message = {
        id: uuidv4(),
        text: 'Thinking...',
        sender: 'ai',
        timestamp: Date.now(),
        pending: true
      };
      
      setMessages(prev => [...prev, pendingAiMessage]);
      
      try {
        const response = await sendToN8n(result.text, messages);
        
        if (response) {
          setMessages(prev => prev.map(msg => 
            msg.id === pendingAiMessage.id
              ? { ...msg, text: response, pending: false }
              : msg
          ));
          
          generateSpeech(response);
        } else {
          throw new Error('No response from n8n');
        }
      } catch (error) {
        console.error('Error processing with n8n:', error);
        
        setMessages(prev => prev.map(msg => 
          msg.id === pendingAiMessage.id
            ? { ...msg, text: "I'm sorry, I couldn't process that request. Please try again.", pending: false }
            : msg
        ));
      }
    }
  };

  return {
    transcript,
    messages,
    isListening,
    setIsListening,
    isProcessing,
    isSpeaking,
    handleTranscriptReceived,
    addWelcomeMessage
  };
};

export default useConversation;
