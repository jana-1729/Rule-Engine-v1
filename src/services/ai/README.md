# AI Services

## Overview

Enhanced AI services with production features:
- Token usage tracking
- Response caching with Redis
- Health monitoring
- Retry logic with exponential backoff
- Structured output support

## Services

### GeminiServiceEnhanced

Production-ready Gemini AI service.

#### Features

1. **Token Tracking**: Automatically tracks token usage and costs
2. **Caching**: Redis-based response caching for identical requests
3. **Health Monitoring**: Real-time health status endpoint
4. **Retry Logic**: Automatic retries with exponential backoff
5. **JSON Mode**: Structured output with automatic parsing

#### Usage

```typescript
import { geminiServiceEnhanced } from '@/services/ai/gemini-service-enhanced';

// Simple chat
const response = await geminiServiceEnhanced.chat([
  { role: 'user', content: 'Hello!' }
]);

console.log(response.content); // AI response
console.log(response.usage); // Token usage
console.log(response.cached); // Was this cached?

// Chat with options
const response = await geminiServiceEnhanced.chat([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'What is 2+2?' }
], {
  useCache: true,
  cacheTTL: 3600, // 1 hour
  temperature: 0.7,
  maxRetries: 3
});

// JSON mode
const data = await geminiServiceEnhanced.chatWithJSON([
  { role: 'user', content: 'Return JSON with a greeting' }
]);

console.log(data.greeting); // Access JSON fields
console.log(data._meta.usage); // Token usage
```

#### Health Check

```bash
curl http://localhost:3000/api/v1/ai/health
```

Response:
```json
{
  "available": true,
  "model": "gemini-2.0-flash-exp",
  "provider": "Google Gemini",
  "redisConnected": true,
  "uptime": 123456,
  "status": "healthy"
}
```

#### Usage Statistics

```bash
curl http://localhost:3000/api/v1/ai/usage?days=7
```

## Token Counter

Utility for estimating token usage and costs.

```typescript
import { TokenCounter } from '@/services/ai/token-counter';

const usage = TokenCounter.getUsageFromMessages(messages, response);
console.log(`Tokens: ${usage.totalTokens}, Cost: $${usage.estimatedCost}`);
```

## Configuration

Set these environment variables:

```bash
GOOGLE_GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
REDIS_URL=redis://localhost:6379
```

## Testing

```bash
# Run tests
npm test -- src/services/ai/__tests__

# With coverage
npm test -- src/services/ai/__tests__ --coverage
```

## Cost Optimization

1. **Use Caching**: Set `useCache: true` for repeated requests
2. **Lower Temperature**: Use 0.7 or lower for consistent results
3. **Shorter Prompts**: Be concise in system messages
4. **Monitor Usage**: Check `/api/v1/ai/usage` regularly

## Troubleshooting

### Redis Connection Issues

```bash
# Check if Redis is running
docker ps | grep redis

# Start Redis
docker run -d --name redis -p 6379:6379 redis:alpine
```

### Gemini API Errors

Check health endpoint:
```bash
curl http://localhost:3000/api/v1/ai/health
```

If `available: false`, check:
1. `GOOGLE_GEMINI_API_KEY` is set
2. API key is valid
3. Network connectivity

