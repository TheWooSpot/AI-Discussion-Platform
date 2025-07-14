import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  PaperAirplaneIcon, 
  SpeakerWaveIcon,
  StopIcon,
  UserIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { geminiService } from '../services/gemini';
import { useVoiceAI } from '../hooks/useVoiceAI';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'alex' | 'jordan';
  timestamp: Date;
  isTyping?: boolean;
}

const discussionTopics: Record<string, { title: string; description: string; context: string }> = {
  '1': {
    title: 'The Future of Artificial Intelligence',
    description: 'Exploring the potential impacts and ethical considerations of AI development',
    context: 'This discussion focuses on AI development, ethics, future implications, and societal impact.'
  },
  '2': {
    title: 'Climate Change Solutions',
    description: 'Discussing innovative approaches to combat climate change',
    context: 'This discussion explores climate change solutions, environmental policy, and sustainable technologies.'
  },
  '3': {
    title: 'Space Exploration and Colonization',
    description: 'The challenges and opportunities of human space exploration',
    context: 'This discussion covers space exploration, Mars colonization, space technology, and the future of humanity in space.'
  }
};

export default function DiscussionPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [discussionStarted, setDiscussionStarted] = useState(false);
  const { voiceState, speak, stopAudio, clearQueue, isAvailable: isVoiceAvailable } = useVoiceAI();

  const topic = topicId ? discussionTopics[topicId] : null;

  useEffect(() => {
    if (topic && !discussionStarted) {
      startDiscussion();
    }
  }, [topic, discussionStarted]);

  const startDiscussion = async () => {
    if (!topic) return;

    setDiscussionStarted(true);
    
    // Add welcome message from Alex
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: `Welcome to our discussion on "${topic.title}"! I'm Alex, and I'll be exploring this topic with Jordan. Feel free to jump in with your thoughts anytime.`,
      sender: 'alex',
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);

    // Speak the welcome message if voice is available
    if (isVoiceAvailable) {
      await speak(welcomeMessage.content, 'alex');
    }

    // Add Jordan's opening response after a delay
    setTimeout(async () => {
      try {
        const jordanResponse = await geminiService.getHost2Response(
          [{ role: 'host1', content: welcomeMessage.content }],
          topic.title
        );

        const jordanMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: jordanResponse,
          sender: 'jordan',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, jordanMessage]);

        if (isVoiceAvailable) {
          await speak(jordanResponse, 'jordan');
        }
      } catch (error) {
        console.error('Error getting Jordan response:', error);
      }
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !topic) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Convert messages to the format expected by Gemini service
      const chatMessages = messages.map(msg => ({
        role: msg.sender === 'alex' ? 'host1' as const : 
             msg.sender === 'jordan' ? 'host2' as const : 
             'user' as const,
        content: msg.content
      }));

      // Add the new user message
      chatMessages.push({
        role: 'user' as const,
        content: userMessage.content
      });

      // Get Alex's response first
      const alexResponse = await geminiService.getHost1Response(chatMessages, topic.title);
      
      const alexMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: alexResponse,
        sender: 'alex',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, alexMessage]);

      if (isVoiceAvailable) {
        await speak(alexResponse, 'alex');
      }

      // Get Jordan's response after Alex
      setTimeout(async () => {
        try {
          const updatedChatMessages = [...chatMessages, { role: 'host1' as const, content: alexResponse }];
          const jordanResponse = await geminiService.getHost2Response(updatedChatMessages, topic.title);
          
          const jordanMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: jordanResponse,
            sender: 'jordan',
            timestamp: new Date()
          };

          setMessages(prev => [...prev, jordanMessage]);

          if (isVoiceAvailable) {
            await speak(jordanResponse, 'jordan');
          }
        } catch (error) {
          console.error('Error getting Jordan response:', error);
        }
      }, 1500);

    } catch (error) {
      console.error('Error getting AI responses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Discussion Not Found</h1>
          <p className="text-gray-600">The requested discussion topic could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">{topic.title}</h1>
            {isVoiceAvailable && (
              <div className="flex items-center gap-2">
                {voiceState.isPlaying && (
                  <button
                    onClick={stopAudio}
                    className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <StopIcon className="w-4 h-4" />
                    Stop
                  </button>
                )}
                {voiceState.currentSpeaker && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg">
                    <SpeakerWaveIcon className="w-4 h-4" />
                    {voiceState.currentSpeaker === 'alex' ? 'Alex' : 'Jordan'} speaking...
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-gray-600">{topic.description}</p>
        </div>

        {/* Chat Messages */}
        <div className="bg-white rounded-xl shadow-lg mb-6 h-96 overflow-y-auto">
          <div className="p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'alex' ? 'bg-blue-500' :
                  message.sender === 'jordan' ? 'bg-green-500' :
                  'bg-purple-500'
                }`}>
                  {message.sender === 'user' ? (
                    <UserIcon className="w-4 h-4 text-white" />
                  ) : (
                    <SparklesIcon className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-700">
                      {message.sender === 'alex' ? 'Alex' :
                       message.sender === 'jordan' ? 'Jordan' :
                       'You'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div className={`inline-block p-3 rounded-lg max-w-md ${
                    message.sender === 'user' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse"></div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Join the discussion..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
