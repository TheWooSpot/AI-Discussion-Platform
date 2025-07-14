const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
}

export interface User {
  subscription: {
    tier: string;
  };
  xi_api_key: string;
}

class ElevenLabsService {
  private apiKey: string;
  
  // Predefined voice IDs for Alex and Jordan
  private readonly ALEX_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam voice
  private readonly JORDAN_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Bella voice

  constructor() {
    this.apiKey = ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not found. Voice features will be disabled.');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const url = `${ELEVENLABS_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API Error (${response.status}):`, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  async getUserInfo(): Promise<User> {
    try {
      const response = await this.makeRequest('/user');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      throw new Error('Failed to fetch user info');
    }
  }

  async getVoices(): Promise<Voice[]> {
    try {
      const response = await this.makeRequest('/voices');
      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      throw new Error('Failed to fetch voices');
    }
  }

  async generateSpeech(text: string, voiceId: string): Promise<ArrayBuffer> {
    try {
      const response = await this.makeRequest(`/text-to-speech/${voiceId}`, {
        method: 'POST',
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Failed to generate speech:', error);
      throw new Error('Failed to generate speech');
    }
  }

  // Generate speech for Alex character
  async generateAlexSpeech(text: string): Promise<ArrayBuffer> {
    return this.generateSpeech(text, this.ALEX_VOICE_ID);
  }

  // Generate speech for Jordan character
  async generateJordanSpeech(text: string): Promise<ArrayBuffer> {
    return this.generateSpeech(text, this.JORDAN_VOICE_ID);
  }

  // Create audio URL from buffer
  createAudioUrl(audioBuffer: ArrayBuffer): string {
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    return URL.createObjectURL(audioBlob);
  }

  // Check if service is configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  // Check if service is available (alias for isConfigured)
  isAvailable(): boolean {
    return this.isConfigured();
  }
}

export const elevenLabsService = new ElevenLabsService();
