
import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import avatarService from '@/services/AvatarService';

interface AvatarProps {
  text?: string;
  isActive?: boolean;
  className?: string;
  onVideoEnd?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({ 
  text, 
  isActive = false, 
  className = '',
  onVideoEnd 
}) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Load avatar video when text changes
  useEffect(() => {
    let isMounted = true;
    
    const generateAvatarVideo = async () => {
      if (!text || !isActive || !avatarService.isReady()) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Generate avatar video from text
        const url = await avatarService.createStream({ text });
        
        if (isMounted) {
          setVideoUrl(url);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error generating avatar video:', err);
        if (isMounted) {
          setError('Failed to generate avatar video');
          setIsLoading(false);
        }
      }
    };
    
    generateAvatarVideo();
    
    return () => {
      isMounted = false;
    };
  }, [text, isActive]);
  
  // Handle video end event
  const handleVideoEnd = () => {
    if (onVideoEnd) {
      onVideoEnd();
    }
  };

  return (
    <div className={`avatar-container ${className}`}>
      <AspectRatio ratio={16/9} className="bg-muted rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center w-full h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Generating avatar...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center w-full h-full flex-col">
            <p className="text-sm text-destructive">{error}</p>
            <img 
              src={avatarService.getAvatarUrl()} 
              alt="Static avatar" 
              className="w-full h-full object-cover opacity-60"
            />
          </div>
        ) : videoUrl ? (
          <video 
            ref={videoRef}
            src={videoUrl} 
            className="w-full h-full object-cover"
            autoPlay 
            playsInline
            onEnded={handleVideoEnd}
            controls={false}
          />
        ) : (
          <img 
            src={avatarService.getAvatarUrl()} 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        )}
      </AspectRatio>
    </div>
  );
};

export default Avatar;
