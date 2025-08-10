import { VoiceProvider, VoiceSegment, OpenAIVoiceConfig } from '../types/voice';

interface OpenAITTSRequest {
  model: 'tts-1' | 'tts-1-hd';
  input: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac';
}

class OpenAIService implements VoiceProvider {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  private voiceConfig: { [key: string]: OpenAIVoiceConfig };

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    
    // Default voice configurations
    this.voiceConfig = {
      alex: { model: 'tts-1', voice: 'onyx' }, // Male voice
      jordan: { model: 'tts-1', voice: 'nova' } // Female voice
    };
  }

  async generateSpeech(text: string, speaker: 'alex' | 'jordan'): Promise<Blob> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const config = this.voiceConfig[speaker];
    
    const request: OpenAITTSRequest = {
      model: config.model,
      input: text,
      voice: config.voice,
      response_format: 'mp3'
    };

    try {
      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS API error: ${response.status} ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error(`Error generating OpenAI speech for ${speaker}:`, error);
      throw error;
    }
  }

  async generateDiscussionAudio(discussionText: string): Promise<Blob[]> {
    const segments = this.parseDiscussion(discussionText);
    const audioBlobs: Blob[] = [];

    for (const segment of segments) {
      console.log(`🎤 Generating OpenAI audio for ${segment.speaker}: ${segment.text.substring(0, 50)}...`);
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
      console.log('❌ OpenAI API key not configured');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      console.log('🔍 OpenAI test response:', response.status);
      return response.ok;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  getProviderName(): string {
    return `OpenAI TTS (${this.voiceConfig.alex.voice} / ${this.voiceConfig.jordan.voice})`;
  }

  // Voice configuration methods
  setVoiceForSpeaker(speaker: 'alex' | 'jordan', voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'): void {
    this.voiceConfig[speaker].voice = voice;
  }

  setModelForSpeaker(speaker: 'alex' | 'jordan', model: 'tts-1' | 'tts-1-hd'): void {
    this.voiceConfig[speaker].model = model;
  }

  getVoiceConfig(): { [key: string]: OpenAIVoiceConfig } {
    return this.voiceConfig;
  }
}

export const openaiService = new OpenAIService();