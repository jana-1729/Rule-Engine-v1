/**
 * Token Counter for Gemini API
 * Estimates token usage for billing and monitoring
 */

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export class TokenCounter {
  // Gemini pricing (as of Jan 2026)
  // Flash: $0.075 per 1M input tokens, $0.30 per 1M output tokens
  private static readonly INPUT_COST_PER_1M = 0.075;
  private static readonly OUTPUT_COST_PER_1M = 0.30;

  /**
   * Estimate tokens in text (rough approximation)
   * 1 token ≈ 4 characters for English text
   */
  static estimateTokens(text: string): number {
    if (!text) return 0;
    // More accurate: count words and characters
    const words = text.split(/\s+/).length;
    const chars = text.length;
    // Average: 1 token = 0.75 words or 4 characters
    return Math.ceil(Math.max(words / 0.75, chars / 4));
  }

  /**
   * Calculate cost based on token usage
   */
  static calculateCost(promptTokens: number, completionTokens: number): number {
    const inputCost = (promptTokens / 1_000_000) * this.INPUT_COST_PER_1M;
    const outputCost = (completionTokens / 1_000_000) * this.OUTPUT_COST_PER_1M;
    return inputCost + outputCost;
  }

  /**
   * Get token usage from messages
   */
  static getUsageFromMessages(
    messages: Array<{ role: string; content: string }>,
    response: string
  ): TokenUsage {
    // Calculate prompt tokens
    const promptText = messages.map(m => m.content).join('\n');
    const promptTokens = this.estimateTokens(promptText);
    
    // Calculate completion tokens
    const completionTokens = this.estimateTokens(response);
    
    // Calculate total and cost
    const totalTokens = promptTokens + completionTokens;
    const estimatedCost = this.calculateCost(promptTokens, completionTokens);

    return {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost
    };
  }
}

