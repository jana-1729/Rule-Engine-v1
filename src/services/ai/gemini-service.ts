import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Gemini AI Service
 * Provides AI-powered features using Google's Gemini API
 * 
 * Features:
 * - Chat completions
 * - JSON mode responses
 * - Cost-effective (100x cheaper than GPT-4)
 * - 2M token context window
 */
class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private modelName: string = 'gemini-2.5-flash-lite';
  
  constructor() {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.warn('⚠️  GOOGLE_GEMINI_API_KEY not set - AI features will be disabled');
      console.warn('   Get your free API key at: https://aistudio.google.com/app/apikey');
      return;
    }

    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    
    try {
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({
        model: this.modelName,
      });
      console.log(`✓ Gemini AI initialized with model: ${this.modelName}`);
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
    }
  }

  /**
   * Send a chat message and get a text response
   */
  async chat(messages: Message[]): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini client not initialized. Please set GOOGLE_GEMINI_API_KEY.');
    }

    try {
      // Convert messages to Gemini format
      const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
      const userMessages = messages.filter((m) => m.role !== 'system');
      
      // Combine system message with user prompt
      const prompt = systemMessage 
        ? `${systemMessage}\n\n${userMessages.map((m) => m.content).join('\n')}`
        : userMessages.map((m) => m.content).join('\n');

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Gemini chat error:', error);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  /**
   * Send a chat message and get a JSON response
   * Automatically handles JSON parsing and markdown code blocks
   */
  async chatWithJSON(messages: Message[]): Promise<any> {
    if (!this.model) {
      throw new Error('Gemini client not initialized. Please set GOOGLE_GEMINI_API_KEY.');
    }

    try {
      // Add JSON instruction to system message
      const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
      const enhancedSystemMessage = `${systemMessage}\n\nIMPORTANT: You must respond with valid JSON only. Do not include any text before or after the JSON object. Do not wrap the JSON in markdown code blocks.`;
      
      const enhancedMessages = [
        { role: 'system' as const, content: enhancedSystemMessage },
        ...messages.filter((m) => m.role !== 'system'),
      ];

      const response = await this.chat(enhancedMessages);
      
      // Extract JSON from response (handle markdown code blocks)
      let jsonText = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }
      
      // Parse and return JSON
      return JSON.parse(jsonText);
    } catch (error: any) {
      console.error('Gemini JSON parsing error:', error);
      throw new Error(`Failed to parse JSON response: ${error.message}`);
    }
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return !!this.model;
  }

  /**
   * Get the current model name
   */
  getModelName(): string {
    return this.modelName;
  }

  /**
   * Get service status
   */
  getStatus(): {
    available: boolean;
    model: string;
    provider: string;
  } {
    return {
      available: this.isAvailable(),
      model: this.modelName,
      provider: 'Google Gemini',
    };
  }
}

// Export singleton instance
export const geminiService = new GeminiService();

// Export class for testing
export { GeminiService };

