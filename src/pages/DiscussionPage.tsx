import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PlayIcon, PauseIcon, MicrophoneIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
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

interface AudioItem {
  type: 'elevenlabs' | 'webspeech';
  audio?: HTMLAudioElement;
  utterance?: SpeechSynthesisUtterance;
  speaker: 'alex' | 'jordan';
  text: string;
}

interface ChatMessage {
  id: string;
  speaker: 'alex' | 'jordan' | 'user';
  text: string;
  timestamp: Date;
  userName?: string;
}

const DiscussionPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const { currentProvider, providerType } = useVoiceProvider();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(12 * 60);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [currentSpeaker, setCurrentSpeaker] = useState<'alex' | 'jordan' | null>(null);
  const [audioQueue, setAudioQueue] = useState<AudioItem[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number>(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [showNamePrompt, setShowNamePrompt] = useState<boolean>(true);
  const [tempUserName, setTempUserName] = useState<string>('');

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

  const createWebSpeechUtterance = (text: string, speaker: 'alex' | 'jordan'): SpeechSynthesisUtterance => {
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get available voices
    const voices = speechSynthesis.getVoices();
    
    // Select voice based on speaker
    let selectedVoice: SpeechSynthesisVoice | null = null;
    
    if (speaker === 'alex') {
      selectedVoice = 
        voices.find(voice => voice.name.includes('Microsoft David')) ||
        voices.find(voice => voice.name.includes('David')) ||
        voices.find(voice => voice.name.toLowerCase().includes('male')) ||
        voices.find(voice => voice.name.includes('Alex')) ||
        voices.find(voice => voice.gender === 'male') ||
        voices[0];
    } else {
      selectedVoice = 
        voices.find(voice => voice.name.includes('Microsoft Zira')) ||
        voices.find(voice => voice.name.includes('Zira')) ||
        voices.find(voice => voice.name.toLowerCase().includes('female')) ||
        voices.find(voice => voice.name.includes('Samantha')) ||
        voices.find(voice => voice.gender === 'female') ||
        voices[1] || voices[0];
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log(`🎤 Selected voice: ${selectedVoice.name} for ${speaker}`);
    }
    
    // Configure speech parameters
    utterance.rate = speaker === 'alex' ? 0.9 : 1.0;
    utterance.pitch = speaker === 'alex' ? 0.8 : 1.2;
    utterance.volume = 1.0;
    
    return utterance;
  };

  const createAudioItem = async (blob: Blob, speaker: 'alex' | 'jordan', text: string): Promise<AudioItem> => {
    if (providerType === 'webspeech') {
      // For Web Speech, create utterance directly
      console.log(`🔊 Creating Web Speech utterance for ${speaker}`);
      const utterance = createWebSpeechUtterance(text, speaker);
      
      return {
        type: 'webspeech',
        utterance,
        speaker,
        text
      };
    } else {
      // For ElevenLabs, create audio element
      console.log(`🔊 Creating ElevenLabs audio element for ${speaker}`);
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      return {
        type: 'elevenlabs',
        audio,
        speaker,
        text
      };
    }
  };

  const addChatMessage = (speaker: 'alex' | 'jordan', text: string): void => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      speaker,
      text,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, message]);
  };

  const playNextAudio = async (): Promise<void> => {
    if (currentAudioIndex >= audioQueue.length) {
      // Check if we should continue the main discussion
      if (audioQueue.length > 0) {
        setDebugInfo('Segment completed, discussion continues...');
        // Don't stop the discussion, just wait for more segments or user input
      } else {
        setIsPlaying(false);
        setIsTimerActive(false);
        setCurrentSpeaker(null);
        setDebugInfo('Discussion completed');
      }
      return;
    }

    const audioItem = audioQueue[currentAudioIndex];
    const speaker = audioItem.speaker;
    
    setCurrentSpeaker(speaker);
    setDebugInfo(`Playing ${speaker} - segment ${currentAudioIndex + 1}/${audioQueue.length} (${providerType})`);
    
    // Add message to chat
    addChatMessage(speaker, audioItem.text);
    
    try {
      if (audioItem.type === 'webspeech' && audioItem.utterance) {
        // Handle Web Speech API
        console.log(`🔊 Playing Web Speech for ${speaker}: ${audioItem.text.substring(0, 50)}...`);
        
        const utterance = audioItem.utterance;
        
        utterance.onstart = () => {
          console.log(`🔊 Web Speech started for ${speaker}`);
        };
        
        utterance.onend = () => {
          console.log(`✅ Web Speech completed for ${speaker}`);
          setCurrentAudioIndex(prev => prev + 1);
        };
        
        utterance.onerror = (event) => {
          console.error(`❌ Web Speech error for ${speaker}:`, event.error);
          setError(`Web Speech error: ${event.error}`);
          setIsPlaying(false);
          setIsTimerActive(false);
        };
        
        // Cancel any existing speech and start new one
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
        
      } else if (audioItem.type === 'elevenlabs' && audioItem.audio) {
        // Handle ElevenLabs audio
        console.log(`🔊 Playing ElevenLabs audio for ${speaker}`);
        
        const audio = audioItem.audio;
        
        audio.onended = () => {
          setCurrentAudioIndex(prev => prev + 1);
        };

        audio.onerror = () => {
          setError(`Audio playback failed for ${speaker}`);
          setIsPlaying(false);
          setIsTimerActive(false);
        };

        await audio.play();
      }
      
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

  const parseDiscussion = (text: string): Array<{speaker: 'alex' | 'jordan', text: string}> => {
    const segments: Array<{speaker: 'alex' | 'jordan', text: string}> = [];
    
    // Split by common speaker indicators
    const lines = text.split('\n').filter(line => line.trim());
    let currentSpeaker: 'alex' | 'jordan' = 'alex';
    let currentText = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for speaker indicators
      if (trimmedLine.toLowerCase().includes('alex:') || 
          trimmedLine.toLowerCase().includes('alex ') ||
          trimmedLine.toLowerCase().startsWith('alex')) {
        
        // Save previous segment if exists
        if (currentText.trim()) {
          segments.push({ speaker: currentSpeaker, text: currentText.trim() });
        }
        
        currentSpeaker = 'alex';
        currentText = trimmedLine.replace(/^alex:?\s*/i, '');
        
      } else if (trimmedLine.toLowerCase().includes('jordan:') || 
                 trimmedLine.toLowerCase().includes('jordan ') ||
                 trimmedLine.toLowerCase().startsWith('jordan')) {
        
        // Save previous segment if exists
        if (currentText.trim()) {
          segments.push({ speaker: currentSpeaker, text: currentText.trim() });
        }
        
        currentSpeaker = 'jordan';
        currentText = trimmedLine.replace(/^jordan:?\s*/i, '');
        
      } else {
        // Continue with current speaker
        currentText += ' ' + trimmedLine;
      }
    }

    // Add final segment
    if (currentText.trim()) {
      segments.push({ speaker: currentSpeaker, text: currentText.trim() });
    }

    // If no clear separation found, alternate speakers by paragraph
    if (segments.length <= 1) {
      const paragraphs = text.split('\n\n').filter(p => p.trim());
      return paragraphs.map((paragraph, index) => ({
        speaker: index % 2 === 0 ? 'alex' : 'jordan',
        text: paragraph.trim()
      }));
    }

    return segments;
  };

  const handlePlayPause = async (): Promise<void> => {
    console.log(`🎯 DISCUSSION START - Provider: ${providerType}, Name: ${currentProvider.getProviderName()}`);
    setDebugInfo(`Starting with ${currentProvider.getProviderName()}...`);
    setError('');

    if (isPlaying) {
      console.log('⏸️ Pausing discussion');
      
      // Stop current audio based on type
      if (audioQueue[currentAudioIndex]?.type === 'webspeech') {
        speechSynthesis.cancel();
      } else if (audioQueue[currentAudioIndex]?.audio) {
        audioQueue[currentAudioIndex].audio!.pause();
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
    setChatMessages([]);
    
    try {
      console.log('🤖 Generating content with Gemini...');
      const response = await geminiService.generateDiscussion(discussion.title, discussion.description);
      console.log('✅ Gemini response received');
      setDebugInfo(`Content generated, creating speech with ${currentProvider.getProviderName()}...`);
      
      // Parse discussion into segments
      const segments = parseDiscussion(response);
      console.log(`📝 Parsed ${segments.length} discussion segments`);
      
      if (providerType === 'webspeech') {
        // For Web Speech, create utterances directly
        console.log('🎤 Creating Web Speech utterances...');
        const audioItems: AudioItem[] = [];
        
        for (const segment of segments) {
          const audioItem = await createAudioItem(new Blob(), segment.speaker, segment.text);
          audioItems.push(audioItem);
        }
        
        setAudioQueue(audioItems);
        console.log(`✅ Created ${audioItems.length} Web Speech utterances`);
        
      } else {
        // For ElevenLabs, generate audio blobs
        console.log(`🎤 Converting to speech with ${currentProvider.getProviderName()}...`);
        const audioBlobs = await currentProvider.generateDiscussionAudio(response);
        console.log(`✅ Generated ${audioBlobs.length} audio segments with ${providerType}`);
        
        const audioItems: AudioItem[] = [];
        for (let i = 0; i < audioBlobs.length && i < segments.length; i++) {
          const audioItem = await createAudioItem(audioBlobs[i], segments[i].speaker, segments[i].text);
          audioItems.push(audioItem);
        }
        
        setAudioQueue(audioItems);
      }
      
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

  const handleUserInputSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (userInput.trim()) {
      handleUserMessage(userInput.trim());
      setUserInput('');
    }
  };

  const handleUserMessage = async (message: string): Promise<void> => {
    console.log('👤 User message received:', message);
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      speaker: 'user',
      text: message,
      timestamp: new Date(),
      userName: userName
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    // Pause any ongoing discussion to address user input
    if (isPlaying) {
      if (audioQueue[currentAudioIndex]?.type === 'webspeech') {
        speechSynthesis.cancel();
      } else if (audioQueue[currentAudioIndex]?.audio) {
        audioQueue[currentAudioIndex].audio!.pause();
      }
      setIsPlaying(false);
      setIsTimerActive(false);
      setCurrentSpeaker(null);
    }
    
    // Generate integrated discussion response that weaves in user comment
    if (isPlaying) {
      if (audioQueue[currentAudioIndex]?.type === 'webspeech') {
        speechSynthesis.cancel();
      } else if (audioQueue[currentAudioIndex]?.audio) {
        audioQueue[currentAudioIndex].audio!.pause();
      }
      setIsPlaying(false);
      setIsTimerActive(false);
      setCurrentSpeaker(null);
    }
    
    // Generate integrated discussion response that weaves in user comment
    try {
      setIsGenerating(true);
      setDebugInfo('Integrating user comment into discussion...');
      
      // Generate integrated discussion that acknowledges user but continues main topic
      const prompt = `You are hosting a discussion about "${discussion.title}" - ${discussion.description}. Two AI moderators Alex and Jordan are having an ongoing conversation when participant ${userName} contributes: "${message}"
      
      Create a natural discussion segment where:
      1. ONE moderator (Alex OR Jordan) briefly acknowledges ${userName}'s comment and connects it to the main topic
      2. BOTH moderators then continue the discussion about "${discussion.title}", incorporating ${userName}'s perspective as a springboard
      3. The conversation should flow naturally back to the main topic while honoring ${userName}'s input
      4. Keep the discussion moving forward on the original agenda
      
      Format with clear speaker labels and make it feel like a continuous conversation:
      
      Alex: [Brief acknowledgment of ${userName}'s point, then transitions back to main topic with their perspective]
      
      Jordan: [Builds on Alex's point about the main topic, may reference ${userName}'s insight, then advances the discussion further]
      
      Alex: [Continues the main discussion thread, keeping momentum going]
      
      Make it feel like the discussion naturally continues rather than ending after addressing ${userName}.`;
      
      const response = await geminiService.generateContent(prompt);
      
      // Parse the response to get both Alex and Jordan's parts
      const segments = parseDiscussion(response);
      
      // Ensure we have multiple segments for continued discussion
      if (segments.length < 2) {
        // If parsing failed, create a simple acknowledgment and continuation
        segments.push(
          { speaker: 'alex', text: `Thanks for that insight, ${userName}. That's a really interesting perspective on ${discussion.title}. Let me build on that point...` },
          { speaker: 'jordan', text: `Absolutely, Alex. ${userName}'s comment really highlights an important aspect of our discussion. This connects well to what we were exploring about ${discussion.description}...` }
        );
      }
      
      // Add segments to audio queue for continuous playback
      const newAudioItems: AudioItem[] = [];
      
      for (const segment of segments) {
        if (providerType === 'webspeech') {
          const audioItem = await createAudioItem(new Blob(), segment.speaker, segment.text);
          newAudioItems.push(audioItem);
        } else {
          const audioBlob = await currentProvider.generateSpeech(segment.text, segment.speaker);
          const audioItem = await createAudioItem(audioBlob, segment.speaker, segment.text);
          newAudioItems.push(audioItem);
        }
      }
      
      // Add to existing audio queue to continue discussion
      setAudioQueue(prev => [...prev, ...newAudioItems]);
      
      // Start playing if not already playing
      if (!isPlaying) {
        setIsPlaying(true);
        setIsTimerActive(true);
        setCurrentAudioIndex(audioQueue.length); // Start from the new segments
      }
      
      setDebugInfo(`Integrated ${userName}'s comment, discussion continuing with ${segments.length} new segments`);
      
    } catch (error) {
      console.error('Failed to integrate user comment:', error);
      setError('Failed to integrate your comment into the discussion');
      setDebugInfo('Error integrating user comment');
    } finally {
      setIsGenerating(false);
    }
  };
      // Add both moderator responses to chat
      for (const segment of segments) {
        const moderatorMessage: ChatMessage = {
          id: (Date.now() + Math.random()).toString(),
          speaker: segment.speaker,
          text: segment.text,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, moderatorMessage]);
      }
  };

  const handleNameSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (tempUserName.trim()) {
      setUserName(tempUserName.trim());
      setShowNamePrompt(false);
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

            {/* Chat Bubbles Area */}
            <div className="bg-gray-800 rounded-lg p-8">
              {/* Name Prompt Modal */}
              {showNamePrompt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
                    <h2 className="text-2xl font-bold mb-4 text-center">Welcome to the Discussion!</h2>
                    <p className="text-gray-300 mb-6 text-center">
                      Please enter your name to join the conversation with Alex and Jordan about "{discussion.title}".
                    </p>
                    <form onSubmit={handleNameSubmit}>
                      <input
                        type="text"
                        value={tempUserName}
                        onChange={(e) => setTempUserName(e.target.value)}
                        placeholder="Enter your name..."
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                        autoFocus
                        maxLength={50}
                      />
                      <button
                        type="submit"
                        disabled={!tempUserName.trim()}
                        className={`w-full py-3 rounded-lg font-medium transition-colors ${
                          tempUserName.trim()
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Join Discussion
                      </button>
                    </form>
                  </div>
                </div>
              )}

              <div className="h-96 overflow-y-auto mb-4 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-32">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                      <div className={`w-16 h-16 rounded-full ${isPlaying ? 'animate-pulse bg-white' : 'bg-gray-300'}`}></div>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">AI Discussion Chamber</h2>
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
                        <p className="text-gray-400">Or type a message below to join the conversation!</p>
                        <p className="text-sm text-blue-400">Using: {currentProvider.getProviderName()}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((message) => (
                      <div key={message.id} className="grid grid-cols-3 gap-4 items-start">
                        {/* Alex Column */}
                        <div className="flex justify-start">
                          {message.speaker === 'alex' && (
                            <div className="max-w-full px-4 py-3 rounded-lg bg-blue-600 text-white">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                                <span className="text-xs font-semibold">Alex</span>
                                <span className="text-xs text-blue-200">
                                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed">{message.text}</p>
                            </div>
                          )}
                        </div>

                        {/* User Column */}
                        <div className="flex justify-center">
                          {message.speaker === 'user' && (
                            <div className="max-w-full px-4 py-3 rounded-lg bg-green-600 text-white">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-3 h-3 rounded-full bg-green-300"></div>
                                <span className="text-xs font-semibold">{message.userName || 'You'}</span>
                                <span className="text-xs text-green-200">
                                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed">{message.text}</p>
                            </div>
                          )}
                        </div>

                        {/* Jordan Column */}
                        <div className="flex justify-end">
                          {message.speaker === 'jordan' && (
                            <div className="max-w-full px-4 py-3 rounded-lg bg-purple-600 text-white">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-3 h-3 rounded-full bg-purple-300"></div>
                                <span className="text-xs font-semibold">Jordan</span>
                                <span className="text-xs text-purple-200">
                                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed">{message.text}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User Input Text Box */}
              {!showNamePrompt && (
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{userName.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-sm text-gray-300">Chatting as <strong>{userName}</strong></span>
                  </div>
                  <form onSubmit={handleUserInputSubmit} className="flex space-x-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder={`${userName}, share your thoughts on this topic...`}
                      className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      disabled={isGenerating}
                    />
                    <button
                      type="submit"
                      disabled={!userInput.trim() || isGenerating}
                      className={`px-4 py-3 rounded-lg transition-colors ${
                        userInput.trim() && !isGenerating
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isGenerating ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <PaperAirplaneIcon className="h-5 w-5" />
                      )}
                    </button>
                  </form>
                  {isGenerating && (
                    <div className="mt-2 text-sm text-yellow-400 flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400 mr-2"></div>
                      AI moderator is preparing a response...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionPage;
