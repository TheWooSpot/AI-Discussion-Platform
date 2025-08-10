import { VoiceProvider } from '../types/voice';
import { openaiService } from './openai';

class OpenAIProvider implements VoiceProvider {
  async generateSpeech(text: string, speaker: 'alex' | 'jordan'): Promise<Blob> {
    return openaiService.generateSpeech(text, speaker);
  }

  async generateDiscussionAudio(discussionText: string): Promise<Blob[]> {
    return openaiService.generateDiscussionAudio(discussionText);
  }

  async testConnection(): Promise<boolean> {
    return openaiService.testConnection();
  }

  getProviderName(): string {
    return openaiService.getProviderName();
  }
}

export const openaiProvider = new OpenAIProvider();