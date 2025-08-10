import { VoiceProvider, VoiceSegment, GeminiVoiceConfig } from '../types/voice';

interface GeminiTTSRequest {
  input: {
    text: string;
  };
  voice: {
    languageCode: string;
    name: string;
    ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  };
  audioConfig: {
    audioEncoding: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
    speakingRate?: number;
    pitch?: number;
  };
}

class GeminiVoiceService implements VoiceProvider {
  private apiKey: string;
  private baseUrl: string = 'https://texttospeech.googleapis.com/v1';
  private voiceConfig: { [key: string]: GeminiVoiceConfig };

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    
    // Default voice configurations
    this.voiceConfig = {
      alex: { model: 'text-to-speech', voice: 'en-US-Standard-D' }, // Male voice
      jordan: { model: 'text-to-speech', voice: 'en-US-Standard-C' } // Female voice
    };
  }

  async generateSpeech(text: string, speaker: 'alex' | 'jordan'): Promise<Blob> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const config = this.voiceConfig[speaker];
    
    const request: GeminiTTSRequest = {
      input: {
        text: text
      },
      voice: {
        languageCode: 'en-US',
        name: config.voice,
        ssmlGender: speaker === 'alex' ? 'MALE' : 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: speaker === 'alex' ? 0.9 : 1.0,
        pitch: speaker === 'alex' ? -2.0 : 2.0
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/text:synthesize?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Gemini TTS API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Convert base64 audio to blob
      const audioContent = data.audioContent;
      const binaryString = atob(audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return new Blob([bytes], { type: 'audio/mpeg' });
    } catch (error) {
      console.error(`Error generating Gemini speech for ${speaker}:`, error);
      throw error;
    }
  }

  async generateDiscussionAudio(discussionText: string): Promise<Blob[]> {
    const segments = this.parseDiscussion(discussionText);
    const audioBlobs: Blob[] = [];

    for (const segment of segments) {
      console.log(`🎤 Generating Gemini audio for ${segment.speaker}: ${segment.text.substring(0, 50)}...`);
      const audioBlob = await this.generateSpeech(segment.text, segment.speaker);
      audioBlobs.push(audioBlob);
    }

    return audioBlobs;
  }

  private parseDiscussion(text: string): VoiceSegment[] {
    const segments: VoiceSegment[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    let currentSpeaker: 'alex' | 'jordan' = 'alex';
    let currentText = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.toLowerCase().includes('alex:') || 
          trimmedLine.toLowerCase().startsWith('alex')) {
        if (currentText.trim()) {
          segments.push({ speaker: currentSpeaker, text: currentText.trim() });
        }
        currentSpeaker = 'alex';
        currentText = trimmedLine.replace(/^alex:?\s*/i, '');
      } else if (trimmedLine.toLowerCase().includes('jordan:') || 
                 trimmedLine.toLowerCase().startsWith('jordan')) {
        if (currentText.trim()) {
          segments.push({ speaker: currentSpeaker, text: currentText.trim() });
        }
        currentSpeaker = 'jordan';
        currentText = trimmedLine.replace(/^jordan:?\s*/i, '');
      } else {
        currentText += ' ' + trimmedLine;
      }
    }

    if (currentText.trim()) {
      segments.push({ speaker: currentSpeaker, text: currentText.trim() });
    }

    if (segments.length <= 1) {
      const paragraphs = text.split('\n\n').filter(p => p.trim());
      return paragraphs.map((paragraph, index) => ({
        speaker: index % 2 === 0 ? 'alex' : 'jordan',
        text: paragraph.trim()
      }));
    }

    return segments;
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      console.log('❌ Gemini API key not configured');
      return false;
    }

    try {
      // Test with a simple synthesis request instead of voices endpoint
      const testRequest = {
        input: { text: "test" },
        voice: { languageCode: "en-US", name: "en-US-Standard-A" },
        audioConfig: { audioEncoding: "MP3" }
      };
      
      const response = await fetch(`${this.baseUrl}/text:synthesize?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testRequest)
      });
      
      console.log('🔍 Gemini TTS test response:', response.status);
      return response.ok;
    } catch (error) {
      console.error('Gemini TTS connection test failed:', error);
      return false;
    }
  }

  getProviderName(): string {
    return `Gemini TTS (${this.voiceConfig.alex.voice} / ${this.voiceConfig.jordan.voice})`;
  }

  // Voice configuration methods
  setVoiceForSpeaker(speaker: 'alex' | 'jordan', voice: 'en-US-Standard-A' | 'en-US-Standard-B' | 'en-US-Standard-C' | 'en-US-Standard-D' | 'en-US-Wavenet-A' | 'en-US-Wavenet-B'): void {
    this.voiceConfig[speaker].voice = voice;
  }

  getVoiceConfig(): { [key: string]: GeminiVoiceConfig } {
    return this.voiceConfig;
  }
}

export const geminiVoiceService = new GeminiVoiceService();