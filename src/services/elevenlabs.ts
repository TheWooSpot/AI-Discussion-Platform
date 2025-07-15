// ElevenLabs Voice AI Service
export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
}

// Predefined voices for the hosts
export const HOST_VOICES = {
  alex: {
    voice_id: "21m00Tcm4TlvDq8ikWAM", // Rachel - warm, professional female voice
    name: "Alex",
    settings: {
      stability: 0.75,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true
    }
  },
  jordan: {
    voice_id: "29vD33N1CtxCmqQRPOHJ", // Drew - confident, articulate male voice  
    name: "Jordan",
    settings: {
      stability: 0.8,
      similarity_boost: 0.8,
      style: 0.4,
      use_speaker_boost: true
    }
  }
};

class ElevenLabsService {
  private apiKey: string | null;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || null;
    
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not found. Voice features will be disabled.');
    }
  }

  // Check if service is available
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  // Get available voices
  async getVoices(): Promise<Voice[]> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  // Generate speech from text
  async generateSpeech(
    text: string, 
    voiceId: string, 
    settings?: VoiceSettings
  ): Promise<ArrayBuffer> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const defaultSettings: VoiceSettings = {
      stability: 0.75,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true
    };

    const voiceSettings = { ...defaultSettings, ...settings };

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: voiceSettings,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate speech: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }

  // Generate speech for Alex (Host 1)
  async generateAlexSpeech(text: string): Promise<ArrayBuffer> {
    const alex = HOST_VOICES.alex;
    return this.generateSpeech(text, alex.voice_id, alex.settings);
  }

  // Generate speech for Jordan (Host 2)
  async generateJordanSpeech(text: string): Promise<ArrayBuffer> {
    const jordan = HOST_VOICES.jordan;
    return this.generateSpeech(text, jordan.voice_id, jordan.settings);
  }

  // Create audio URL from ArrayBuffer
  createAudioUrl(audioBuffer: ArrayBuffer): string {
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  }

  // Play audio directly
  async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const audioUrl = this.createAudioUrl(audioBuffer);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };
      
      audio.play().catch(reject);
    });
  }

  // Get user's usage info
  async getUserInfo() {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const elevenLabsService = new ElevenLabsService();
