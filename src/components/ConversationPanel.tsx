
import React from 'react';
import { Message, TranscriptResult } from '@/types';
import ChatBox from '@/components/ChatBox';
import TranscriptDisplay from '@/components/TranscriptDisplay';
import AudioVisualizer from '@/components/AudioVisualizer';
import VoiceRecorder from '@/components/VoiceRecorder';

interface ConversationPanelProps {
  messages: Message[];
  transcript: TranscriptResult | null;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
  onTranscriptReceived: (result: TranscriptResult) => void;
}

const ConversationPanel: React.FC<ConversationPanelProps> = ({
  messages,
  transcript,
  isListening,
  setIsListening,
  onTranscriptReceived
}) => {
  return (
    <div className="glass-panel h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-semibold">Conversation</h2>
      </div>
      
      <ChatBox 
        messages={messages} 
        className="flex-1"
      />
      
      <div className="p-4 relative border-t border-border">
        <TranscriptDisplay 
          transcript={transcript} 
          className="mb-4"
        />
        
        <div className="flex items-center justify-center">
          <AudioVisualizer isRecording={isListening} />
        </div>
        
        <div className="flex justify-center mt-4">
          <VoiceRecorder
            onTranscriptReceived={onTranscriptReceived}
            isListening={isListening}
            setIsListening={setIsListening}
          />
        </div>
        
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {isListening ? (
            <p>Listening... Click again to stop</p>
          ) : (
            <p>Click the microphone to start speaking</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationPanel;
