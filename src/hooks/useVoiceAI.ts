import { useState, useCallback, useRef } from 'react';
import { elevenLabsService } from '../services/elevenlabs';

export interface VoiceState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  currentSpeaker: 'alex' | 'jordan' | null;
}

export const useVoiceAI = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isPlaying: false,
    isLoading: false,
    error: null,
    currentSpeaker: null,
  });

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<Array<{ text: string; speaker: 'alex' | 'jordan' }>>([]);
  const isProcessingRef = useRef(false);

  // Stop current audio
  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setVoiceState(prev => ({
      ...prev,
      isPlaying: false,
      currentSpeaker: null,
    }));
  }, []);

  // Play text as speech
  const speak = useCallback(async (text: string, speaker: 'alex' | 'jordan') => {
    if (!elevenLabsService.isAvailable()) {
      console.warn('ElevenLabs service not available');
      return;
    }

    // Add to queue
    audioQueueRef.current.push({ text, speaker });
    
    // Process queue if not already processing
    if (!isProcessingRef.current) {
      processAudioQueue();
    }
  }, []);

  // Process audio queue
  const processAudioQueue = useCallback(async () => {
    if (isProcessingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;

    while (audioQueueRef.current.length > 0) {
      const { text, speaker } = audioQueueRef.current.shift()!;

      try {
        setVoiceState(prev => ({
          ...prev,
          isLoading: true,
          error: null,
          currentSpeaker: speaker,
        }));

        // Generate speech
        const audioBuffer = speaker === 'alex' 
          ? await elevenLabsService.generateAlexSpeech(text)
          : await elevenLabsService.generateJordanSpeech(text);

        // Create audio element
        const audioUrl = elevenLabsService.createAudioUrl(audioBuffer);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        setVoiceState(prev => ({
          ...prev,
          isLoading: false,
          isPlaying: true,
        }));

        // Play audio and wait for completion
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          
          audio.onerror = (error) => {
            URL.revokeObjectURL(audioUrl);
            reject(error);
          };
          
          audio.play().catch(reject);
        });

        // Small pause between messages
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error('Error playing speech:', error);
        setVoiceState(prev => ({
          ...prev,
          isLoading: false,
          isPlaying: false,
          error: error instanceof Error ? error.message : 'Failed to play speech',
          currentSpeaker: null,
        }));
        break;
      }
    }

    setVoiceState(prev => ({
      ...prev,
      isPlaying: false,
      currentSpeaker: null,
    }));

    isProcessingRef.current = false;
  }, []);

  // Clear audio queue
  const clearQueue = useCallback(() => {
    audioQueueRef.current = [];
    stopAudio();
  }, [stopAudio]);

  // Check if service is available
  const isAvailable = elevenLabsService.isAvailable();

  return {
    voiceState,
    speak,
    stopAudio,
    clearQueue,
    isAvailable,
  };
};
