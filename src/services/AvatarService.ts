
/**
 * Avatar Service for handling streaming video interactions
 * Uses D-ID API for realistic avatar animations
 */

export interface AvatarConfig {
  avatarUrl?: string;
  avatarId?: string;
  provider: 'did' | 'heygen'; // Can expand to support more providers
  apiKey: string;
  streamUrl?: string;
}

export interface AvatarStreamOptions {
  text: string;
  voiceId?: string;
  autoPlay?: boolean;
}

class AvatarService {
  private apiKey: string = '';
  private provider: 'did' | 'heygen' = 'did';
  private avatarUrl: string = '';
  private avatarId: string = '';
  private streamUrl: string = '';
  private isInitialized: boolean = false;

  constructor() {
    // Default avatar if none provided
    this.avatarUrl = 'https://cdn.pixabay.com/photo/2014/04/02/10/25/woman-303628_1280.png';
  }

  initialize(config: AvatarConfig): void {
    this.apiKey = config.apiKey;
    this.provider = config.provider;
    
    if (config.avatarUrl) {
      this.avatarUrl = config.avatarUrl;
    }
    
    if (config.avatarId) {
      this.avatarId = config.avatarId;
    }
    
    if (config.streamUrl) {
      this.streamUrl = config.streamUrl;
    }
    
    this.isInitialized = true;
    console.log('Avatar service initialized with provider:', this.provider);
  }

  async createStream(options: AvatarStreamOptions): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Avatar service not initialized. Call initialize() first.');
    }

    if (this.provider === 'did') {
      return this.createDIDStream(options);
    } else if (this.provider === 'heygen') {
      return this.createHeyGenStream(options);
    }

    throw new Error('Unsupported avatar provider');
  }

  private async createDIDStream(options: AvatarStreamOptions): Promise<string> {
    try {
      console.log('Creating D-ID stream for text:', options.text);
      
      // For development/testing, return a mock stream URL
      // In production, this would call the D-ID API
      if (!this.apiKey) {
        console.warn('Using mock D-ID stream (no API key provided)');
        // Return mock video URL - in production this would be from D-ID API
        return 'https://d-id-talks-prod.s3.us-west-2.amazonaws.com/auth0%7C639a28e9c70c12793cc2c3ee/tlk_0JDYs9tM6azPdwwptBq_h/1695660906577.mp4';
      }
      
      // Real D-ID API call
      const response = await fetch('https://api.d-id.com/talks', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: options.text
          },
          source_url: this.avatarUrl,
          ...(options.voiceId ? { voice_id: options.voiceId } : {})
        })
      });

      if (!response.ok) {
        throw new Error(`D-ID API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('D-ID stream created:', data);
      return data.result_url;
    } catch (error) {
      console.error('Error creating D-ID stream:', error);
      throw error;
    }
  }

  private async createHeyGenStream(options: AvatarStreamOptions): Promise<string> {
    try {
      console.log('Creating HeyGen stream for text:', options.text);
      
      // For development/testing, return a mock stream URL
      // In production, this would call the HeyGen API
      if (!this.apiKey) {
        console.warn('Using mock HeyGen stream (no API key provided)');
        return 'https://storage.googleapis.com/heygen-public/demo-video/talking_4.mp4';
      }
      
      // Real HeyGen API implementation would go here
      // Since HeyGen's API might differ, this is a placeholder
      
      throw new Error('HeyGen API integration not yet implemented');
    } catch (error) {
      console.error('Error creating HeyGen stream:', error);
      throw error;
    }
  }

  getAvatarUrl(): string {
    return this.avatarUrl;
  }
  
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export as singleton
export const avatarService = new AvatarService();
export default avatarService;
