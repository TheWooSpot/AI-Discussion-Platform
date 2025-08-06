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
  const [animatingMessageId, setAnimatingMessageId] = useState<string | null>(null);
  const [animatedText, setAnimatedText] = useState<string>('');

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
      setIsPlaying(false);
      setIsTimerActive(false);
      setCurrentSpeaker(null);
      setDebugInfo('Discussion completed');
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
  }, [currentAudioIndex, audioQueue, isPlaying]);

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