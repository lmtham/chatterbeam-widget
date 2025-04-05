
import React from 'react';
import { Message, TranscriptResult } from '@/types';
import ChatBox from '@/components/ChatBox';
import TranscriptDisplay from '@/components/TranscriptDisplay';
import VoiceRecorder from '@/components/VoiceRecorder';
import Avatar from '@/components/Avatar';

interface WidgetContentProps {
  isMinimized: boolean;
  showingAvatar: boolean;
  messages: Message[];
  transcript: TranscriptResult | null;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
  handleTranscriptReceived: (result: TranscriptResult) => void;
  currentAIText: string;
  handleAvatarVideoEnd: () => void;
  isProcessing: boolean;
  isSpeaking: boolean;
}

const WidgetContent: React.FC<WidgetContentProps> = ({
  isMinimized,
  showingAvatar,
  messages,
  transcript,
  isListening,
  setIsListening,
  handleTranscriptReceived,
  currentAIText,
  handleAvatarVideoEnd,
  isProcessing,
  isSpeaking
}) => {
  if (isMinimized) {
    return null;
  }

  return (
    <>
      {/* Avatar section - only show if enabled */}
      {showingAvatar && (
        <div className="p-4 border-b border-border">
          <Avatar 
            text={currentAIText} 
            isActive={Boolean(currentAIText)} 
            onVideoEnd={handleAvatarVideoEnd}
          />
        </div>
      )}
    
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
        
        {/* Status indicator */}
        <div className="mt-2 text-center text-xs text-muted-foreground">
          {isProcessing && "Processing..."}
          {isSpeaking && "Speaking... (speak to interrupt)"}
          {!isProcessing && !isSpeaking && isListening && "Listening..."}
          {!isProcessing && !isSpeaking && !isListening && "Click the microphone to speak"}
        </div>
      </div>
    </>
  );
};

export default WidgetContent;
