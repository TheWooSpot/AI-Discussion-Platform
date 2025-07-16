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
