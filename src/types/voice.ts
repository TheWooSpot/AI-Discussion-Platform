export interface VoiceSegment {
  speaker: 'alex' | 'jordan';
  text: string;
}

export interface VoiceProvider {
  generateSpeech(text: string, speaker: 'alex' | 'jordan'): Promise<Blob>;
  generateDiscussionAudio(discussionText: string): Promise<Blob[]>;
  testConnection(): Promise<boolean>;
  getProviderName(): string;
}

export interface OpenAIVoiceConfig {
  model: 'tts-1' | 'tts-1-hd';
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

export interface GeminiVoiceConfig {
  model: 'text-to-speech';
  voice: 'en-US-Standard-A' | 'en-US-Standard-B' | 'en-US-Standard-C' | 'en-US-Standard-D' | 'en-US-Wavenet-A' | 'en-US-Wavenet-B';
}