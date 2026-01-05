import { TokenCounter } from '../token-counter';

describe('TokenCounter', () => {
  test('should estimate tokens correctly', () => {
    const text = 'Hello, world! This is a test.';
    const tokens = TokenCounter.estimateTokens(text);
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(20); // Rough estimate
  });

  test('should calculate cost correctly', () => {
    const cost = TokenCounter.calculateCost(1000, 500);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(1); // Should be very small for these numbers
  });

  test('should get usage from messages', () => {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is 2+2?' }
    ];
    const response = 'The answer is 4.';
    
    const usage = TokenCounter.getUsageFromMessages(messages as any, response);
    
    expect(usage.promptTokens).toBeGreaterThan(0);
    expect(usage.completionTokens).toBeGreaterThan(0);
    expect(usage.totalTokens).toBe(usage.promptTokens + usage.completionTokens);
    expect(usage.estimatedCost).toBeGreaterThan(0);
  });
});

