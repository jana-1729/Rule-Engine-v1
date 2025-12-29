import { describe, it, expect, beforeAll } from 'vitest';
import { geminiService } from '../gemini-service';

describe('Gemini Service', () => {
  it('should check if service is available', () => {
    const status = geminiService.getStatus();
    expect(status).toHaveProperty('available');
    expect(status).toHaveProperty('model');
    expect(status).toHaveProperty('provider');
    expect(status.provider).toBe('Google Gemini');
  });

  it('should be available if API key is set', () => {
    if (process.env.GOOGLE_GEMINI_API_KEY) {
      expect(geminiService.isAvailable()).toBe(true);
    } else {
      expect(geminiService.isAvailable()).toBe(false);
      console.log('⚠️  Skipping Gemini tests - API key not set');
    }
  });

  it('should generate chat response', async () => {
    if (!geminiService.isAvailable()) {
      console.log('⚠️  Skipping test - Gemini not configured');
      return;
    }

    const response = await geminiService.chat([
      {
        role: 'user',
        content: 'Say "Hello, AI!" and nothing else.',
      },
    ]);

    expect(response).toBeTruthy();
    expect(typeof response).toBe('string');
    expect(response.toLowerCase()).toContain('hello');
  }, 30000); // 30 second timeout

  it('should generate JSON response', async () => {
    if (!geminiService.isAvailable()) {
      console.log('⚠️  Skipping test - Gemini not configured');
      return;
    }

    const response = await geminiService.chatWithJSON([
      {
        role: 'system',
        content: 'You are a helpful assistant that responds in JSON format.',
      },
      {
        role: 'user',
        content: 'Return a JSON object with a greeting field containing "Hello, World!"',
      },
    ]);

    expect(response).toBeTruthy();
    expect(typeof response).toBe('object');
    expect(response).toHaveProperty('greeting');
    expect(response.greeting).toContain('Hello');
  }, 30000);

  it('should handle JSON wrapped in markdown code blocks', async () => {
    if (!geminiService.isAvailable()) {
      console.log('⚠️  Skipping test - Gemini not configured');
      return;
    }

    // This tests the JSON parsing logic that handles markdown
    const response = await geminiService.chatWithJSON([
      {
        role: 'user',
        content: 'Return {"test": true} as JSON',
      },
    ]);

    expect(response).toHaveProperty('test');
    expect(response.test).toBe(true);
  }, 30000);
});

