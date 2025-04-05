
import { TranscriptResult } from '@/types';
import { SpeechRecognitionInstance, SpeechRecognitionOptions } from '@/types/speechRecognition';

export const createSpeechRecognition = (): SpeechRecognitionInstance | null => {
  if ('SpeechRecognition' in window) {
    return new (window as any).SpeechRecognition();
  } else if ('webkitSpeechRecognition' in window) {
    return new (window as any).webkitSpeechRecognition();
  }
  
  return null;
};

export const isSpeechRecognitionSupported = (): boolean => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

export const setupSpeechRecognition = (
  recognition: SpeechRecognitionInstance | null,
  onTranscript: (transcript: TranscriptResult) => void,
  onError: (error: string) => void
): void => {
  if (!recognition) return;

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  
  let finalTranscript = '';
  let interimTranscript = '';
  
  recognition.onstart = () => {
    console.log('Speech recognition started');
    finalTranscript = '';
    interimTranscript = '';
  };
  
  recognition.onresult = (event: any) => {
    interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript = transcript;
        // Send final transcript
        onTranscript({
          text: finalTranscript,
          isFinal: true
        });
      } else {
        interimTranscript = transcript;
        // Send interim results
        onTranscript({
          text: interimTranscript,
          isFinal: false
        });
      }
    }
  };
  
  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    onError(`Speech recognition error: ${event.error}`);
  };
};
