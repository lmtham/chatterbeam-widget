
import React, { useState, useEffect, useRef } from 'react';
import { Share, X, Mic, MicOff, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Avatar from '@/components/Avatar';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import avatarService from '@/services/AvatarService';
import { toast } from 'sonner';
import { TranscriptResult } from '@/types';
import { Link } from 'react-router-dom';
import VoiceRecorder from '@/components/VoiceRecorder';

const InteractiveAvatar = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [currentAIText, setCurrentAIText] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [remainingTime, setRemainingTime] = useState(600); // 10 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize the avatar service on component mount
  useEffect(() => {
    if (!avatarService.isReady()) {
      avatarService.initialize({
        provider: 'heygen',
        apiKey: '',
        avatarUrl: '/lovable-uploads/bcda452e-726f-4ad7-922f-f45f5533fb73.png'
      });
    }
    setIsInitialized(true);
    
    // Set welcome message
    const welcomeMessage = "Hello! I am your interactive avatar assistant. How may I help you today?";
    setCurrentAIText(welcomeMessage);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Start the timer when component mounts
  useEffect(() => {
    startTimer();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  const startTimer = () => {
    setTimerActive(true);
    
    timerRef.current = setInterval(() => {
      setRemainingTime(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current!);
          setTimerActive(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };
  
  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setRemainingTime(600);
    startTimer();
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Interactive Avatar Assistant',
        text: 'Check out this interactive avatar assistant!',
        url: window.location.href,
      })
      .then(() => console.log('Successful share'))
      .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      const url = window.location.href;
      navigator.clipboard.writeText(url)
        .then(() => toast.success('Link copied to clipboard'))
        .catch(err => toast.error('Could not copy link'));
    }
  };
  
  const handleTranscriptReceived = (result: TranscriptResult) => {
    setTranscript(result);
    
    if (result.isFinal && result.text.trim()) {
      // In a real app, this would send the transcript to an LLM and get a response
      // For demo purposes, we'll just echo back what was said
      setTimeout(() => {
        const response = `I heard you say: ${result.text}`;
        setCurrentAIText(response);
      }, 1000);
    }
  };
  
  const handleAvatarVideoEnd = () => {
    setCurrentAIText('');
  };
  
  const handleCloseSession = () => {
    // Navigate back to home
    window.history.back();
  };
  
  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-[#1A1F2C] to-[#221F26] text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 z-10 absolute w-full">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Interactive Avatar <span className="bg-gray-700/50 text-xs px-2 py-0.5 rounded">Beta</span></h1>
          <p className="text-sm text-gray-300">Interact with the cutting-edge HeyGen avatars in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="border-white/20 text-white"
            onClick={handleShare}
          >
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </header>
      
      {/* Main content - Avatar display */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        {/* Timer display */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full text-sm z-20">
          <Timer className="h-4 w-4" />
          Remaining Time {formatTime(remainingTime)}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full hover:bg-white/10"
            onClick={handleCloseSession}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Marketing banner */}
        <div className="absolute top-24 left-0 right-0 mx-auto w-fit bg-gradient-to-r from-primary/80 to-secondary/80 px-6 py-3 rounded-full z-20 shadow-lg">
          <p className="text-sm md:text-base">
            Integrate an AI interviewer in your recruiting workflow with 10x efficiency and unlimited availability for the candidates!
          </p>
        </div>
        
        {/* Avatar container */}
        <div className="w-full max-w-3xl">
          <AspectRatio ratio={16/9} className="overflow-hidden rounded-lg">
            <Avatar 
              text={currentAIText} 
              isActive={Boolean(currentAIText)}
              onVideoEnd={handleAvatarVideoEnd}
              className="w-full h-full object-cover"
            />
          </AspectRatio>
        </div>
      </div>
      
      {/* Controls */}
      <div className="py-6 px-4 flex justify-center items-center bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-3 w-full max-w-xl">
          <Button
            variant="outline"
            size="icon"
            className={`rounded-full w-12 h-12 flex-shrink-0 ${isListening ? 'bg-primary text-primary-foreground border-primary' : 'bg-white/10 border-white/20'}`}
            onClick={() => setIsListening(!isListening)}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          
          <div className="flex-1 bg-white/10 rounded-full px-6 py-3 flex items-center h-12">
            {transcript?.text ? (
              <p className="text-sm text-white/80">{transcript.text}</p>
            ) : (
              <p className="text-sm text-white/50">• • • • • • • • • •</p>
            )}
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-12 h-12 flex-shrink-0 bg-white/10 border-white/20"
          >
            <span className="text-lg">Tt</span>
          </Button>
        </div>
      </div>
      
      {/* Hidden voice recorder to handle actual speech recognition */}
      <div className="hidden">
        <VoiceRecorder
          onTranscriptReceived={handleTranscriptReceived}
          isListening={isListening}
          setIsListening={setIsListening}
        />
      </div>
      
      {/* HeyGen logo */}
      <div className="absolute bottom-4 right-4 opacity-70">
        <p className="text-lg font-semibold">HeyGen</p>
      </div>
    </div>
  );
};

export default InteractiveAvatar;
