import { GoogleGenerativeAI } from '@google/generative-ai';
import { redisClient } from '@/lib/redis';
import { TokenCounter, TokenUsage } from './token-counter';
import crypto from 'crypto';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  useCache?: boolean;
  cacheTTL?: number; // seconds
  temperature?: number;
  maxRetries?: number;
}

interface ChatResponse {
  content: string;
  usage: TokenUsage;
  cached: boolean;
  model: string;
}

interface HealthStatus {
  available: boolean;
  model: string;
  provider: string;
  redisConnected: boolean;
  lastError?: string;
  uptime: number;
}

/**
 * Enhanced Gemini AI Service
 * 
 * Features:
 * - Token usage tracking
 * - Response caching with Redis
 * - Health monitoring
 * - Retry logic with exponential backoff
 * - Structured output support
 */
export class GeminiServiceEnhanced {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private modelName: string = 'gemini-2.0-flash-exp';
  private isAvailable: boolean = false;
  private lastError: string | undefined;
  private startTime: number = Date.now();
  
  constructor() {
    this.initialize();
  }

  private initialize() {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.warn('⚠️  GOOGLE_GEMINI_API_KEY not set - AI features will be disabled');
      console.warn('   Get your free API key at: https://aistudio.google.com/app/apikey');
      this.isAvailable = false;
      return;
    }

    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
    
    try {
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({
        model: this.modelName,
      });
      this.isAvailable = true;
      console.log(`✓ Enhanced Gemini AI initialized with model: ${this.modelName}`);
    } catch (error: any) {
      console.error('Failed to initialize Gemini AI:', error);
      this.isAvailable = false;
      this.lastError = error.message;
    }
  }

  /**
   * Generate cache key from messages
   */
  private getCacheKey(messages: Message[], options?: ChatOptions): string {
    const content = JSON.stringify({
      messages,
      model: this.modelName,
      temperature: options?.temperature || 1.0
    });
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return `gemini:chat:${hash}`;
  }

  /**
   * Chat with caching support
   */
  async chat(
    messages: Message[],
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    if (!this.model || !this.isAvailable) {
      throw new Error('Gemini client not initialized. Please set GOOGLE_GEMINI_API_KEY.');
    }

    const {
      useCache = true,
      cacheTTL = 3600, // 1 hour default
      temperature = 1.0,
      maxRetries = 3
    } = options;

    // Check cache first
    if (useCache && redisClient.isReady()) {
      const cacheKey = this.getCacheKey(messages, options);
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        const cachedResponse = JSON.parse(cached);
        console.log('✓ Cache hit for Gemini request');
        return {
          ...cachedResponse,
          cached: true
        };
      }
    }

    // Make API call with retry logic
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        
        // Convert messages to Gemini format
        const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
        const userMessages = messages.filter((m) => m.role !== 'system');
        
        // Combine system message with user prompt
        const prompt = systemMessage 
          ? `${systemMessage}\n\n${userMessages.map((m) => m.content).join('\n')}`
          : userMessages.map((m) => m.content).join('\n');

        const result = await this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
          }
        });
        
        const response = await result.response;
        const content = response.text();
        
        const duration = Date.now() - startTime;
        
        // Calculate token usage
        const usage = TokenCounter.getUsageFromMessages(messages, content);
        
        console.log(`✓ Gemini API call successful (${duration}ms, ${usage.totalTokens} tokens, $${usage.estimatedCost.toFixed(6)})`);

        const chatResponse: ChatResponse = {
          content,
          usage,
          cached: false,
          model: this.modelName
        };

        // Cache the response
        if (useCache && redisClient.isReady()) {
          const cacheKey = this.getCacheKey(messages, options);
          await redisClient.set(
            cacheKey,
            JSON.stringify(chatResponse),
            cacheTTL
          );
        }

        // Store usage metrics in database (async, don't wait)
        this.recordUsage(usage).catch(err => 
          console.error('Failed to record usage:', err)
        );

        return chatResponse;

      } catch (error: any) {
        lastError = error;
        console.error(`Gemini API attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    this.lastError = lastError?.message;
    throw new Error(`Gemini API error after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Chat with JSON response
   */
  async chatWithJSON(
    messages: Message[],
    options: ChatOptions = {}
  ): Promise<any> {
    // Add JSON instruction to system message
    const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
    const enhancedSystemMessage = `${systemMessage}\n\nIMPORTANT: You must respond with valid JSON only. Do not include any text before or after the JSON object. Do not wrap the JSON in markdown code blocks.`;
    
    const enhancedMessages = [
      { role: 'system' as const, content: enhancedSystemMessage },
      ...messages.filter((m) => m.role !== 'system'),
    ];

    const response = await this.chat(enhancedMessages, options);
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = response.content.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    try {
      const parsed = JSON.parse(jsonText);
      return {
        ...parsed,
        _meta: {
          usage: response.usage,
          cached: response.cached,
          model: response.model
        }
      };
    } catch (error: any) {
      console.error('Failed to parse JSON response:', jsonText);
      throw new Error(`Failed to parse JSON response: ${error.message}`);
    }
  }

  /**
   * Record usage metrics to database
   */
  private async recordUsage(usage: TokenUsage, feature: string = 'general'): Promise<void> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      await prisma.ai_usage.create({
        data: {
          feature,
          tokens: usage.totalTokens,
          cost: usage.estimatedCost,
          // accountId will be added when we have context
        }
      });
    } catch (error) {
      // Don't throw - this is optional tracking
      console.error('Failed to record AI usage:', error);
    }
  }

  /**
   * Get health status
   */
  getHealth(): HealthStatus {
    return {
      available: this.isAvailable,
      model: this.modelName,
      provider: 'Google Gemini',
      redisConnected: redisClient.isReady(),
      lastError: this.lastError,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Clear cache for specific messages or all cache
   */
  async clearCache(messages?: Message[]): Promise<boolean> {
    if (!redisClient.isReady()) {
      return false;
    }

    if (messages) {
      const cacheKey = this.getCacheKey(messages);
      return await redisClient.del(cacheKey);
    }

    // Clear all Gemini cache (would need Redis SCAN in production)
    console.warn('Clearing all cache not implemented - provide specific messages');
    return false;
  }
}

// Export singleton instance
export const geminiServiceEnhanced = new GeminiServiceEnhanced();

