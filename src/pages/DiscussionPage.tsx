import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatMessage, getHost1Response, getHost2Response, generateDiscussionSummary } from '../services/gemini';
import { useVoiceAI } from '../hooks/useVoiceAI';
import VoiceControls from '../components/VoiceControls';
import { HandRaisedIcon, PaperAirplaneIcon, MicrophoneIcon, XMarkIcon } from '@heroicons/react/24/solid';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

export default function DiscussionPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(topicId ? decodeURIComponent(topicId) : 'General Discussion');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [discussionStarted, setDiscussionStarted] = useState(false);
  const [discussionEnded, setDiscussionEnded] = useState(false);
  const [summary, setSummary] = useState({ summary: '', keyPoints: [''], transcript: '' });
  const [handRaised, setHandRaised] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(420); // 7 minutes in seconds
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice AI hook
  const { speak, clearQueue, isAvailable: voiceAvailable } = useVoiceAI();

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set transcript to user input when speech recognition is active
  useEffect(() => {
    if (listening) {
      setUserInput(transcript);
    }
  }, [transcript, listening]);

  // Start the discussion when the page loads
  useEffect(() => {
    if (!discussionStarted && !discussionEnded) {
      startDiscussion();
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (discussionStarted && !discussionEnded) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            endDiscussion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [discussionStarted, discussionEnded]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Add message and optionally speak it
  const addMessage = (message: ChatMessage, shouldSpeak = false) => {
    setMessages((prev) => [...prev, message]);
    
    if (shouldSpeak && voiceEnabled && voiceAvailable) {
      const speaker = message.role === 'host1' ? 'alex' : 'jordan';
      if (message.role === 'host1' || message.role === 'host2') {
        speak(message.content, speaker);
      }
    }
  };

  // Start the discussion
  const startDiscussion = async () => {
    setIsLoading(true);
    setDiscussionStarted(true);

    // Alex introduces first
    const alexIntro: ChatMessage = {
      role: 'host1',
      content: `Welcome to our discussion on "${topic}". I'm Alex, and I'll be one of your hosts today.`
    };

    addMessage(alexIntro, true);

    // Jordan introduces after Alex finishes
    setTimeout(() => {
      const jordanIntro: ChatMessage = {
        role: 'host2',
        content: `And I'm Jordan, your other host. We're excited to explore different perspectives on this topic with you.`
      };

      addMessage(jordanIntro, true);

      // Alex starts the substantive discussion
      setTimeout(async () => {
        try {
          const currentMessages = [alexIntro, jordanIntro];
          const host1Response = await getHost1Response(currentMessages, topic);

          const host1Message: ChatMessage = {
            role: 'host1',
            content: host1Response
          };

          addMessage(host1Message, true);

          // Jordan responds to Alex's opening
          setTimeout(async () => {
            try {
              const allMessages = [...currentMessages, host1Message];
              const host2Response = await getHost2Response(allMessages, topic);

              addMessage({
                role: 'host2',
                content: host2Response
              }, true);
              
              setIsLoading(false);
            } catch (error) {
              console.error('Error getting host2 response:', error);
              setIsLoading(false);
            }
          }, 2000);
        } catch (error) {
          console.error('Error getting host1 response:', error);
          setIsLoading(false);
        }
      }, 2000);
    }, 2000);
  };

  // End the discussion
  const endDiscussion = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    clearQueue(); // Stop any playing audio
    setDiscussionEnded(true);
    setIsLoading(true);

    try {
      const discussionSummary = await generateDiscussionSummary(messages, topic);
      setSummary(discussionSummary);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary({
        summary: 'Unable to generate summary at this time.',
        keyPoints: ['Summary generation failed'],
        transcript: messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user input submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userInput.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: userInput
    };
    
    addMessage(userMessage);
    setUserInput('');
    resetTranscript();
    setHandRaised(false);
    setIsLoading(true);
    
    // Get response from host1
    try {
      const host1Response = await getHost1Response([...messages, userMessage], topic);
      
      const host1Message: ChatMessage = {
        role: 'host1',
        content: host1Response
      };
      
      addMessage(host1Message, true);
      
      // Get response from host2
      try {
        const host2Response = await getHost2Response([...messages, userMessage, host1Message], topic);
        
        addMessage({
          role: 'host2',
          content: host2Response
        }, true);
      } catch (error) {
        console.error('Error getting host2 response:', error);
      }
    } catch (error) {
      console.error('Error getting host1 response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle hand raised status
  const toggleHandRaised = () => {
    setHandRaised(!handRaised);
  };

  // Toggle speech recognition
  const toggleSpeechRecognition = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  // Toggle voice AI
  const toggleVoiceAI = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled) {
      clearQueue(); // Stop any playing audio when disabling
    }
  };

  // Start a new discussion
  const startNewDiscussion = () => {
    clearQueue();
    navigate('/discussion/explore');
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Discussion Header */}
        <div className="bg-gray-800 rounded-t-lg p-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">{topic}</h1>
            <p className="text-gray-300">
              {discussionEnded
                ? 'Discussion ended'
                : discussionStarted
                ? `Time remaining: ${formatTime(timeRemaining)}`
                : 'Starting discussion...'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <VoiceControls 
              voiceEnabled={voiceEnabled}
              onToggleVoice={toggleVoiceAI}
            />
            {!discussionEnded && (
              <button
                onClick={endDiscussion}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                End Discussion
              </button>
            )}
          </div>
        </div>

        {/* Discussion Content */}
        {!discussionEnded ? (
          <div className="bg-gray-800 rounded-b-lg shadow-xl overflow-hidden">
            {/* Messages Container */}
            <div className="h-96 overflow-y-auto p-4 bg-gray-800">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    message.role === 'user'
                      ? 'flex justify-end'
                      : 'flex justify-start'
                  }`}
                >
                  <div
                    className={`max-w-3/4 rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.role === 'host1'
                        ? 'bg-purple-600 text-white'
                        : 'bg-green-600 text-white'
                    }`}
                  >
                    <div className="font-bold">
                      {message.role === 'user'
                        ? 'You'
                        : message.role === 'host1'
                        ? 'Alex'
                        : 'Jordan'}
                    </div>
                    <p>{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-700 rounded-lg px-4 py-2 text-white">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-700">
              <form onSubmit={handleSubmit} className="flex items-center">
                <button
                  type="button"
                  onClick={toggleHandRaised}
                  className={`p-2 rounded-full mr-2 ${
                    handRaised ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  title={handRaised ? 'Hand raised' : 'Raise hand to speak'}
                >
                  <HandRaisedIcon className="h-6 w-6" />
                </button>
                
                {browserSupportsSpeechRecognition && (
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`p-2 rounded-full mr-2 ${
                      listening ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    title={listening ? 'Stop recording' : 'Start recording'}
                  >
                    {listening ? (
                      <XMarkIcon className="h-6 w-6" />
                    ) : (
                      <MicrophoneIcon className="h-6 w-6" />
                    )}
                  </button>
                )}
                
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={handRaised ? "Type your message..." : "Raise your hand to join the discussion..."}
                  disabled={!handRaised || isLoading}
                  className="flex-1 bg-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <button
                  type="submit"
                  disabled={!handRaised || !userInput.trim() || isLoading}
                  className={`p-2 rounded-full ml-2 ${
                    handRaised && userInput.trim() && !isLoading
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <PaperAirplaneIcon className="h-6 w-6" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          // Discussion Summary
          <div className="bg-gray-800 rounded-b-lg shadow-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Discussion Summary</h2>
            
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3 mb-4"></div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Overview</h3>
                  <p className="text-gray-300">{summary.summary}</p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Key Points</h3>
                  <ul className="list-disc pl-5 text-gray-300">
                    {summary.keyPoints.map((point, index) => (
                      <li key={index} className="mb-1">{point}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Transcript</h3>
                  <div className="bg-gray-700 p-4 rounded-md max-h-60 overflow-y-auto">
                    <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm">
                      {summary.transcript}
                    </pre>
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <button
                    onClick={startNewDiscussion}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Start New Discussion
                  </button>
                  
                  <button
                    onClick={() => {
                      // In a real app, this would save or email the transcript
                      alert('Summary saved! In a real app, this would save or email the transcript.');
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                  >
                    Save Summary
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
