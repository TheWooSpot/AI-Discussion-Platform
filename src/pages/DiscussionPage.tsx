import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, PaperAirplaneIcon, MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { geminiService } from '../services/gemini';
import { useVoiceProvider } from '../hooks/useVoiceProvider';

interface Message {
  id: string;
  speaker: 'alex' | 'jordan' | 'user';
  text: string;
  timestamp: Date;
  userName?: string;
}

interface QueuedComment {
  id: string;
  text: string;
  userName: string;
  timestamp: Date;
}

const DiscussionPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const { currentProvider, providerType } = useVoiceProvider();
  
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [userName, setUserName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [error, setError] = useState<string>('');
  const [discussionStarted, setDiscussionStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [commentQueue, setCommentQueue] = useState<QueuedComment[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Mock discussion topics
  const discussionTopics: { [key: string]: { title: string; description: string } } = {
    '1': {
      title: 'The Future of Artificial Intelligence',
      description: 'Exploring the potential impacts and ethical considerations of advanced AI systems.'
    },
    '2': {
      title: 'Climate Change Solutions',
      description: 'Discussing innovative approaches to combat climate change and environmental challenges.'
    },
    '3': {
      title: 'Space Exploration and Colonization',
      description: 'The possibilities and challenges of human expansion beyond Earth.'
    }
  };

  const currentTopic = discussionTopics[topicId || '1'] || discussionTopics['1'];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Process comment queue
  useEffect(() => {
    const processQueue = async () => {
      if (commentQueue.length > 0 && !isProcessingQueue && !isPlaying) {
        setIsProcessingQueue(true);
        const nextComment = commentQueue[0];
        
        try {
          await handleUserComment(nextComment.text, nextComment.userName);
          setCommentQueue(prev => prev.slice(1));
        } catch (error) {
          console.error('Error processing queued comment:', error);
          setError('Failed to process comment');
        } finally {
          setIsProcessingQueue(false);
        }
      }
    };

    processQueue();
  }, [commentQueue, isProcessingQueue, isPlaying]);

  const addToQueue = (text: string, userName: string) => {
    const queuedComment: QueuedComment = {
      id: Date.now().toString(),
      text,
      userName,
      timestamp: new Date()
    };
    
    setCommentQueue(prev => [...prev, queuedComment]);
    console.log(`📝 Added comment to queue. Queue length: ${commentQueue.length + 1}`);
  };

  const playWebSpeech = async (text: string, speaker: 'alex' | 'jordan'): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log(`🔊 Playing Web Speech for ${speaker}: ${text.substring(0, 50)}...`);
      
      // Cancel any existing speech
      speechSynthesis.cancel();
      
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
      }
      
      // Configure speech parameters
      utterance.rate = speaker === 'alex' ? 0.9 : 1.0;
      utterance.pitch = speaker === 'alex' ? 0.8 : 1.2;
      utterance.volume = 1.0;
      
      // Set up event handlers
      utterance.onstart = () => {
        setIsPlaying(true);
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        resolve();
      };
      
      utterance.onerror = (event) => {
        if (event.error === 'interrupted') {
          return;
        }
        setIsPlaying(false);
        setError(`Web Speech error: ${event.error}`);
        reject(new Error(`Web Speech error: ${event.error}`));
      };
      
      // Start speaking
      speechSynthesis.speak(utterance);
    });
  };

  const playAudioSegment = async (audioBlob: Blob, speaker: 'alex' | 'jordan'): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log(`🔊 Playing audio segment for ${speaker}`);
      
      if (providerType === 'webspeech') {
        // Handle Web Speech API
        audioBlob.text().then(speechDataStr => {
          const speechData = JSON.parse(speechDataStr);
          playWebSpeech(speechData.text, speaker).then(resolve).catch(reject);
        }).catch(reject);
      } else {
        // Handle other providers (ElevenLabs, OpenAI, etc.)
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onplay = () => {
          setIsPlaying(true);
        };
        
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentAudio(null);
          audioRef.current = null;
          resolve();
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          setCurrentAudio(null);
          audioRef.current = null;
          setError(`Audio playback failed for ${speaker}`);
          reject(new Error(`Audio playback failed for ${speaker}`));
        };

        setCurrentAudio(audio);
        audioRef.current = audio;
        audio.play().catch(reject);
      }
    });
  };

  const startDiscussion = async (): Promise<void> => {
    if (isPlaying || isProcessingQueue) {
      console.log('⏸️ Cannot start discussion - audio is playing or queue is processing');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      console.log('🎯 Starting discussion generation...');
      const discussionText = await geminiService.generateDiscussion(
        currentTopic.title,
        currentTopic.description
      );
      
      console.log('✅ Discussion text generated');
      console.log('🎤 Generating audio with provider:', providerType);
      
      const audioSegments = await currentProvider.generateDiscussionAudio(discussionText);
      console.log(`🎵 Generated ${audioSegments.length} audio segments`);
      
      // Parse discussion to create message bubbles
      const discussionMessages = parseDiscussionToMessages(discussionText);
      setMessages(discussionMessages);
      
      // Play audio segments sequentially
      for (let i = 0; i < audioSegments.length; i++) {
        const segment = audioSegments[i];
        const message = discussionMessages[i];
        
        if (message) {
          console.log(`🔊 Playing segment ${i + 1}/${audioSegments.length} for ${message.speaker}`);
          await playAudioSegment(segment, message.speaker as 'alex' | 'jordan');
          
          // Small pause between segments for natural flow
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setDiscussionStarted(true);
      console.log('✅ Discussion completed successfully');
      
    } catch (error) {
      console.error('❌ Error in discussion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to generate discussion: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const parseDiscussionToMessages = (discussionText: string): Message[] => {
    const messages: Message[] = [];
    const lines = discussionText.split('\n').filter(line => line.trim());
    let currentSpeaker: 'alex' | 'jordan' = 'alex';
    let currentText = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.toLowerCase().includes('alex:') || 
          trimmedLine.toLowerCase().startsWith('alex')) {
        
        if (currentText.trim()) {
          messages.push({
            id: Date.now().toString() + Math.random(),
            speaker: currentSpeaker,
            text: currentText.trim(),
            timestamp: new Date()
          });
        }
        
        currentSpeaker = 'alex';
        currentText = trimmedLine.replace(/^alex:?\s*/i, '');
        
      } else if (trimmedLine.toLowerCase().includes('jordan:') || 
                 trimmedLine.toLowerCase().startsWith('jordan')) {
        
        if (currentText.trim()) {
          messages.push({
            id: Date.now().toString() + Math.random(),
            speaker: currentSpeaker,
            text: currentText.trim(),
            timestamp: new Date()
          });
        }
        
        currentSpeaker = 'jordan';
        currentText = trimmedLine.replace(/^jordan:?\s*/i, '');
        
      } else {
        currentText += ' ' + trimmedLine;
      }
    }

    if (currentText.trim()) {
      messages.push({
        id: Date.now().toString() + Math.random(),
        speaker: currentSpeaker,
        text: currentText.trim(),
        timestamp: new Date()
      });
    }

    return messages;
  };

  const handleUserComment = async (commentText: string, commenterName: string): Promise<void> => {
    if (!commentText.trim() || !commenterName.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      speaker: 'user',
      text: commentText,
      timestamp: new Date(),
      userName: commenterName
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // Generate acknowledgment and continuation
      const prompt = `You are continuing a professional discussion about "${currentTopic.title}". 

A user named "${commenterName}" just commented: "${commentText}"

Please provide a response where one of the moderators (Alex or Jordan) briefly acknowledges the user and then continues the discussion. Follow this format:

[Moderator Name]: Thanks ${commenterName}, [2-3 word summary]. Now, continuing with our discussion... [new discussion content that builds on the topic]
Requirements:
- Use "Thanks [Name], [brief summary]. Now, continuing with our discussion..." format
- Do NOT repeat any previous statements
- Provide fresh discussion content that incorporates the user's perspective
- Choose either Alex or Jordan to respond (alternate between them)`;

      const responseText = await geminiService.generateContent(prompt);
      const audioSegments = await currentProvider.generateDiscussionAudio(responseText);
      
      // Parse response to messages
      const responseMessages = parseDiscussionToMessages(responseText);
      setMessages(prev => [...prev, ...responseMessages]);
      
      // Play response audio
      for (let i = 0; i < audioSegments.length; i++) {
        const segment = audioSegments[i];
        const message = responseMessages[i];
        
        if (message) {
          await playAudioSegment(segment, message.speaker as 'alex' | 'jordan');
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
    } catch (error) {
      console.error('Error handling user comment:', error);
      setError('Failed to process your comment');
    }
  };

  const handleSubmitComment = async (): Promise<void> => {
    if (!userInput.trim() || !userName.trim()) return;
    
    if (isPlaying || isProcessingQueue) {
      // Add to queue if something is playing
      addToQueue(userInput.trim(), userName.trim());
      setUserInput('');
      return;
    }

    // Process immediately if nothing is playing
    await handleUserComment(userInput.trim(), userName.trim());
    setUserInput('');
  };

  const startRecording = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // Here you would typically convert speech to text
        // For now, we'll just show a placeholder
        setUserInput('Voice input recorded (speech-to-text not implemented)');
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording');
    }
  };

  const stopRecording = (): void => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const stopAudio = (): void => {
    console.log('🛑 Stopping audio playback...');
    
    if (providerType === 'webspeech') {
      speechSynthesis.cancel();
    }
    
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    
    setIsPlaying(false);
  };

  const getSpeakerColor = (speaker: string): string => {
    switch (speaker) {
      case 'alex':
        return 'bg-blue-600';
      case 'jordan':
        return 'bg-purple-600';
      case 'user':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getSpeakerName = (speaker: string): string => {
    switch (speaker) {
      case 'alex':
        return 'Alex';
      case 'jordan':
        return 'Jordan';
      case 'user':
        return 'You';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/discussion/explore"
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Back to Discussions</span>
              </Link>
              <div className="h-6 w-px bg-gray-600"></div>
              <div>
                <h1 className="text-xl font-semibold text-white">{currentTopic.title}</h1>
                <p className="text-sm text-gray-400">{currentTopic.description}</p>
              </div>
            </div>
            
            {/* Queue Status */}
            {commentQueue.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-yellow-400">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                <span>{commentQueue.length} comment{commentQueue.length !== 1 ? 's' : ''} queued</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Discussion Area */}
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && !isGenerating && (
              <div className="text-center text-gray-400 py-8">
                <p className="text-lg mb-4">Ready to start the discussion?</p>
                <p className="text-sm">Click "Start Discussion" to begin the AI-powered conversation.</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${getSpeakerColor(message.speaker)} text-white`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-semibold">
                      {message.speaker === 'user' && message.userName ? message.userName : getSpeakerName(message.speaker)}
                    </span>
                    <span className="text-xs opacity-75">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                </div>
              </div>
            ))}
            
            {isGenerating && (
              <div className="flex justify-center">
                <div className="bg-gray-700 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm text-gray-300">Generating discussion...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="border-t border-gray-700 p-4">
            {!discussionStarted ? (
              <div className="text-center">
                <button
                  onClick={startDiscussion}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-5 w-5 mr-2" />
                      Start Discussion
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* User Name Input */}
                {!userName && (
                  <div>
                    <input
                      type="text"
                      placeholder="Enter your name to join the discussion..."
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    />
                  </div>
                )}

                {/* Comment Input */}
                {userName && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add your comment to the discussion..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                      className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isGenerating}
                    />
                    
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`p-2 rounded-lg transition-colors ${
                        isRecording 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                      disabled={isGenerating}
                    >
                      {isRecording ? (
                        <StopIcon className="h-5 w-5 text-white" />
                      ) : (
                        <MicrophoneIcon className="h-5 w-5 text-white" />
                      )}
                    </button>
                    
                    <button
                      onClick={handleSubmitComment}
                      disabled={!userInput.trim() || !userName.trim() || isGenerating}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                    >
                      <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* Audio Controls */}
                {isPlaying && (
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex items-center space-x-2 text-green-400">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-sm">Audio playing...</span>
                    </div>
                    <button
                      onClick={stopAudio}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center"
                    >
                      <PauseIcon className="h-4 w-4 mr-2" />
                      Stop
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded-lg">
                <p className="text-red-200 text-sm">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="mt-2 text-red-400 hover:text-red-300 text-xs underline"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionPage;