import { GeminiServiceEnhanced } from '../gemini-service-enhanced';

describe('GeminiServiceEnhanced', () => {
  let service: GeminiServiceEnhanced;

  beforeAll(() => {
    service = new GeminiServiceEnhanced();
  });

  test('should get health status', () => {
    const health = service.getHealth();
    expect(health).toHaveProperty('available');
    expect(health).toHaveProperty('model');
    expect(health).toHaveProperty('provider');
    expect(health.provider).toBe('Google Gemini');
  });

  test('should chat with caching', async () => {
    if (!service.getHealth().available) {
      console.log('Skipping test - Gemini not available');
      return;
    }

    const messages = [
      { role: 'user' as const, content: 'Say "test successful" and nothing else.' }
    ];

    const response1 = await service.chat(messages);
    expect(response1.content).toBeTruthy();
    expect(response1.cached).toBe(false);
    expect(response1.usage.totalTokens).toBeGreaterThan(0);

    // Second call should be cached
    const response2 = await service.chat(messages);
    expect(response2.cached).toBe(true);
  }, 30000); // 30 second timeout

  test('should chat with JSON response', async () => {
    if (!service.getHealth().available) {
      console.log('Skipping test - Gemini not available');
      return;
    }

    const messages = [
      {
        role: 'system' as const,
        content: 'You are a helpful assistant that responds in JSON.'
      },
      {
        role: 'user' as const,
        content: 'Return a JSON object with a "message" field containing "Hello"'
      }
    ];

    const response = await service.chatWithJSON(messages, { useCache: false });
    expect(response).toHaveProperty('message');
    expect(response._meta).toHaveProperty('usage');
  }, 30000);
});

