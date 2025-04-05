
export interface AudioAnalyzerState {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  audioData: Uint8Array | null;
}

export const setupAudioAnalyzer = (stream: MediaStream): AudioAnalyzerState => {
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
  
  return {
    audioContext,
    analyser,
    audioData: dataArray
  };
};

export const cleanupAudioAnalyzer = (state: AudioAnalyzerState): void => {
  if (state.audioContext && state.audioContext.state !== 'closed') {
    try {
      state.audioContext.close();
    } catch (e) {
      console.error('Error closing audio context:', e);
    }
  }
};

export const updateAudioLevel = (
  analyser: AnalyserNode | null, 
  audioData: Uint8Array | null
): number => {
  if (!analyser || !audioData) return 0;
  
  analyser.getByteFrequencyData(audioData);
  const average = audioData.reduce((acc, val) => acc + val, 0) / audioData.length;
  return Math.min(1, average / 128);
};
