import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PlayIcon, PauseIcon, MicrophoneIcon } from '@heroicons/react/24/solid';
import { geminiService } from '../services/gemini';
import { useVoiceProvider } from '../hooks/useVoiceProvider';

interface Discussion {
  id: string;
  title: string;
  description: string;
  category: string;
  participants: number;
  duration: string;
  status: 'live' | 'upcoming' | 'completed';
  color: string;
}

const discussions: Discussion[] = [
  {
    id: '1',
    title: 'The Future of Artificial Intelligence',
    description: 'Exploring the potential impacts and ethical considerations of AI advancement',
    category: 'Technology',
    participants: 1247,
    duration: '45 min',
    status: 'live',
    color: 'blue'
  },
  {
    id: '2',
    title: 'Climate Change Solutions',
    description: 'Innovative approaches to combat global warming',
    category: 'Environment',
    participants: 892,
    duration: '30 min',
    status: 'upcoming',
    color: 'green'
  },
  {
    id: '3',
    title: 'Space Exploration Breakthroughs',
    description: 'Recent discoveries and future missions',
    category: 'Science',
    participants: 654,
    duration: '40 min',
    status: 'live',
    color: 'purple'
  }
];

const DiscussionPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const { currentProvider, providerType } = useVoiceProvider();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(12 * 60);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [currentSpeaker, setCurrentSpeaker] = useState<'alex' | 'jordan' | null>(null);
  const [audioQueue, setAudioQueue] = useState<HTMLAudioElement[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number>(0);

  const discussion = discussions.find(d => d.id === topicId) || discussions[0];

  const bulletPoints: string[] = [
    'AI ethics and responsible development',
    'Impact on employment and job markets',
    'Healthcare applications and breakthroughs',
    'Privacy and data security concerns',
    'Future of human-AI collaboration'
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = (): string => {
    const percentage = (timeLeft / (12 * 60)) * 100;
    if (percentage > 66) return 'bg-green-500';
    if (percentage > 33) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Technology': 'text-blue-400',
      'Environment': 'text-green-400',
      'Science': 'text-purple-400',
      'Business': 'text-orange-400',
      'Health': 'text-pink-400',
      'Finance': 'text-yellow-400'
    };
    return colors[category] || 'text-gray-400';
  };

  const createAudioElement = (blob: Blob): HTMLAudioElement => {
    if (providerType === 'webspeech') {
      // Handle Web Speech API blobs
      const audio = new Audio();
      
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          if (data.type === 'web-speech') {
            const utterance = new SpeechSynthesisUtterance(data.text);
            
            // Find the appropriate voice
            const voices = speechSynthesis.getVoices();
            const voice = voices.find(v => v.name === data.voice) || voices[0];
            if (voice) utterance.voice = voice;
            
            utterance.rate = data.rate;
            utterance.pitch = data.pitch;
            utterance.volume = data.volume;
            
            // Override play method to use speech synthesis
            audio.play = async () => {
              console.log(`🔊 Playing Web Speech: ${data.text.substring(0, 50)}...`);
              speechSynthesis.speak(utterance);
              return Promise.resolve();
            };
            
            audio.pause = () => {
              speechSynthesis.cancel();
            };
            
            // Simulate audio events
            utterance.onstart = () => {
              audio.dispatchEvent(new Event('play'));
            };
            
            utterance.onend = () => {
              audio.dispatchEvent(new Event('ended'));
            };
            
            utterance.onerror = () => {
              audio.dispatchEvent(new Event('error'));
            };
          }
        } catch (error) {
          console.error('Error parsing Web Speech blob:', error);
        }
      };
      
      reader.readAsText(blob);
      return audio;
    } else {
      // Handle ElevenLabs blobs normally
      console.log('🔊 Creating ElevenLabs audio element');
      const audioUrl = URL.createObjectURL(blob);
      return new Audio(audioUrl);
    }
  };

  const playNextAudio = async (): Promise<void> => {
    if (currentAudioIndex >= audioQueue.length) {
      setIsPlaying(false);
      setCurrentAudio(null);
      setIsTimerActive(false);
      setCurrentSpeaker(null);
      setDebugInfo('Discussion completed');
      return;
    }

    const audio = audioQueue[currentAudioIndex];
    const speaker = currentAudioIndex % 2 === 0 ? 'alex' : 'jordan';
    
    setCurrentSpeaker(speaker);
    setDebugInfo(`Playing ${speaker} - segment ${currentAudioIndex + 1}/${audioQueue.length} (${providerType})`);
    
    audio.onended = () => {
      setCurrentAudioIndex(prev => prev + 1);
    };

    audio.onerror = () => {
      setError(`Audio playback failed for ${speaker}`);
      setIsPlaying(false);
      setIsTimerActive(false);
    };

    try {
      await audio.play();
      setCurrentAudio(audio);
    } catch (error) {
      console.error('Error playing audio:', error);
      setError('Audio playback failed');
      setIsPlaying(false);
      setIsTimerActive(false);
    }
  };

  useEffect(() => {
    if (isPlaying && audioQueue.length > 0) {
      playNextAudio();
    }
  }, [currentAudioIndex, audioQueue, isPlaying]);

  const handlePlayPause = async (): Promise<void> => {
    console.log(`🎯 DISCUSSION START - Provider: ${providerType}, Name: ${currentProvider.getProviderName()}`);
    setDebugInfo(`Starting with ${currentProvider.getProviderName()}...`);
    setError('');

    if (isPlaying) {
      console.log('⏸️ Pausing discussion');
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }
      if (providerType === 'webspeech') {
        speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setIsTimerActive(false);
      setCurrentSpeaker(null);
      setDebugInfo('Discussion paused');
      return;
    }

    setIsGenerating(true);
    setIsTimerActive(true);
    setCurrentAudioIndex(0);
    setAudioQueue([]);
    
    try {
      console.log('🤖 Generating content with Gemini...');
      const response = await geminiService.generateDiscussion(discussion.title, discussion.description);
      console.log('✅ Gemini response received');
      setDebugInfo(`Content generated, creating speech with ${currentProvider.getProviderName()}...`);
      
      console.log(`🎤 Converting to speech with ${currentProvider.getProviderName()}...`);
      const audioBlobs = await currentProvider.generateDiscussionAudio(response);
      console.log(`✅ Generated ${audioBlobs.length} audio segments with ${providerType}`);
      setDebugInfo(`Speech generated for ${audioBlobs.length} segments, preparing playback...`);
      
      console.log('🔊 Creating audio elements...');
      const audioElements = audioBlobs.map(blob => createAudioElement(blob));
      
      setAudioQueue(audioElements);
      setIsPlaying(true);
      setDebugInfo(`Starting discussion with ${currentProvider.getProviderName()}...`);
      
    } catch (error) {
      console.error('❌ Error in discussion generation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed: ${errorMessage}`);
      setDebugInfo(`Error: ${errorMessage}`);
      setIsTimerActive(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold mb-4">Discussion Points</h3>
              <ul className="space-y-3">
                {bulletPoints.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-300 text-sm">{point}</span>
                  </li>
                ))}
              </ul>
              
              {/* Timer */}
              <div className="mt-8 p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Time Remaining</span>
                  <span className="text-lg font-mono">{formatTime(timeLeft)}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor()}`}
                    style={{ width: `${(timeLeft / (12 * 60)) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Debug Panel */}
              <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                <h4 className="text-sm font-semibold mb-2 text-yellow-400">Debug Info</h4>
                <div className="text-xs text-gray-300 space-y-1">
                  <div className="font-semibold text-green-400">Active Provider: {currentProvider.getProviderName()}</div>
                  <div>Provider Type: {providerType}</div>
                  <div>Status: {debugInfo || 'Ready'}</div>
                  {error && <div className="text-red-400">Error: {error}</div>}
                  <div>Generating: {isGenerating ? 'Yes' : 'No'}</div>
                  <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
                  <div>Current Speaker: {currentSpeaker || 'None'}</div>
                  <div>Audio Queue: {audioQueue.length} segments</div>
                  <div>Current Segment: {currentAudioIndex + 1}/{audioQueue.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Discussion Header */}
            <div className="bg-gray-800 rounded-lg p-8 mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gray-700 ${getCategoryColor(discussion.category)}`}>
                  {discussion.category}
                </span>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>{discussion.participants.toLocaleString()} participants</span>
                  <span>{discussion.duration}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    discussion.status === 'live' ? 'bg-red-600 text-white' : 
                    discussion.status === 'upcoming' ? 'bg-yellow-600 text-white' : 
                    'bg-gray-600 text-gray-300'
                  }`}>
                    {discussion.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <h1 className={`text-3xl font-bold mb-4 ${getCategoryColor(discussion.category)}`}>
                {discussion.title}
              </h1>
              
              <p className="text-gray-300 text-lg mb-6">
                {discussion.description}
              </p>

              {/* Play Controls */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePlayPause}
                  disabled={isGenerating}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    isGenerating 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : isPlaying 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : isPlaying ? (
                    <>
                      <PauseIcon className="h-5 w-5" />
                      <span>Pause Discussion</span>
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-5 w-5" />
                      <span>Start Discussion ({providerType})</span>
                    </>
                  )}
                </button>

                <button className="flex items-center space-x-2 px-4 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors">
                  <MicrophoneIcon className="h-5 w-5" />
                  <span>Join Discussion</span>
                </button>
              </div>
            </div>

            {/* Discussion Theater */}
            <div className="bg-gray-800 rounded-lg p-8">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <div className={`w-16 h-16 rounded-full ${isPlaying ? 'animate-pulse bg-white' : 'bg-gray-300'}`}></div>
                </div>
                
                <h2 className="text-2xl font-bold mb-4">AI Discussion Theater</h2>
                
                {isPlaying ? (
                  <div className="space-y-4">
                    <p className="text-lg text-blue-400">🎙️ Discussion in progress with {currentProvider.getProviderName()}</p>
                    <div className="flex justify-center space-x-8">
                      <div className="text-center">
                        <div className={`w-12 h-12 rounded-full mb-2 ${
                          currentSpeaker === 'alex' 
                            ? 'bg-blue-500 animate-pulse' 
                            : 'bg-gray-600'
                        }`}></div>
                        <p className={`text-sm ${
                          currentSpeaker === 'alex' ? 'text-blue-400 font-semibold' : 'text-gray-400'
                        }`}>Alex</p>
                      </div>
                      <div className="text-center">
                        <div className={`w-12 h-12 rounded-full mb-2 ${
                          currentSpeaker === 'jordan' 
                            ? 'bg-purple-500 animate-pulse' 
                            : 'bg-gray-600'
                        }`}></div>
                        <p className={`text-sm ${
                          currentSpeaker === 'jordan' ? 'text-purple-400 font-semibold' : 'text-gray-400'
                        }`}>Jordan</p>
                      </div>
                    </div>
                    {currentSpeaker && (
                      <p className="text-sm text-gray-300">
                        {currentSpeaker === 'alex' ? 'Alex' : 'Jordan'} is speaking...
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-400">Click "Start Discussion" to begin the AI-powered conversation</p>
                    <p className="text-sm text-blue-400">Using: {currentProvider.getProviderName()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionPage;
