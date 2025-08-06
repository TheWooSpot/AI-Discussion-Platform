import { VoiceProvider, VoiceSegment } from '../types/voice';

class WebSpeechService implements VoiceProvider {
  private alexVoice: SpeechSynthesisVoice | null = null;
  private jordanVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.initializeVoices();
    // Re-initialize when voices change (some browsers load voices asynchronously)
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.initializeVoices();
    }
  }

  private initializeVoices(): void {
    const voices = speechSynthesis.getVoices();
    
    // Prefer Microsoft voices, fallback to other system voices
    this.alexVoice = 
      voices.find(voice => voice.name.includes('Microsoft David')) ||
      voices.find(voice => voice.name.includes('David')) ||
      voices.find(voice => voice.name.includes('Alex')) ||
      voices[0];

    this.jordanVoice = 
      voices.find(voice => voice.name.includes('Microsoft Zira')) ||
      voices.find(voice => voice.name.includes('Zira')) ||
      voices.find(voice => voice.name.includes('Samantha')) ||
      voices[1] || voices[0];

    console.log('🎤 Web Speech voices initialized:', {
      alex: this.alexVoice?.name,
      jordan: this.jordanVoice?.name
    });
  }

  async generateSpeech(text: string, speaker: 'alex' | 'jordan'): Promise<Blob> {
    return new Promise((resolve) => {
      console.log(`🎤 Web Speech generating audio for ${speaker}: ${text.substring(0, 50)}...`);

      // Create a special blob that contains the speech data
      const speechData = {
        type: 'web-speech',
        text: text,
        speaker: speaker,
        voice: speaker === 'alex' ? this.alexVoice?.name : this.jordanVoice?.name,
        rate: speaker === 'alex' ? 0.9 : 1.0,
        pitch: speaker === 'alex' ? 0.8 : 1.2,
        volume: 1.0
      };

      const blob = new Blob([JSON.stringify(speechData)], { type: 'application/json' });
      resolve(blob);
    });
  }

  async generateDiscussionAudio(discussionText: string): Promise<Blob[]> {
    console.log('🎤 Web Speech generating discussion audio...');
    const segments = this.parseDiscussion(discussionText);
    const audioBlobs: Blob[] = [];

    for (const segment of segments) {
      console.log(`🎤 Generating Web Speech audio for ${segment.speaker}: ${segment.text.substring(0, 50)}...`);
      const audioBlob = await this.generateSpeech(segment.text, segment.speaker);
      audioBlobs.push(audioBlob);
    }

    console.log(`✅ Web Speech generated ${audioBlobs.length} audio segments`);
    return audioBlobs;
  }

  private parseDiscussion(text: string): VoiceSegment[] {
    const segments: VoiceSegment[] = [];
    
    // Split by common speaker indicators
    const lines = text.split('\n').filter(line => line.trim());
    let currentSpeaker: 'alex' | 'jordan' = 'alex';
    let currentText = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for speaker indicators
      if (trimmedLine.toLowerCase().includes('alex:') || 
          trimmedLine.toLowerCase().includes('alex ') ||
          trimmedLine.toLowerCase().startsWith('alex')) {
        
        // Save previous segment if exists
        if (currentText.trim()) {
          segments.push({ speaker: currentSpeaker, text: currentText.trim() });
        }
        
        currentSpeaker = 'alex';
        currentText = trimmedLine.replace(/^alex:?\s*/i, '');
        
      } else if (trimmedLine.toLowerCase().includes('jordan:') || 
                 trimmedLine.toLowerCase().includes('jordan ') ||
                 trimmedLine.toLowerCase().startsWith('jordan')) {
        
        // Save previous segment if exists
        if (currentText.trim()) {
          segments.push({ speaker: currentSpeaker, text: currentText.trim() });
        }
        
        currentSpeaker = 'jordan';
        currentText = trimmedLine.replace(/^jordan:?\s*/i, '');
        
      } else {
        // Continue with current speaker
        currentText += ' ' + trimmedLine;
      }
    }

    // Add final segment
    if (currentText.trim()) {
      segments.push({ speaker: currentSpeaker, text: currentText.trim() });
    }

    // If no clear separation found, alternate speakers by paragraph
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
    try {
      if (!('speechSynthesis' in window)) {
        return false;
      }
      
      const voices = speechSynthesis.getVoices();
      return voices.length > 0;
    } catch (error) {
      console.error('Web Speech API test failed:', error);
      return false;
    }
  }

  getProviderName(): string {
    const alexVoiceName = this.alexVoice?.name || 'Default';
    const jordanVoiceName = this.jordanVoice?.name || 'Default';
    return `Web Speech (${alexVoiceName.split(' ')[0]} / ${jordanVoiceName.split(' ')[0]})`;
  }
}

export const webSpeechService = new WebSpeechService();
