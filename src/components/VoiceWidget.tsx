
import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { WidgetProps } from '@/types';
import useWidgetLogic from '@/hooks/useWidgetLogic';
import WidgetHeader from './widget/WidgetHeader';
import WidgetContent from './widget/WidgetContent';
import WidgetToggleButton from './widget/WidgetToggleButton';

const VoiceWidget: React.FC<WidgetProps> = ({
  webhookUrl,
  apiKey,
  position = 'bottom-right',
  buttonLabel = 'Voice Assistant',
  greetingMessage = 'Hello! How can I assist you today?',
  theme = 'system',
  mode = 'standard',
  initialMessages = [],
  ttsProvider = 'deepgram',
  showAvatar = false
}) => {
  const {
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
  } = useWidgetLogic({
    webhookUrl,
    apiKey,
    mode,
    greetingMessage,
    ttsProvider,
    initialMessages,
    showAvatar
  });
  
  // Set theme
  React.useEffect(() => {
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
          <WidgetHeader
            handleToggleWidget={handleToggleWidget}
            handleMinimize={handleMinimize}
            handleToggleAvatar={handleToggleAvatar}
            showingAvatar={showingAvatar}
          />
          
          <WidgetContent
            isMinimized={isMinimized}
            showingAvatar={showingAvatar}
            messages={messages}
            transcript={transcript}
            isListening={isListening}
            setIsListening={setIsListening}
            handleTranscriptReceived={handleTranscriptReceived}
            currentAIText={currentAIText}
            handleAvatarVideoEnd={handleAvatarVideoEnd}
            isProcessing={isProcessing}
            isSpeaking={isSpeaking}
          />
        </div>
      )}
      
      <WidgetToggleButton
        handleToggleWidget={handleToggleWidget}
        isOpen={isOpen}
        buttonLabel={buttonLabel}
      />
    </div>,
    containerRef.current
  );
};

export default VoiceWidget;
