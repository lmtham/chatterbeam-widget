
import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, TranscriptResult } from '@/types';
import useN8nWebhook from './useN8nWebhook';
import useTTS from './useTTS';

interface UseWidgetLogicProps {
  webhookUrl: string;
  apiKey?: string;
  mode: 'standard' | 'popup';
  greetingMessage?: string;
  ttsProvider: 'deepgram' | 'deepseek';
  initialMessages?: Message[];
  showAvatar: boolean;
}

const useWidgetLogic = ({
  webhookUrl,
  apiKey,
  mode,
  greetingMessage,
  ttsProvider,
  initialMessages = [],
  showAvatar
}: UseWidgetLogicProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showingAvatar, setShowingAvatar] = useState(showAvatar);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [currentAIText, setCurrentAIText] = useState<string>('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const isUserInterruptingRef = useRef<boolean>(false);
  const lastUserSpeakTimeRef = useRef<number>(0);
  
  const { sendToN8n, isProcessing } = useN8nWebhook({ webhookUrl, apiKey, mode });
  const { generateSpeech, stopSpeech, isLoading: isSpeaking } = useTTS({ apiKey, ttsProvider });
  
  // Update the ref when processing status changes
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);
  
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
      setCurrentAIText(greetingMessage);
      
      // Only generate speech if it's not already speaking
      if (!isSpeaking) {
        generateSpeech(greetingMessage);
      }
    }
  }, [isOpen, messages.length, greetingMessage, generateSpeech, isSpeaking]);
  
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

  const handleToggleAvatar = () => {
    setShowingAvatar(!showingAvatar);
  };
  
  const handleTranscriptReceived = async (result: TranscriptResult) => {
    // Update last time user spoke for debouncing purposes
    lastUserSpeakTimeRef.current = Date.now();
    
    setTranscript(result);
    
    // If user starts speaking while AI is speaking, immediately interrupt the AI
    if (isSpeaking && result.text.trim()) {
      console.log("User interrupting AI speech");
      stopSpeech(); // Immediately stop AI speech to let user speak
      isUserInterruptingRef.current = true;
      setCurrentAIText(''); // Reset current AI text to stop avatar
      
      // Add a small delay before resetting the interruption state
      setTimeout(() => {
        isUserInterruptingRef.current = false;
      }, 300);
    }
    
    if (result.isFinal && result.text.trim()) {
      // We'll process the message regardless of previous processing state when the user interrupts
      const shouldProcessMessage = !isProcessingRef.current || isUserInterruptingRef.current;
      
      if (!shouldProcessMessage) {
        console.log("Still processing previous message, ignoring new message");
        return;
      }
      
      // Stop any ongoing speech immediately
      stopSpeech();
      setCurrentAIText(''); // Reset current AI text to stop avatar
      
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
        
        // Update with actual AI response if we got one
        if (response) {
          setMessages(prev => prev.map(msg => 
            msg.id === pendingAiMessage.id
            ? { ...msg, text: response, pending: false }
            : msg
          ));
          
          // Set current AI text for avatar
          setCurrentAIText(response);
          
          // Only generate speech if user hasn't interrupted in the meantime
          const timeSinceLastUserSpeak = Date.now() - lastUserSpeakTimeRef.current;
          if (timeSinceLastUserSpeak > 500 && !isUserInterruptingRef.current) {
            generateSpeech(response);
          } else {
            console.log("User spoke recently, not generating speech");
          }
        } else {
          throw new Error('No response from n8n');
        }
      } catch (error) {
        console.error('Error processing with n8n:', error);
        
        // Update with error message
        setMessages(prev => prev.map(msg => 
          msg.id === pendingAiMessage.id
          ? { ...msg, text: "Sorry, I couldn't process that request.", pending: false }
          : msg
        ));
        
        setCurrentAIText("Sorry, I couldn't process that request.");
      }
    }
  };
  
  // Handle avatar video end event
  const handleAvatarVideoEnd = () => {
    setCurrentAIText('');
  };

  return {
    isOpen,
    isListening,
    isMinimized,
    showingAvatar,
    messages,
    transcript,
    currentAIText,
    isProcessing,
    isSpeaking,
    containerRef,
    handleToggleWidget,
    handleMinimize,
    handleToggleAvatar,
    handleTranscriptReceived,
    handleAvatarVideoEnd,
    setIsListening
  };
};

export default useWidgetLogic;
