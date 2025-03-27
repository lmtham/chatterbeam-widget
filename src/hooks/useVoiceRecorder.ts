
import { useState, useEffect, useRef, useCallback } from 'react';
import { TranscriptResult } from '@/types';

// Add TypeScript declarations for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseVoiceRecorderProps {
  onTranscriptReceived: (transcript: TranscriptResult) => void;
}

const useVoiceRecorder = ({ onTranscriptReceived }: UseVoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioDataRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const recognitionRestartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if the browser supports SpeechRecognition
  const useSpeechRecognition = useCallback(() => {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }, []);
  
  // Function to completely reset all resources
  const resetResources = useCallback(() => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Clear timeout if it exists
    if (recognitionRestartTimeoutRef.current) {
      clearTimeout(recognitionRestartTimeoutRef.current);
      recognitionRestartTimeoutRef.current = null;
    }
    
    // Stop and clear recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error('Error stopping media recorder:', e);
      }
      mediaRecorderRef.current = null;
    }
    
    // Stop and release media stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
        audioDataRef.current = null;
      } catch (e) {
        console.error('Error closing audio context:', e);
      }
    }
  }, []);
  
  // Improved startRecording with better error handling and resource management
  const startRecording = useCallback(async () => {
    try {
      // Reset any lingering error state
      setError(null);
      
      // First, ensure we've cleaned up any existing resources
      resetResources();
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Set up audio analyzer for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      audioDataRef.current = dataArray;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // First try to use browser's SpeechRecognition API
      if (useSpeechRecognition()) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        let finalTranscript = '';
        let interimTranscript = '';
        
        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started');
          finalTranscript = '';
          interimTranscript = '';
        };
        
        recognitionRef.current.onresult = (event: any) => {
          interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript = transcript;
              // Send final transcript
              onTranscriptReceived({
                text: finalTranscript,
                isFinal: true
              });
              finalTranscript = '';
            } else {
              interimTranscript = transcript;
              // Send interim results
              onTranscriptReceived({
                text: interimTranscript,
                isFinal: false
              });
            }
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
          
          // Auto-recover from error after a short delay
          if (isRecording && ["no-speech", "audio-capture", "network"].includes(event.error)) {
            console.log("Attempting to auto-recover from recognition error");
            if (recognitionRestartTimeoutRef.current) {
              clearTimeout(recognitionRestartTimeoutRef.current);
            }
            
            recognitionRestartTimeoutRef.current = setTimeout(() => {
              try {
                if (recognitionRef.current) {
                  recognitionRef.current.abort();
                }
                recognitionRef.current = null;
                startRecording();
              } catch (e) {
                console.error('Error restarting after error:', e);
              }
            }, 1000);
          }
        };
        
        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          
          // If it's still supposed to be recording, restart it
          if (isRecording) {
            try {
              if (recognitionRef.current) {
                recognitionRef.current.start();
                console.log('Recognition restarted after ending');
              } else {
                // If for some reason the recognition instance was destroyed, recreate it
                startRecording();
              }
            } catch (e) {
              console.error('Error restarting speech recognition:', e);
              setError('Failed to restart speech recognition');
              
              // Try again after a delay
              if (recognitionRestartTimeoutRef.current) {
                clearTimeout(recognitionRestartTimeoutRef.current);
              }
              
              recognitionRestartTimeoutRef.current = setTimeout(() => {
                if (isRecording) {
                  startRecording();
                }
              }, 1000);
            }
          }
        };
        
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.error('Error starting speech recognition:', e);
          throw new Error('Failed to start speech recognition');
        }
      } else {
        // Fallback to MediaRecorder if SpeechRecognition is not available
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        const audioChunks: BlobPart[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          // In a real app, you would send this audio to a speech-to-text service
          // For now, just simulate a transcript
          const randomPhrases = [
            "Hello, how can I help you today?",
            "I'd like more information please.",
            "Can you tell me more about this service?",
            "What are the next steps?",
            "Thank you for your assistance."
          ];
          
          const transcription = randomPhrases[Math.floor(Math.random() * randomPhrases.length)];
          
          onTranscriptReceived({
            text: transcription,
            isFinal: true
          });
        };
        
        mediaRecorder.start(1000);
        setIsRecording(true);
      }
      
      // Start visualization
      const updateAudioLevel = () => {
        if (!analyserRef.current || !audioDataRef.current || !isRecording) return;
        
        analyserRef.current.getByteFrequencyData(audioDataRef.current);
        const average = audioDataRef.current.reduce((acc, val) => acc + val, 0) / audioDataRef.current.length;
        const normalized = Math.min(1, average / 128);
        setAudioLevel(normalized);
        
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Microphone access denied or not available');
      setIsRecording(false);
      resetResources(); // Clean up any partially initialized resources
    }
  }, [isRecording, onTranscriptReceived, useSpeechRecognition, resetResources]);
  
  // Improved stopRecording with better resource cleanup
  const stopRecording = useCallback(() => {
    console.log("Stopping voice recording");
    
    // Stop all recording resources
    resetResources();
    
    setIsRecording(false);
    setAudioLevel(0);
  }, [resetResources]);
  
  // Clean up on component unmount
  useEffect(() => {
    return () => {
      resetResources();
    };
  }, [resetResources]);
  
  return {
    isRecording,
    audioLevel,
    error,
    startRecording,
    stopRecording,
  };
};

export default useVoiceRecorder;
