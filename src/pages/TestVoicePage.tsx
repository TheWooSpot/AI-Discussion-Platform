import React, { useState } from 'react';
import { PlayIcon, PauseIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid';
import { useVoiceProvider } from '../hooks/useVoiceProvider';
import { elevenLabsService } from '../services/elevenlabs';

const TestVoicePage: React.FC = () => {
  const { currentProvider, providerType } = useVoiceProvider();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');

  const testPhrases = [
    "Hello! This is Alex testing the voice synthesis system.",
    "Hi there! I'm Jordan, and I'm excited to demonstrate our AI voice capabilities.",
    "The future of artificial intelligence is incredibly promising and full of possibilities.",
    "Climate change requires immediate action and innovative solutions from all of us."
  ];

  const playWebSpeech = async (text: string, speaker: 'alex' | 'jordan'): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log(`🔊 Playing Web Speech for ${speaker}: ${text.substring(0, 50)}...`);
      
      // Cancel any existing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get available voices
      const voices = speechSynthesis.getVoices();
      console.log('🎤 Available voices for Web Speech:', voices.length);
      
      // Select voice based on speaker
      let selectedVoice: SpeechSynthesisVoice | null = null;
      
      if (speaker === 'alex') {
        selectedVoice = 
          voices.find(voice => voice.name.includes('Microsoft David')) ||
          voices.find(voice => voice.name.includes('David')) ||
          voices.find(voice => voice.name.toLowerCase().includes('male')) ||
          voices.find(voice => voice.name.includes('Alex')) ||
          voices[0];
      } else {
        selectedVoice = 
          voices.find(voice => voice.name.includes('Microsoft Zira')) ||
          voices.find(voice => voice.name.includes('Zira')) ||
          voices.find(voice => voice.name.toLowerCase().includes('female')) ||
          voices.find(voice => voice.name.includes('Samantha')) ||
          voices[1] || voices[0];
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`🎤 Selected voice: ${selectedVoice.name} for ${speaker}`);
      } else {
        console.log(`⚠️ No specific voice found for ${speaker}, using default`);
      }
      
      // Configure speech parameters
      utterance.rate = speaker === 'alex' ? 0.9 : 1.0;
      utterance.pitch = speaker === 'alex' ? 0.8 : 1.2;
      utterance.volume = 1.0;
      
      // Set up event handlers
      utterance.onstart = () => {
        console.log(`🔊 Web Speech started for ${speaker}`);
        setIsPlaying(true);
        setDebugInfo(`Playing ${speaker} with Web Speech API`);
      };
      
      utterance.onend = () => {
        console.log(`✅ Web Speech completed for ${speaker}`);
        setIsPlaying(false);
        setDebugInfo(`Completed ${speaker} test with Web Speech API`);
        resolve();
      };
      
      utterance.onerror = (event) => {
        if (event.error === 'interrupted') {
          console.log(`🔄 Web Speech interrupted for ${speaker} (expected behavior)`);
          return;
        }
        console.error(`❌ Web Speech error for ${speaker}:`, event.error);
        setIsPlaying(false);
        setError(`Web Speech error: ${event.error}`);
        setDebugInfo(`Error playing ${speaker} with Web Speech API: ${event.error}`);
        reject(new Error(`Web Speech error: ${event.error}`));
      };
      
      // Start speaking
      console.log(`🎤 Starting Web Speech synthesis for ${speaker}...`);
      speechSynthesis.speak(utterance);
    });
  };

  const createAudioElement = (blob: Blob, speaker: 'alex' | 'jordan'): HTMLAudioElement => {
    console.log(`🔊 Creating audio element for ${speaker} with ${providerType}`);
    const audioUrl = URL.createObjectURL(blob);
    return new Audio(audioUrl);
  };

  const testVoice = async (speaker: 'alex' | 'jordan', phrase: string): Promise<void> => {
    console.log(`🎯 TEST VOICE - Provider: ${providerType}, Speaker: ${speaker}`);
    setDebugInfo(`Testing ${speaker} with ${currentProvider.getProviderName()}...`);
    setError('');
    setIsGenerating(true);

    try {
      if (providerType === 'webspeech') {
        // Use Web Speech API directly
        await playWebSpeech(phrase, speaker);
      } else {
        // Use ElevenLabs
        console.log(`🎤 Generating ElevenLabs speech...`);
        const audioBlob = await currentProvider.generateSpeech(phrase, speaker);
        console.log(`✅ ElevenLabs speech generated`);
        
        const audio = createAudioElement(audioBlob, speaker);
        
        audio.onplay = () => {
          setIsPlaying(true);
          setDebugInfo(`Playing ${speaker} with ${currentProvider.getProviderName()}`);
        };
        
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentAudio(null);
          setDebugInfo(`Completed ${speaker} test with ${currentProvider.getProviderName()}`);
        };
        
        audio.onerror = () => {
          setError(`Audio playback failed for ${speaker}`);
          setIsPlaying(false);
          setCurrentAudio(null);
          setDebugInfo(`Error playing ${speaker} with ${currentProvider.getProviderName()}`);
        };

        setCurrentAudio(audio);
        await audio.play();
      }
      
    } catch (error) {
      console.error('❌ Test voice error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to generate ${speaker} voice: ${errorMessage}`);
      setDebugInfo(`Error: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const stopPlayback = (): void => {
    console.log('🛑 Stopping playback...');
    
    if (providerType === 'webspeech') {
      speechSynthesis.cancel();
    }
    
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    
    setIsPlaying(false);
    setDebugInfo('Playback stopped');
  };

  // Get provider-specific voice descriptions
  const getVoiceDescription = (speaker: 'alex' | 'jordan') => {
    if (providerType === 'elevenlabs') {
      const selectedVoices = elevenLabsService.getSelectedVoices();
      const voice = selectedVoices[speaker];
      return `ElevenLabs ${voice.name} - ${voice.description}`;
    } else {
      return speaker === 'alex' ? 'Microsoft David (Male)' : 'Microsoft Zira (Female)';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <SpeakerWaveIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Voice Provider Test</h1>
          <p className="text-gray-400">Test different voice providers and speakers</p>
        </div>

        {/* Provider Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Provider</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-green-400 mb-2">Active Provider</h3>
              <p className="text-lg">{currentProvider.getProviderName()}</p>
              <p className="text-sm text-gray-400">Type: {providerType}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-blue-400 mb-2">Status</h3>
              <p className="text-sm">{debugInfo || 'Ready to test'}</p>
              {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
            </div>
          </div>
        </div>

        {/* Voice Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Alex Voice Test */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center mb-6">
              <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                providerType === 'elevenlabs' ? 'bg-blue-500' : 'bg-green-500'
              }`}>
                <span className="text-2xl font-bold">A</span>
              </div>
              <h3 className="text-xl font-semibold">Alex</h3>
              <p className="text-gray-400 text-sm">
                {getVoiceDescription('alex')} {!currentProvider && providerType !== 'webspeech' && <span className="text-yellow-400">(API key needed)</span>}
              </p>
            </div>

            <div className="space-y-3">
              {testPhrases.slice(0, 2).map((phrase, index) => (
                <button
                  key={index}
                  onClick={() => testVoice('alex', phrase)}
                  disabled={isGenerating || isPlaying}
                  className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{phrase.substring(0, 50)}...</span>
                    <PlayIcon className={`h-4 w-4 ${
                      providerType === 'elevenlabs' ? 'text-blue-400' : 'text-green-400'
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Jordan Voice Test */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center mb-6">
              <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                providerType === 'elevenlabs' ? 'bg-purple-500' : 'bg-pink-500'
              }`}>
                <span className="text-2xl font-bold">J</span>
              </div>
              <h3 className="text-xl font-semibold">Jordan</h3>
              <p className="text-gray-400 text-sm">
                {getVoiceDescription('jordan')} {!currentProvider && providerType !== 'webspeech' && <span className="text-yellow-400">(API key needed)</span>}
              </p>
            </div>

            <div className="space-y-3">
              {testPhrases.slice(2, 4).map((phrase, index) => (
                <button
                  key={index}
                  onClick={() => testVoice('jordan', phrase)}
                  disabled={isGenerating || isPlaying}
                  className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{phrase.substring(0, 50)}...</span>
                    <PlayIcon className={`h-4 w-4 ${
                      providerType === 'elevenlabs' ? 'text-purple-400' : 'text-pink-400'
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-gray-800 rounded-lg p-6 mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Playback Control</h3>
              <p className="text-gray-400 text-sm">
                {isPlaying ? `Audio is playing with ${providerType}...` : 'No audio playing'}
              </p>
            </div>
            
            <div className="flex space-x-4">
              {isPlaying && (
                <button
                  onClick={stopPlayback}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  <PauseIcon className="h-4 w-4" />
                  <span>Stop</span>
                </button>
              )}
              
              {isGenerating && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-gray-600 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating with {providerType}...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Provider-Specific Instructions */}
        <div className="bg-gray-800 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">How to Test</h3>
          <div className="space-y-2 text-gray-300">
            <p>1. Use the voice provider toggle in the navigation bar to switch between ElevenLabs and Web Speech API</p>
            <p>2. Click any test phrase button to hear that voice with the selected provider</p>
            <p>3. Compare the voice quality and characteristics between providers</p>
            {providerType === 'elevenlabs' ? (
              <p>4. <strong>ElevenLabs Mode:</strong> Premium AI voices (Adam for Alex, Bella for Jordan) with high quality synthesis</p>
            ) : (
              <p>4. <strong>Web Speech Mode:</strong> Free system voices (Microsoft David for Alex, Microsoft Zira for Jordan)</p>
            )}
          </div>
        </div>

        {/* Debug Information */}
        <div className="bg-gray-800 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">Debug Information</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p><strong>Current Provider:</strong> {currentProvider.getProviderName()}</p>
            <p><strong>Provider Type:</strong> {providerType}</p>
            {providerType === 'elevenlabs' && (
              <div>
                <p><strong>Selected Voices:</strong></p>
                <div className="ml-4 text-xs">
                  <p>Alex: {elevenLabsService.getSelectedVoices().alex.name}</p>
                  <p>Jordan: {elevenLabsService.getSelectedVoices().jordan.name}</p>
                </div>
              </div>
            )}
            <p><strong>Web Speech Available:</strong> {'speechSynthesis' in window ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Available Voices:</strong> {speechSynthesis.getVoices().length} system voices detected</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestVoicePage;
