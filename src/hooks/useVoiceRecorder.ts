
import { useState, useEffect, useRef, useCallback } from 'react';
import { TranscriptResult } from '@/types';
import { 
  AudioAnalyzerState, 
  setupAudioAnalyzer, 
  cleanupAudioAnalyzer, 
  updateAudioLevel 
} from '@/utils/audioAnalyzer';
import { 
  createSpeechRecognition, 
  isSpeechRecognitionSupported, 
  setupSpeechRecognition 
} from '@/utils/speechRecognition';
import { RecordingResources, resetResources } from '@/utils/resourceManager';

interface UseVoiceRecorderProps {
  onTranscriptReceived: (transcript: TranscriptResult) => void;
}

const useVoiceRecorder = ({ onTranscriptReceived }: UseVoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Add a counter to track recognition cycles
  const recognitionCyclesRef = useRef<number>(0);
  const MAX_RECOGNITION_CYCLES = 4; // Force a complete reset after this many cycles
  
  // Refs for managing resources
  const recordingResourcesRef = useRef<RecordingResources>({
    mediaRecorder: null,
    stream: null,
    recognition: null,
    animationFrame: null
  });
  
  // Ref for audio analyzer state
  const audioAnalyzerRef = useRef<AudioAnalyzerState>({
    audioContext: null,
    analyser: null,
    audioData: null
  });
  
  const recognitionRestartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio cleanup function
  const cleanupAudio = useCallback(() => {
    cleanupAudioAnalyzer(audioAnalyzerRef.current);
    audioAnalyzerRef.current = {
      audioContext: null,
      analyser: null,
      audioData: null
    };
  }, []);
  
  // Function to completely reset all resources
  const cleanupResources = useCallback((forceFullReset = false) => {
    resetResources(
      recordingResourcesRef.current, 
      cleanupAudio,
      recognitionRestartTimeoutRef
    );
    
    // Reset resources ref
    recordingResourcesRef.current = {
      mediaRecorder: null,
      stream: null,
      recognition: null,
      animationFrame: null
    };
  }, [cleanupAudio]);
  
  // Improved startRecording with better error handling and resource management
  const startRecording = useCallback(async () => {
    try {
      // Reset any lingering error state
      setError(null);
      
      // First, ensure we've cleaned up any existing resources
      // If this is a fresh start (not a restart), reset the cycle counter
      if (recognitionCyclesRef.current === 0) {
        cleanupResources(true);
      } else {
        cleanupResources(false);
      }
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingResourcesRef.current.stream = stream;
      
      // Set up audio analyzer for visualization
      audioAnalyzerRef.current = setupAudioAnalyzer(stream);
      
      // First try to use browser's SpeechRecognition API
      if (isSpeechRecognitionSupported()) {
        const recognition = createSpeechRecognition();
        recordingResourcesRef.current.recognition = recognition;
        
        // Setup speech recognition
        setupSpeechRecognition(
          recognition, 
          onTranscriptReceived,
          (errorMsg) => setError(errorMsg)
        );
        
        recognition.onend = () => {
          console.log('Speech recognition ended');
          
          // If it's still supposed to be recording, restart it
          if (isRecording) {
            try {
              // Increment the recognition cycles counter
              recognitionCyclesRef.current += 1;
              console.log(`Recognition cycle: ${recognitionCyclesRef.current}`);
              
              // Force recreation of the recognition instance to ensure a fresh state
              if (recordingResourcesRef.current.recognition) {
                try {
                  recordingResourcesRef.current.recognition.abort();
                } catch (abortError) {
                  console.error('Error aborting recognition:', abortError);
                }
                recordingResourcesRef.current.recognition = null;
              }
              
              // Small delay before restarting to allow resources to be properly released
              if (recognitionRestartTimeoutRef.current) {
                clearTimeout(recognitionRestartTimeoutRef.current);
              }
              
              // Check if we need to do a full reset of all resources
              const needsFullReset = recognitionCyclesRef.current >= MAX_RECOGNITION_CYCLES;
              
              recognitionRestartTimeoutRef.current = setTimeout(() => {
                console.log('Recreating recognition instance after end event');
                if (needsFullReset) {
                  console.log('Performing full resource reset after multiple cycles');
                  recognitionCyclesRef.current = 0;
                  // Completely reset all resources before starting again
                  cleanupResources(true);
                }
                startRecording();  
              }, needsFullReset ? 500 : 300); // Longer delay for full reset
            } catch (e) {
              console.error('Error restarting speech recognition:', e);
              setError('Failed to restart speech recognition');
              
              // Try again after a longer delay
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
        
        // Setup error recovery
        recognition.onerror = (event: any) => {
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
                if (recordingResourcesRef.current.recognition) {
                  recordingResourcesRef.current.recognition.abort();
                }
                recordingResourcesRef.current.recognition = null;
                startRecording();
              } catch (e) {
                console.error('Error restarting after error:', e);
              }
            }, 1000);
          }
        };
        
        try {
          recognition.start();
          setIsRecording(true);
        } catch (e) {
          console.error('Error starting speech recognition:', e);
          throw new Error('Failed to start speech recognition');
        }
      } else {
        // Fallback to MediaRecorder if SpeechRecognition is not available
        setupMediaRecorderFallback(stream);
      }
      
      // Start visualization
      startAudioVisualization();
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Microphone access denied or not available');
      setIsRecording(false);
      cleanupResources(); // Clean up any partially initialized resources
    }
  }, [isRecording, onTranscriptReceived, cleanupResources]);
  
  // Setup MediaRecorder as fallback
  const setupMediaRecorderFallback = (stream: MediaStream) => {
    const mediaRecorder = new MediaRecorder(stream);
    recordingResourcesRef.current.mediaRecorder = mediaRecorder;
    
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
  };
  
  // Start audio visualization
  const startAudioVisualization = () => {
    const updateVisualization = () => {
      if (!isRecording || !audioAnalyzerRef.current.analyser || !audioAnalyzerRef.current.audioData) return;
      
      const level = updateAudioLevel(
        audioAnalyzerRef.current.analyser,
        audioAnalyzerRef.current.audioData
      );
      
      setAudioLevel(level);
      
      recordingResourcesRef.current.animationFrame = requestAnimationFrame(updateVisualization);
    };
    
    updateVisualization();
  };
  
  // Improved stopRecording with better resource cleanup
  const stopRecording = useCallback(() => {
    console.log("Stopping voice recording");
    cleanupResources();
    setIsRecording(false);
    setAudioLevel(0);
  }, [cleanupResources]);
  
  // Clean up on component unmount
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);
  
  return {
    isRecording,
    audioLevel,
    error,
    startRecording,
    stopRecording,
  };
};

export default useVoiceRecorder;
