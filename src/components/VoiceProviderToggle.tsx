import { useState } from 'react';
import { SpeakerWaveIcon, CogIcon } from '@heroicons/react/24/outline';
import { useVoiceProvider } from '../hooks/useVoiceProvider';

export default function VoiceProviderToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    providerType, 
    setProviderType, 
    isWebSpeechAvailable, 
    isElevenLabsAvailable 
  } = useVoiceProvider();

  const handleProviderChange = (newProvider: 'elevenlabs' | 'webspeech') => {
    console.log(`🔄 Switching voice provider from ${providerType} to ${newProvider}`);
    setProviderType(newProvider);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
      >
        <SpeakerWaveIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Voice</span>
        <CogIcon className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-md shadow-lg border border-gray-700 z-50">
          <div className="p-3">
            <h3 className="text-sm font-semibold text-white mb-3">Voice Provider</h3>
            
            <div className="space-y-2">
              {/* ElevenLabs Option */}
              <button
                onClick={() => handleProviderChange('elevenlabs')}
                disabled={!isElevenLabsAvailable}
                className={`w-full text-left p-2 rounded text-sm transition-colors ${
                  providerType === 'elevenlabs'
                    ? 'bg-blue-600 text-white'
                    : isElevenLabsAvailable
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">ElevenLabs</div>
                    <div className="text-xs opacity-75">Premium AI voices</div>
                  </div>
                  <div className="text-xs">
                    {providerType === 'elevenlabs' && isElevenLabsAvailable ? (
                      <span className="text-green-400">✓</span>
                    ) : isElevenLabsAvailable ? (
                      <span className="text-gray-400">○</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </div>
                </div>
              </button>

              {/* Web Speech Option */}
              <button
                onClick={() => handleProviderChange('webspeech')}
                disabled={!isWebSpeechAvailable}
                className={`w-full text-left p-2 rounded text-sm transition-colors ${
                  providerType === 'webspeech'
                    ? 'bg-blue-600 text-white'
                    : isWebSpeechAvailable
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Web Speech API</div>
                    <div className="text-xs opacity-75">Free system voices</div>
                  </div>
                  <div className="text-xs">
                    {providerType === 'webspeech' && isWebSpeechAvailable ? (
                      <span className="text-green-400">✓</span>
                    ) : isWebSpeechAvailable ? (
                      <span className="text-gray-400">○</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Current Provider Info */}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-xs text-gray-400">
                <div>Selected: {providerType === 'elevenlabs' ? 'ElevenLabs' : 'Web Speech API'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
