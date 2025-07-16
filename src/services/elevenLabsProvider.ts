import { VoiceProvider } from '../types/voice';
import { elevenLabsService } from './elevenlabs';

class ElevenLabsProvider implements VoiceProvider {
  async generateSpeech(text: string, speaker: 'alex' | 'jordan'): Promise<Blob> {
    return elevenLabsService.generateSpeech(text, speaker);
  }

  async generateDiscussionAudio(discussionText: string): Promise<Blob[]> {
    return elevenLabsService.generateDiscussionAudio(discussionText);
  }

  async testConnection(): Promise<boolean> {
    return elevenLabsService.testConnection();
  }

  getProviderName(): string {
    return 'ElevenLabs (Adam / Bella)';
  }
}

export const elevenLabsProvider = new ElevenLabsProvider();
