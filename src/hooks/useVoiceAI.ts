import { useState, useCallback } from 'react';
import { elevenLabsService } from '../services/elevenlabs';
import { geminiService } from '../services/gemini';

interface VoiceAIState {
  isGenerating: boolean;
  isPlaying: boolean;
  error: string | null;
  currentAudio: HTMLAudioElement | null;
}

interface VoiceAIHook extends VoiceAIState {
  generateAndPlay: (prompt: string) => Promise<void>;
  stop: () => void;
  clearError: () => void;
}

export const useVoiceAI = (): VoiceAIHook => {
  const [state, setState] = useState<VoiceAIState>({
    isGenerating: false,
    isPlaying: false,
    error: null,
    currentAudio: null
  });

  const generateAndPlay = useCallback(async (prompt: string): Promise<void> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    
    try {
      // Generate content with Gemini
      const content = await geminiService.generateContent(prompt);
      
      // Generate speech with ElevenLabs
      const audioBlob = await elevenLabsService.generateSpeech(content);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setState(prev => ({ ...prev, isPlaying: false, currentAudio: null }));
      };
      
      audio.onerror = () => {
        setState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          currentAudio: null, 
          error: 'Audio playback failed' 
        }));
      };
      
      await audio.play();
      
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        isPlaying: true, 
        currentAudio: audio 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }));
    }
  }, []);

  const stop = useCallback((): void => {
    if (state.currentAudio) {
      state.currentAudio.pause();
      state.currentAudio.currentTime = 0;
    }
    setState(prev => ({ ...prev, isPlaying: false, currentAudio: null }));
  }, [state.currentAudio]);

  const clearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    generateAndPlay,
    stop,
    clearError
  };
};
