
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
  
  // Check if the browser supports SpeechRecognition
  const useSpeechRecognition = useCallback(() => {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }, []);
  
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Set up audio analyzer for visualization
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        audioDataRef.current = dataArray;
      }
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // First try to use browser's SpeechRecognition API
      if (useSpeechRecognition()) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        // If we already have a recognition instance, stop it
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
            recognitionRef.current = null;
          } catch (e) {
            console.error('Error stopping existing speech recognition:', e);
          }
        }
        
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
        };
        
        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          // Don't auto-restart as it can cause issues
          // If it's still supposed to be recording, manually restart
          if (isRecording) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Error restarting speech recognition:', e);
              setError('Failed to restart speech recognition');
            }
          }
        };
        
        recognitionRef.current.start();
        setIsRecording(true);
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
    }
  }, [isRecording, onTranscriptReceived, useSpeechRecognition]);
  
  const stopRecording = useCallback(() => {
    // Stop SpeechRecognition if it's being used
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping speech recognition:', e);
      }
      recognitionRef.current = null;
    }
    
    // Stop MediaRecorder if it's being used
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    // Stop the audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Cancel the animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setIsRecording(false);
    setAudioLevel(0);
  }, []);
  
  useEffect(() => {
    return () => {
      stopRecording();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stopRecording]);
  
  return {
    isRecording,
    audioLevel,
    error,
    startRecording,
    stopRecording,
  };
};

export default useVoiceRecorder;
