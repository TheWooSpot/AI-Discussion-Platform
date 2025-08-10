import { VoiceProvider } from '../types/voice';
import { geminiVoiceService } from './geminiVoice';

class GeminiVoiceProvider implements VoiceProvider {
  async generateSpeech(text: string, speaker: 'alex' | 'jordan'): Promise<Blob> {
    return geminiVoiceService.generateSpeech(text, speaker);
  }

  async generateDiscussionAudio(discussionText: string): Promise<Blob[]> {
    return geminiVoiceService.generateDiscussionAudio(discussionText);
  }

  async testConnection(): Promise<boolean> {
    return geminiVoiceService.testConnection();
  }

  getProviderName(): string {
    return geminiVoiceService.getProviderName();
  }
}

export const geminiVoiceProvider = new GeminiVoiceProvider();