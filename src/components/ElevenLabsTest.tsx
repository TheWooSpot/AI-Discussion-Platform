import React, { useState } from 'react';
import { elevenLabsService } from '../services/elevenlabs';

const ElevenLabsTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const testConnection = async (): Promise<void> => {
    setIsLoading(true);
    setResult('');
    
    try {
      const isConnected = await elevenLabsService.testConnection();
      setResult(isConnected ? 'Connection successful!' : 'Connection failed');
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSpeech = async (): Promise<void> => {
    setIsLoading(true);
    setResult('');
    
    try {
      const audioBlob = await elevenLabsService.generateSpeech('Hello, this is a test of the ElevenLabs text-to-speech service.');
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioElement = new Audio(audioUrl);
      
      audioElement.onended = () => {
        setAudio(null);
      };
      
      audioElement.play();
      setAudio(audioElement);
      setResult('Speech generated and playing!');
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const stopAudio = (): void => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setAudio(null);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-white mb-4">ElevenLabs Test</h2>
      
      <div className="space-y-4">
        <button
          onClick={testConnection}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
        >
          {isLoading ? 'Testing...' : 'Test Connection'}
        </button>
        
        <button
          onClick={testSpeech}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
        >
          {isLoading ? 'Generating...' : 'Test Speech'}
        </button>
        
        {audio && (
          <button
            onClick={stopAudio}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
          >
            Stop Audio
          </button>
        )}
        
        {result && (
          <div className={`p-3 rounded ${
            result.includes('Error') ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'
          }`}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
};

export default ElevenLabsTest;
