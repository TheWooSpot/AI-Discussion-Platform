import { useState } from 'react';
import { SpeakerWaveIcon, CogIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useVoiceProvider } from '../hooks/useVoiceProvider';
import { elevenLabsService } from '../services/elevenlabs';

export default function VoiceProviderToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [showElevenLabsSubmenu, setShowElevenLabsSubmenu] = useState(false);
  const [selectedVoices, setSelectedVoices] = useState(elevenLabsService.getSelectedVoices());
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

  const handleVoiceChange = (speaker: 'alex' | 'jordan', voiceId: string) => {
    elevenLabsService.setVoiceForSpeaker(speaker, voiceId);
    setSelectedVoices(elevenLabsService.getSelectedVoices());
  };

  const availableVoices = elevenLabsService.getAvailableVoices();

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
          <div className={`p-3 transition-all duration-200 ${showElevenLabsSubmenu ? 'transform -translate-x-full' : ''}`}>
            <h3 className="text-sm font-semibold text-white mb-3">Voice Provider</h3>
            
            <div className="space-y-2">
              {/* ElevenLabs Option */}
              <div className="relative">
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
                    <div className="flex items-center space-x-1">
                      <div className="text-xs">
                        {providerType === 'elevenlabs' && isElevenLabsAvailable ? (
                          <span className="text-green-400">✓</span>
                        ) : isElevenLabsAvailable ? (
                          <span className="text-gray-400">○</span>
                        ) : (
                          <span className="text-red-400">✗</span>
                        )}
                      </div>
                      {isElevenLabsAvailable && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowElevenLabsSubmenu(true);
                          }}
                          className="p-1 hover:bg-gray-600 rounded"
                        >
                          <ChevronRightIcon className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </button>
              </div>

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

          {/* ElevenLabs Voice Selection Submenu */}
          {showElevenLabsSubmenu && (
            <div className="absolute top-0 right-0 w-80 bg-gray-800 rounded-md shadow-lg border border-gray-700 p-3">
              <div className="flex items-center mb-3">
                <button
                  onClick={() => setShowElevenLabsSubmenu(false)}
                  className="p-1 hover:bg-gray-700 rounded mr-2"
                >
                  <ChevronRightIcon className="h-4 w-4 transform rotate-180" />
                </button>
                <h3 className="text-sm font-semibold text-white">ElevenLabs Voice Selection</h3>
              </div>

              <div className="space-y-4">
                {/* Alex Voice Selection */}
                <div>
                  <h4 className="text-xs font-medium text-blue-400 mb-2">Alex (Moderator A)</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {availableVoices.map((voice) => (
                      <button
                        key={`alex-${voice.id}`}
                        onClick={() => handleVoiceChange('alex', voice.id)}
                        className={`w-full text-left p-2 rounded text-xs transition-colors ${
                          selectedVoices.alex.id === voice.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <div className="font-medium">{voice.name}</div>
                        <div className="text-xs opacity-75">{voice.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Jordan Voice Selection */}
                <div>
                  <h4 className="text-xs font-medium text-purple-400 mb-2">Jordan (Moderator B)</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {availableVoices.map((voice) => (
                      <button
                        key={`jordan-${voice.id}`}
                        onClick={() => handleVoiceChange('jordan', voice.id)}
                        className={`w-full text-left p-2 rounded text-xs transition-colors ${
                          selectedVoices.jordan.id === voice.id
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <div className="font-medium">{voice.name}</div>
                        <div className="text-xs opacity-75">{voice.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Current Selection Summary */}
              <div className="mt-4 pt-3 border-t border-gray-700">
                <div className="text-xs text-gray-400">
                  <div>Alex: <span className="text-blue-400">{selectedVoices.alex.name}</span></div>
                  <div>Jordan: <span className="text-purple-400">{selectedVoices.jordan.name}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setShowElevenLabsSubmenu(false);
          }}
        />
      )}
    </div>
  );
}
