import React from 'react';
import { SpeakerWaveIcon, SpeakerXMarkIcon, MicrophoneIcon } from '@heroicons/react/24/solid';

interface VoiceState {
  isLoading: boolean;
  isPlaying: boolean;
  currentSpeaker: 'alex' | 'jordan' | null;
  error: string | null;
}

interface VoiceControlsProps {
  onToggleVoice?: () => void;
  voiceEnabled?: boolean;
  className?: string;
  voiceState?: VoiceState;
  stopAudio?: () => void;
  isAvailable?: boolean;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({ 
  onToggleVoice, 
  voiceEnabled = true, 
  className = '',
  voiceState = { isLoading: false, isPlaying: false, currentSpeaker: null, error: null },
  stopAudio,
  isAvailable = true
}) => {
  if (!isAvailable) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="text-gray-500 text-sm">Voice AI unavailable</div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Voice Toggle */}
      <button
        onClick={onToggleVoice}
        className={`p-2 rounded-full transition-colors ${
          voiceEnabled
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
        }`}
        title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
      >
        {voiceEnabled ? (
          <SpeakerWaveIcon className="h-5 w-5" />
        ) : (
          <SpeakerXMarkIcon className="h-5 w-5" />
        )}
      </button>

      {/* Stop Audio */}
      {voiceState.isPlaying && stopAudio && (
        <button
          onClick={stopAudio}
          className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
          title="Stop audio"
        >
          <SpeakerXMarkIcon className="h-5 w-5" />
        </button>
      )}

      {/* Voice Status */}
      <div className="flex items-center space-x-1 text-sm">
        {voiceState.isLoading && (
          <div className="flex items-center space-x-1 text-blue-400">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <span>Generating...</span>
          </div>
        )}
        
        {voiceState.isPlaying && (
          <div className="flex items-center space-x-1 text-green-400">
            <MicrophoneIcon className="h-4 w-4 animate-pulse" />
            <span>
              {voiceState.currentSpeaker === 'alex' ? 'Alex' : 'Jordan'} speaking
            </span>
          </div>
        )}
        
        {voiceState.error && (
          <div className="text-red-400 text-xs">
            Voice error: {voiceState.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceControls;
