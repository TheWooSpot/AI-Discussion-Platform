import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    // Get API key from environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY is not set in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Updated to use the correct model name for current API
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: RetryOptions = { maxRetries: 3, baseDelay: 1000 }
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Check if it's a retryable error (503 overloaded or network issues)
        const isRetryable = error instanceof Error && (
          error.message.includes('503') ||
          error.message.includes('overloaded') ||
          error.message.includes('network') ||
          error.message.includes('timeout')
        );
        
        if (!isRetryable || attempt === options.maxRetries) {
          throw error;
        }
        
        // Exponential backoff: baseDelay * 2^attempt
        const delayMs = options.baseDelay * Math.pow(2, attempt);
        console.log(`Gemini API attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`);
        await this.delay(delayMs);
      }
    }
    
    throw lastError!;
  }

  async generateContent(prompt: string): Promise<string> {
    return this.retryWithBackoff(async () => {
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        console.error('Error generating content:', error);
        throw error;
      }
    });
  }

  async generateDiscussion(topic: string, description: string): Promise<string> {
    const prompt = `Create a natural, engaging discussion between two AI hosts about "${topic}". 

    Topic: ${topic}
    Description: ${description}

    IMPORTANT: Format the discussion with clear speaker labels like this:

    Alex: [Alex's opening statement and introduction]

    Jordan: [Jordan's response and additional insights]

    Alex: [Alex's follow-up question or comment]

    Jordan: [Jordan's detailed response]

    Alex: [Alex's analysis or new point]

    Jordan: [Jordan's conclusion or final thoughts]

    Make it sound like a real podcast conversation with:
    - Natural introductions and transitions
    - Back-and-forth dialogue with clear speaker changes
    - Insightful questions and responses
    - Engaging commentary
    - A natural conclusion
    - Each speaker should have 3-4 speaking turns
    - Keep each speaking turn to 2-3 sentences for better voice generation

    Make it conversational and informative, around 2-3 minutes when spoken.`;

    return this.generateContent(prompt);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.generateContent('Test connection');
      return true;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }
}

export const geminiService = new GeminiService();
