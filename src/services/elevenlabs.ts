interface ElevenLabsConfig {
  apiKey: string;
  baseUrl: string;
}

interface VoiceConfig {
  id: string;
  name: string;
}

class ElevenLabsService {
  private config: ElevenLabsConfig;
  private voices: { [key: string]: VoiceConfig };

  constructor() {
    this.config = {
      apiKey: 'sk_8346e5be639cef9123c6c2025987338b8a09d05716909557',
      baseUrl: 'https://api.elevenlabs.io/v1'
    };

    // Different voice IDs for our moderators
    this.voices = {
      alex: { id: 'pNInz6obpgDQGcFmaJgB', name: 'Alex' }, // Adam voice
      jordan: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Jordan' } // Bella voice
    };
  }

  async generateSpeech(text: string, speaker: 'alex' | 'jordan' = 'alex'): Promise<Blob> {
    const voiceConfig = this.voices[speaker];
    
    try {
      const response = await fetch(`${this.config.baseUrl}/text-to-speech/${voiceConfig.id}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.config.apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: speaker === 'alex' ? 0.2 : 0.8, // Different speaking styles
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error(`Error generating speech for ${speaker}:`, error);
      throw error;
    }
  }

  async generateDiscussionAudio(discussionText: string): Promise<Blob[]> {
    // Parse the discussion to separate speakers
    const segments = this.parseDiscussion(discussionText);
    const audioBlobs: Blob[] = [];

    for (const segment of segments) {
      console.log(`🎤 Generating audio for ${segment.speaker}: ${segment.text.substring(0, 50)}...`);
      const audioBlob = await this.generateSpeech(segment.text, segment.speaker);
      audioBlobs.push(audioBlob);
    }

    return audioBlobs;
  }

  private parseDiscussion(text: string): Array<{ speaker: 'alex' | 'jordan', text: string }> {
    const segments: Array<{ speaker: 'alex' | 'jordan', text: string }> = [];
    
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

  async getVoices(): Promise<any[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.config.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getVoices();
      return true;
    } catch (error) {
      console.error('ElevenLabs connection test failed:', error);
      return false;
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
