
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Message, N8nWebhookConfig } from '@/types';

interface UseN8nWebhookProps {
  webhookUrl: string;
  apiKey?: string;
  mode?: 'standard' | 'popup';
}

const useN8nWebhook = ({ webhookUrl, apiKey, mode = 'standard' }: UseN8nWebhookProps) => {
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
      
      // Create a payload that matches the expected format for n8n
      const payload = {
        transcript,
        conversationHistory: formattedHistory,
        timestamp: new Date().toISOString(),
        webhookConfig: {
          mode,
          apiKey
        }
      };
      
      // Add API key to headers if provided
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      console.log('Sending to n8n webhook:', webhookUrl);
      console.log('Payload:', JSON.stringify(payload));
      
      // Send to n8n webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        console.error('Error response from n8n:', response.status, response.statusText);
        throw new Error(`Error from n8n: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('Response from n8n:', responseData);
      
      return responseData.response || responseData;
    } catch (error) {
      console.error('Error sending to n8n:', error);
      toast.error('Failed to process with n8n. Check console for details.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [webhookUrl, apiKey, mode]);
  
  return {
    sendToN8n,
    isProcessing
  };
};

export default useN8nWebhook;
