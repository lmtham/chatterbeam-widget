
export interface RecordingResources {
  mediaRecorder: MediaRecorder | null;
  stream: MediaStream | null;
  recognition: any;
  animationFrame: number | null;
}

export const resetResources = (
  resources: RecordingResources,
  audioCleanup: () => void,
  timeoutRef?: { current: NodeJS.Timeout | null }
): void => {
  // Cancel animation frame
  if (resources.animationFrame) {
    cancelAnimationFrame(resources.animationFrame);
  }
  
  // Clear timeout if it exists
  if (timeoutRef?.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
  
  // Stop and clear recognition
  if (resources.recognition) {
    try {
      resources.recognition.abort();
    } catch (e) {
      console.error('Error stopping recognition:', e);
    }
  }
  
  // Stop media recorder
  if (resources.mediaRecorder && resources.mediaRecorder.state !== 'inactive') {
    try {
      resources.mediaRecorder.stop();
    } catch (e) {
      console.error('Error stopping media recorder:', e);
    }
  }
  
  // Stop and release media stream tracks
  if (resources.stream) {
    resources.stream.getTracks().forEach(track => {
      try {
        track.stop();
      } catch (e) {
        console.error('Error stopping track:', e);
      }
    });
  }
  
  // Run audio cleanup function
  audioCleanup();
};
