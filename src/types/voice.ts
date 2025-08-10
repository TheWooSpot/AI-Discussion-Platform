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
