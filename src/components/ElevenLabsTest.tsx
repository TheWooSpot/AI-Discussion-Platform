import React, { useState, useEffect } from 'react';
import { elevenLabsService, Voice, User } from '../services/elevenlabs';

const ElevenLabsTest: React.FC = () => {
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [testResults, setTestResults] = useState<{
    userInfo: { success: boolean; error?: string; duration?: number };
    voices: { success: boolean; error?: string; duration?: number };
    alexVoice: { success: boolean; error?: string; duration?: number };
    jordanVoice: { success: boolean; error?: string; duration?: number };
  }>({
    userInfo: { success: false },
    voices: { success: false },
    alexVoice: { success: false },
    jordanVoice: { success: false },
  });

  // Predefined voice IDs for Alex and Jordan
  const ALEX_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam voice
  const JORDAN_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Bella voice

  useEffect(() => {
    setIsServiceAvailable(elevenLabsService.isConfigured());
    if (elevenLabsService.isConfigured()) {
      runTests();
    }
  }, []);

  const runTests = async () => {
    // Test 1: User Info
    await testUserInfo();
    
    // Test 2: Voice List
    await testVoiceList();
    
    // Test 3: Alex Voice Generation
    await testVoiceGeneration('Alex', ALEX_VOICE_ID, 'alexVoice');
    
    // Test 4: Jordan Voice Generation
    await testVoiceGeneration('Jordan', JORDAN_VOICE_ID, 'jordanVoice');
  };

  const testUserInfo = async () => {
    const startTime = Date.now();
    try {
      const user = await elevenLabsService.getUserInfo();
      const duration = Date.now() - startTime;
      setUserInfo(user);
      setTestResults(prev => ({
        ...prev,
        userInfo: { success: true, duration }
      }));
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResults(prev => ({
        ...prev,
        userInfo: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          duration 
        }
      }));
    }
  };

  const testVoiceList = async () => {
    const startTime = Date.now();
    try {
      const voiceList = await elevenLabsService.getVoices();
      const duration = Date.now() - startTime;
      setVoices(voiceList);
      setTestResults(prev => ({
        ...prev,
        voices: { success: true, duration }
      }));
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResults(prev => ({
        ...prev,
        voices: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          duration 
        }
      }));
    }
  };

  const testVoiceGeneration = async (name: string, voiceId: string, key: 'alexVoice' | 'jordanVoice') => {
    const startTime = Date.now();
    try {
      const audioBuffer = await elevenLabsService.generateSpeech(
        `Hello, this is ${name} speaking. Welcome to our AI discussion platform!`,
        voiceId
      );
      const duration = Date.now() - startTime;
      
      // Play the generated audio
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
      
      setTestResults(prev => ({
        ...prev,
        [key]: { success: true, duration }
      }));
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResults(prev => ({
        ...prev,
        [key]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          duration 
        }
      }));
    }
  };

  const TestResult: React.FC<{ 
    title: string; 
    result: { success: boolean; error?: string; duration?: number };
    details?: string;
  }> = ({ title, result, details }) => (
    <div className={`p-4 rounded-lg border-l-4 ${
      result.success 
        ? 'bg-green-900/20 border-green-500 text-green-100' 
        : 'bg-red-900/20 border-red-500 text-red-100'
    }`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center">
          {result.success ? '✅' : '❌'} {title}
        </h3>
        {result.duration && (
          <span className="text-sm opacity-75">{result.duration}ms</span>
        )}
      </div>
      {result.error && (
        <p className="text-sm mt-2 opacity-90">
          {result.error}
        </p>
      )}
      {details && result.success && (
        <p className="text-sm mt-2 opacity-75">
          {details}
        </p>
      )}
    </div>
  );

  if (!isServiceAvailable) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">ElevenLabs Voice Service Test</h1>
          <div className="bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-red-100 mb-2">❌ Service Unavailable</h2>
            <p className="text-red-200">
              ElevenLabs API key is not configured. Please add your API key to the .env file:
            </p>
            <code className="block mt-2 p-2 bg-gray-800 rounded text-green-400">
              VITE_ELEVENLABS_API_KEY=your_api_key_here
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">ElevenLabs Voice Service Test</h1>
        
        <div className="bg-green-900/20 border-l-4 border-green-500 p-4 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-green-100">✅ Voice service is available</h2>
        </div>

        <div className="space-y-6">
          <TestResult 
            title="API Connection" 
            result={testResults.userInfo}
            details={userInfo ? `Subscription: ${userInfo.subscription.tier}` : undefined}
          />
          
          <TestResult 
            title="Voice List Retrieval" 
            result={testResults.voices}
            details={voices.length > 0 ? `Found ${voices.length} voices` : undefined}
          />
          
          <TestResult 
            title="Alex Voice Generation" 
            result={testResults.alexVoice}
            details="Testing Adam voice for Alex character"
          />
          
          <TestResult 
            title="Jordan Voice Generation" 
            result={testResults.jordanVoice}
            details="Testing Bella voice for Jordan character"
          />
        </div>

        {voices.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Available Voices</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {voices.slice(0, 12).map((voice) => (
                <div key={voice.voice_id} className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-400">{voice.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{voice.category}</p>
                  {voice.description && (
                    <p className="text-xs text-gray-500 mt-2">{voice.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-2">Troubleshooting Tips:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Make sure your API key is valid and has sufficient credits</li>
            <li>• Check that CORS is properly configured for your domain</li>
            <li>• Verify your internet connection is stable</li>
            <li>• Try refreshing the page if tests fail intermittently</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ElevenLabsTest;
