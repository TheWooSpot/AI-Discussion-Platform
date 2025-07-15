import { useState } from 'react';
import { elevenLabsService, HOST_VOICES } from '../services/elevenlabs';
import { useVoiceAI } from '../hooks/useVoiceAI';
import { PlayIcon, StopIcon, SpeakerWaveIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export default function ElevenLabsTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const { speak, voiceState, stopAudio, isAvailable } = useVoiceAI();

  const updateTestResult = (testName: string, status: TestResult['status'], message: string, duration?: number) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.test === testName);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.duration = duration;
        return [...prev];
      }
      return [...prev, { test: testName, status, message, duration }];
    });
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    // Test 1: API Key Configuration
    setCurrentTest('API Key Configuration');
    updateTestResult('API Key Configuration', 'pending', 'Checking API key...');
    
    const startTime1 = Date.now();
    if (elevenLabsService.isAvailable()) {
      updateTestResult('API Key Configuration', 'success', 'API key found and configured', Date.now() - startTime1);
    } else {
      updateTestResult('API Key Configuration', 'error', 'API key not found or invalid');
      setIsRunning(false);
      return;
    }

    // Test 2: Voice Service Availability
    setCurrentTest('Voice Service Availability');
    updateTestResult('Voice Service Availability', 'pending', 'Checking service availability...');
    
    const startTime2 = Date.now();
    if (isAvailable) {
      updateTestResult('Voice Service Availability', 'success', 'Voice service is available', Date.now() - startTime2);
    } else {
      updateTestResult('Voice Service Availability', 'error', 'Voice service unavailable');
    }

    // Test 3: API Connection
    setCurrentTest('API Connection');
    updateTestResult('API Connection', 'pending', 'Testing API connection...');
    
    const startTime3 = Date.now();
    try {
      const userInfo = await elevenLabsService.getUserInfo();
      updateTestResult('API Connection', 'success', `Connected! Character limit: ${userInfo.subscription?.character_limit || 'N/A'}`, Date.now() - startTime3);
    } catch (error) {
      updateTestResult('API Connection', 'error', `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 4: Voice List Retrieval
    setCurrentTest('Voice List Retrieval');
    updateTestResult('Voice List Retrieval', 'pending', 'Fetching available voices...');
    
    const startTime4 = Date.now();
    try {
      const voices = await elevenLabsService.getVoices();
      updateTestResult('Voice List Retrieval', 'success', `Found ${voices.length} voices available`, Date.now() - startTime4);
    } catch (error) {
      updateTestResult('Voice List Retrieval', 'error', `Failed to fetch voices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 5: Alex Voice Generation
    setCurrentTest('Alex Voice Generation');
    updateTestResult('Alex Voice Generation', 'pending', 'Generating Alex voice sample...');
    
    const startTime5 = Date.now();
    try {
      const alexAudio = await elevenLabsService.generateAlexSpeech("Hello! I'm Alex, your AI discussion host. This is a test of my voice.");
      updateTestResult('Alex Voice Generation', 'success', `Generated ${alexAudio.byteLength} bytes of audio`, Date.now() - startTime5);
    } catch (error) {
      updateTestResult('Alex Voice Generation', 'error', `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 6: Jordan Voice Generation
    setCurrentTest('Jordan Voice Generation');
    updateTestResult('Jordan Voice Generation', 'pending', 'Generating Jordan voice sample...');
    
    const startTime6 = Date.now();
    try {
      const jordanAudio = await elevenLabsService.generateJordanSpeech("Hi there! I'm Jordan, your other AI host. Let's test my voice capabilities.");
      updateTestResult('Jordan Voice Generation', 'success', `Generated ${jordanAudio.byteLength} bytes of audio`, Date.now() - startTime6);
    } catch (error) {
      updateTestResult('Jordan Voice Generation', 'error', `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setCurrentTest('');
    setIsRunning(false);
  };

  const testAlexVoice = () => {
    speak("Hello! I'm Alex, your AI discussion host. This is a test of my voice generation capabilities.", 'alex');
  };

  const testJordanVoice = () => {
    speak("Hi there! I'm Jordan, your other AI host. Let's test how my voice sounds in a real conversation.", 'jordan');
  };

  const testConversation = () => {
    speak("Welcome to our AI discussion platform! I'm Alex.", 'alex');
    setTimeout(() => {
      speak("And I'm Jordan! Together, we'll guide you through engaging conversations.", 'jordan');
    }, 3000);
    setTimeout(() => {
      speak("We're excited to demonstrate our voice capabilities and help facilitate meaningful discussions.", 'alex');
    }, 6000);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6">
          <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
            <SpeakerWaveIcon className="h-8 w-8 mr-3 text-blue-500" />
            ElevenLabs Voice AI Test Suite
          </h1>

          {/* Test Controls */}
          <div className="mb-8 flex flex-wrap gap-4">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-md flex items-center"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Running Tests...
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Run All Tests
                </>
              )}
            </button>

            <button
              onClick={testAlexVoice}
              disabled={!isAvailable || voiceState.isLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Test Alex Voice
            </button>

            <button
              onClick={testJordanVoice}
              disabled={!isAvailable || voiceState.isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Test Jordan Voice
            </button>

            <button
              onClick={testConversation}
              disabled={!isAvailable || voiceState.isLoading}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Test Conversation
            </button>

            {voiceState.isPlaying && (
              <button
                onClick={stopAudio}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <StopIcon className="h-4 w-4 mr-2" />
                Stop Audio
              </button>
            )}
          </div>

          {/* Voice Status */}
          {(voiceState.isLoading || voiceState.isPlaying || voiceState.error) && (
            <div className="mb-6 p-4 bg-gray-700 rounded-md">
              <h3 className="text-white font-semibold mb-2">Voice Status</h3>
              {voiceState.isLoading && (
                <div className="text-blue-400 flex items-center">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2" />
                  Generating speech...
                </div>
              )}
              {voiceState.isPlaying && (
                <div className="text-green-400 flex items-center">
                  <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse mr-2" />
                  {voiceState.currentSpeaker === 'alex' ? 'Alex' : 'Jordan'} is speaking
                </div>
              )}
              {voiceState.error && (
                <div className="text-red-400">
                  Error: {voiceState.error}
                </div>
              )}
            </div>
          )}

          {/* Current Test */}
          {currentTest && (
            <div className="mb-6 p-4 bg-blue-900 rounded-md">
              <div className="text-blue-200 flex items-center">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2" />
                Currently running: {currentTest}
              </div>
            </div>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Test Results</h2>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-md border-l-4 ${
                    result.status === 'success'
                      ? 'bg-green-900 border-green-500'
                      : result.status === 'error'
                      ? 'bg-red-900 border-red-500'
                      : 'bg-blue-900 border-blue-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(result.status)}
                      <span className="ml-3 font-semibold text-white">
                        {result.test}
                      </span>
                    </div>
                    {result.duration && (
                      <span className="text-gray-400 text-sm">
                        {result.duration}ms
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-gray-300">{result.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Configuration Info */}
          <div className="mt-8 p-4 bg-gray-700 rounded-md">
            <h3 className="text-white font-semibold mb-2">Configuration</h3>
            <div className="text-gray-300 space-y-1">
              <p><strong>API Available:</strong> {isAvailable ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Alex Voice ID:</strong> {HOST_VOICES.alex.voice_id}</p>
              <p><strong>Jordan Voice ID:</strong> {HOST_VOICES.jordan.voice_id}</p>
              <p><strong>API Key Status:</strong> {elevenLabsService.isAvailable() ? '✅ Configured' : '❌ Missing'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
