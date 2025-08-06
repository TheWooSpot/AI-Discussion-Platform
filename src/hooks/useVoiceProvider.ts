import { useState, useEffect } from 'react';
import { VoiceProvider } from '../types/voice';
import { elevenLabsProvider } from '../services/elevenLabsProvider';
import { webSpeechProvider } from '../services/webSpeechProvider';

type VoiceProviderType = 'elevenlabs' | 'webspeech';

interface VoiceProviderHook {
  currentProvider: VoiceProvider;
  providerType: VoiceProviderType;
  setProviderType: (type: VoiceProviderType) => void;
  isWebSpeechAvailable: boolean;
  isElevenLabsAvailable: boolean;
}

// Create a global state for voice provider
let globalProviderType: VoiceProviderType = 'webspeech';
let globalSetProviderType: ((type: VoiceProviderType) => void) | null = null;
const listeners: Set<() => void> = new Set();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const useVoiceProvider = (): VoiceProviderHook => {
  const [providerType, setProviderTypeState] = useState<VoiceProviderType>(globalProviderType);
  const [isWebSpeechAvailable, setIsWebSpeechAvailable] = useState(false);
  const [isElevenLabsAvailable, setIsElevenLabsAvailable] = useState(false);
  const [, forceUpdate] = useState({});

  // Set up global state management
  useEffect(() => {
    const listener = () => {
      setProviderTypeState(globalProviderType);
      forceUpdate({});
    };
    
    listeners.add(listener);
    
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setProviderType = (type: VoiceProviderType) => {
    console.log(`🔄 Setting global voice provider to: ${type}`);
    globalProviderType = type;
    setProviderTypeState(type);
    notifyListeners();
  };

  // Set global setter
  if (!globalSetProviderType) {
    globalSetProviderType = setProviderType;
  }

  useEffect(() => {
    // Test provider availability
    const testProviders = async () => {
      console.log('🔍 Testing voice providers...');
      
      const webSpeechTest = await webSpeechProvider.testConnection();
      const elevenLabsTest = await elevenLabsProvider.testConnection();
      
      console.log('🔍 Provider test results:', {
        webSpeech: webSpeechTest,
        elevenLabs: elevenLabsTest
      });
      
      setIsWebSpeechAvailable(webSpeechTest);
      setIsElevenLabsAvailable(elevenLabsTest);

      // If ElevenLabs is not available, fallback to Web Speech
      if (!elevenLabsTest && webSpeechTest) {
        console.log('🔄 Falling back to Web Speech API');
        setProviderType('webspeech');
      }
    };

    testProviders();
  }, []);

  // Log provider changes for debugging
  useEffect(() => {
    console.log('🎯 Voice provider changed to:', providerType);
    console.log('🎯 Current provider name:', getCurrentProvider().getProviderName());
  }, [providerType]);

  const getCurrentProvider = (): VoiceProvider => {
    return providerType === 'elevenlabs' ? elevenLabsProvider : webSpeechProvider;
  };

  const currentProvider = getCurrentProvider();

  return {
    currentProvider,
    providerType,
    setProviderType,
    isWebSpeechAvailable,
    isElevenLabsAvailable
  };
};
