
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Message } from '@/types';

interface UseN8nWebhookProps {
  webhookUrl: string;
  apiKey?: string;
}

const useN8nWebhook = ({ webhookUrl, apiKey }: UseN8nWebhookProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const sendToN8n = useCallback(async (
    transcript: string, 
    conversationHistory: Message[]
  ) => {
    if (!webhookUrl) {
      toast.error('No n8n webhook URL configured');
      return null;
    }
    
    setIsProcessing(true);
    
    try {
      // Format conversation history for the webhook
      const formattedHistory = conversationHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      
      // Add the current message
      formattedHistory.push({
        role: 'user',
        content: transcript
      });
      
      const payload = {
        transcript,
        conversationHistory: formattedHistory,
        timestamp: new Date().toISOString()
      };
      
      // Add API key to headers if provided
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      // Send to n8n webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Error from n8n: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      return responseData.response || responseData;
    } catch (error) {
      console.error('Error sending to n8n:', error);
      toast.error('Failed to process with n8n');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [webhookUrl, apiKey]);
  
  return {
    sendToN8n,
    isProcessing
  };
};

export default useN8nWebhook;
