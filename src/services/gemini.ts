import { GoogleGenerativeAI } from '@google/generative-ai';

// Define types
export interface ChatMessage {
  role: 'user' | 'host1' | 'host2';
  content: string;
}

interface DiscussionSummary {
  summary: string;
  keyPoints: string[];
  transcript: string;
}

// Initialize Gemini API
const getGeminiAPI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('Gemini API key not found. Using mock responses.');
    return null;
  }
  
  return new GoogleGenerativeAI(apiKey);
};

// Suggest discussion topics
export const suggestDiscussionTopics = async (): Promise<string[]> => {
  const genAI = getGeminiAPI();
  
  if (!genAI) {
    // Return mock topics if API key is not available
    return [
      'The future of remote work',
      'Artificial intelligence in everyday life',
      'Climate change solutions',
      'The importance of digital literacy',
      "Social media's impact on society",
      'Space exploration in the 21st century',
      'The future of education',
      'Sustainable living practices',
      'Technology and privacy concerns',
      'The evolution of entertainment'
    ];
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Generate 10 thought-provoking discussion topics that would be interesting for a 7-minute conversation. 
    These should be topics where people might have different perspectives. 
    Return only the list of topics, one per line, with no numbering or additional text.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Split the response by newlines and clean up
    return text
      .split('\n')
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0)
      .slice(0, 10);
  } catch (error) {
    console.error('Error generating topics with Gemini:', error);
    throw error;
  }
};

// Get response from host 1 (Alex - progressive perspective)
export const getHost1Response = async (messages: ChatMessage[], topic: string): Promise<string> => {
  const genAI = getGeminiAPI();
  
  if (!genAI) {
    // Return mock response if API key is not available
    return "As someone with a progressive perspective, I think we should consider how this topic relates to social equity and forward-thinking solutions. There are several innovative approaches we could explore that prioritize inclusivity and sustainability.";
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Format previous messages for context
    const conversationHistory = messages
      .map(msg => `${msg.role === 'host1' ? 'Alex' : msg.role === 'host2' ? 'Jordan' : 'User'}: ${msg.content}`)
      .join('\n');
    
    const prompt = `You are Alex, an AI host with a progressive perspective in a discussion about "${topic}".
    
    Your role is to present thoughtful, nuanced views that lean progressive/liberal on this topic. Be respectful but represent this perspective authentically.
    
    Here's the conversation so far:
    ${conversationHistory}
    
    Provide your next response as Alex. Keep it concise (2-3 sentences) and conversational. Don't be repetitive with previous points.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating host1 response with Gemini:', error);
    throw error;
  }
};

// Get response from host 2 (Jordan - conservative perspective)
export const getHost2Response = async (messages: ChatMessage[], topic: string): Promise<string> => {
  const genAI = getGeminiAPI();
  
  if (!genAI) {
    // Return mock response if API key is not available
    return "From a more traditional perspective, I believe we should consider the proven approaches that have stood the test of time. There's wisdom in established systems, and we should be cautious about radical changes without considering potential consequences.";
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Format previous messages for context
    const conversationHistory = messages
      .map(msg => `${msg.role === 'host1' ? 'Alex' : msg.role === 'host2' ? 'Jordan' : 'User'}: ${msg.content}`)
      .join('\n');
    
    const prompt = `You are Jordan, an AI host with a conservative/traditional perspective in a discussion about "${topic}".
    
    Your role is to present thoughtful, nuanced views that lean conservative/traditional on this topic. Be respectful but represent this perspective authentically.
    
    Here's the conversation so far:
    ${conversationHistory}
    
    Provide your next response as Jordan. Keep it concise (2-3 sentences) and conversational. Don't be repetitive with previous points.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating host2 response with Gemini:', error);
    throw error;
  }
};

// Generate discussion summary
export const generateDiscussionSummary = async (messages: ChatMessage[], topic: string): Promise<DiscussionSummary> => {
  const genAI = getGeminiAPI();
  
  if (!genAI) {
    // Return mock summary if API key is not available
    return {
      summary: `This was a thoughtful discussion about ${topic} with different perspectives presented by the hosts and participant.`,
      keyPoints: [
        'Multiple viewpoints were explored on this topic',
        'Both traditional and progressive perspectives were considered',
        'The conversation remained respectful while addressing different angles'
      ],
      transcript: messages.map(msg => `${msg.role === 'host1' ? 'Alex' : msg.role === 'host2' ? 'Jordan' : 'User'}: ${msg.content}`).join('\n\n')
    };
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Format messages for transcript
    const transcript = messages
      .map(msg => `${msg.role === 'host1' ? 'Alex' : msg.role === 'host2' ? 'Jordan' : 'User'}: ${msg.content}`)
      .join('\n\n');
    
    const prompt = `Analyze this discussion about "${topic}" and create a comprehensive summary.

    TRANSCRIPT:
    ${transcript}
    
    Please provide:
    1. A concise summary paragraph of the overall discussion (3-5 sentences)
    2. A list of 3-5 key points that emerged
    3. The full transcript formatted clearly
    
    Format your response as JSON with the following structure:
    {
      "summary": "Summary paragraph here",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "transcript": "Formatted transcript here"
    }`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Try to parse the JSON response
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing Gemini summary response as JSON:', parseError);
      
      // Fallback to a simple format if JSON parsing fails
      return {
        summary: `This was a thoughtful discussion about ${topic} with different perspectives presented.`,
        keyPoints: ['Multiple viewpoints were explored on this topic'],
        transcript: transcript
      };
    }
  } catch (error) {
    console.error('Error generating summary with Gemini:', error);
    throw error;
  }
};
