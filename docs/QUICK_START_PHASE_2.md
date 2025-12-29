# 🚀 Quick Start: Phase 2 (AI Features)

> **You've completed Week 1!** 🎉  
> **Next**: Build AI-powered intelligence layer  
> **Timeline**: Start today, complete in 12 weeks

---

## 📊 Where You Are Now

✅ **11 Production Integrations** (Gmail, Slack, Notion, Sheets, Teams, Discord, HubSpot, Salesforce, Jira, GitHub, Trello)  
✅ **Error Recovery** (Basic retry + circuit breaker)  
✅ **Documentation** (Blogs + guides for all integrations)  
✅ **Modern UI** (Search, filters, markdown rendering)  
✅ **B2B2C Architecture** (Multi-tenant, OAuth, API keys)

---

## 🎯 What's Next (Phase 2 Goals)

### Core AI Features (12 weeks)
1. **AI Field Mapping** - GPT-4 powered intelligent field mapping
2. **Auto-Healing Workflows** - Self-fixing errors without intervention
3. **Workflow AI Assistant** - Natural language to workflow generation
4. **Memory Graphs** - Learn from executions, build intelligence
5. **10 More Integrations** - Reach 21 total integrations

---

## 🚀 Start Today: Week 2, Day 1

### Step 1: Setup AI Infrastructure (30 minutes)

#### 1.1 Get Google Gemini API Key
```bash
# Go to: https://aistudio.google.com/app/apikey
# Create new API key (or use your existing one)
# Copy the key (starts with AIza...)
```

**Benefits of Gemini:**
- ✅ **Free Tier**: 15 requests/minute, 1 million tokens/day
- ✅ **Cost-Effective**: $0.00035 per 1K tokens (vs OpenAI's $0.03)
- ✅ **Powerful**: Gemini 1.5 Pro comparable to GPT-4
- ✅ **Large Context**: 2 million tokens context window

#### 1.2 Install Dependencies
```bash
cd /Users/janarthanans/Projects/Rule-Engine-v1

# Install Google Generative AI SDK
npm install @google/generative-ai

# Install supporting packages
npm install zod-to-json-schema

# Install dev dependencies
npm install --save-dev @types/node
```

#### 1.3 Update Environment Variables
```bash
# Add to .env.local
echo "GOOGLE_GEMINI_API_KEY=AIza-your-key-here" >> .env.local
echo "GEMINI_MODEL=gemini-2.5-flash-lite-latest" >> .env.local
```

---

### Step 2: Create AI Service Layer (2 hours)

#### 2.1 Create Directory Structure
```bash
mkdir -p src/services/ai
mkdir -p src/app/api/v1/ai
```

#### 2.2 Create Gemini AI Service
Create `src/services/ai/gemini-service.ts`:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  
  constructor() {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.warn('⚠️  GOOGLE_GEMINI_API_KEY not set - AI features will be disabled');
      return;
    }

    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite-latest',
    });
  }

  async chat(messages: Message[]): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini client not initialized');
    }

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
  }

  async chatWithJSON(messages: Message[]): Promise<any> {
    if (!this.model) {
      throw new Error('Gemini client not initialized');
    }

    // Add JSON instruction to system message
    const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
    const enhancedSystemMessage = `${systemMessage}\n\nIMPORTANT: You must respond with valid JSON only. Do not include any text before or after the JSON object.`;
    
    const enhancedMessages = [
      { role: 'system' as const, content: enhancedSystemMessage },
      ...messages.filter((m) => m.role !== 'system'),
    ];

    const response = await this.chat(enhancedMessages);
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    return JSON.parse(jsonText);
  }

  isAvailable(): boolean {
    return !!this.model;
  }
}

export const geminiService = new GeminiService();
```

#### 2.3 Test Gemini Service
Create `src/services/ai/__tests__/gemini-service.test.ts`:

```typescript
import { geminiService } from '../gemini-service';

describe('Gemini Service', () => {
  it('should be available if API key is set', () => {
    if (process.env.GOOGLE_GEMINI_API_KEY) {
      expect(geminiService.isAvailable()).toBe(true);
    } else {
      expect(geminiService.isAvailable()).toBe(false);
    }
  });

  it('should generate chat response', async () => {
    if (!geminiService.isAvailable()) {
      console.log('Skipping test - Gemini not configured');
      return;
    }

    const response = await geminiService.chat([
      {
        role: 'user',
        content: 'Say "Hello, AI!" and nothing else.',
      },
    ]);

    expect(response).toContain('Hello');
  }, 30000); // 30 second timeout

  it('should generate JSON response', async () => {
    if (!geminiService.isAvailable()) {
      console.log('Skipping test - Gemini not configured');
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

    expect(response).toHaveProperty('greeting');
    expect(response.greeting).toContain('Hello');
  }, 30000);
});
```

```bash
# Run test
npm run test -- gemini-service.test.ts
```

---

### Step 3: Build AI Field Mapping (Proof of Concept)

#### 3.1 Create Simple Mapping Service
Create `src/services/ai/field-mapping-service.ts`:

```typescript
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { geminiService } from './gemini-service';

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  confidence: number;
  reasoning: string;
}

export interface MappingSuggestion {
  mappings: FieldMapping[];
  overallConfidence: number;
  warnings: string[];
}

class FieldMappingService {
  async suggestMapping(
    sourceSchema: z.ZodType,
    targetSchema: z.ZodType,
    context?: string
  ): Promise<MappingSuggestion> {
    if (!geminiService.isAvailable()) {
      throw new Error('Gemini AI service not available');
    }

    // Convert Zod schemas to JSON Schema
    const sourceJson = zodToJsonSchema(sourceSchema, 'sourceSchema');
    const targetJson = zodToJsonSchema(targetSchema, 'targetSchema');

    const prompt = `
You are an expert at mapping data between different API schemas.

SOURCE SCHEMA:
${JSON.stringify(sourceJson, null, 2)}

TARGET SCHEMA:
${JSON.stringify(targetJson, null, 2)}

${context ? `CONTEXT: ${context}` : ''}

Map fields from source to target. Provide a JSON response with this structure:
{
  "mappings": [
    {
      "sourceField": "source.field.path",
      "targetField": "target.field.path",
      "transformation": "optional transformation description",
      "confidence": 0.95,
      "reasoning": "why this mapping makes sense"
    }
  ],
  "overallConfidence": 0.90,
  "warnings": ["any potential issues"]
}

Rules:
1. Use dot notation for nested fields (e.g., "user.email")
2. Confidence should be 0-1 (1 = certain, 0 = uncertain)
3. Include transformation if data type conversion needed
4. Provide clear reasoning for each mapping
`;

    const response = await geminiService.chatWithJSON([
      {
        role: 'system',
        content: 'You are an expert at mapping data between API schemas. Always respond with valid JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    return response as MappingSuggestion;
  }
}

export const fieldMappingService = new FieldMappingService();
```

#### 3.2 Create API Endpoint
Create `src/app/api/v1/ai/suggest-mapping/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fieldMappingService } from '@/services/ai/field-mapping-service';

const requestSchema = z.object({
  sourceSchema: z.any(),
  targetSchema: z.any(),
  context: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = requestSchema.parse(body);

    // For POC, accept raw schemas
    // TODO: Later, accept integration + action names
    const sourceSchema = z.object(data.sourceSchema);
    const targetSchema = z.object(data.targetSchema);

    const suggestions = await fieldMappingService.suggestMapping(
      sourceSchema,
      targetSchema,
      data.context
    );

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    console.error('AI mapping error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to generate mapping suggestions' 
      },
      { status: 500 }
    );
  }
}
```

#### 3.3 Test the API
```bash
# Start dev server
npm run dev

# In another terminal, test the API
curl -X POST http://localhost:3000/api/v1/ai/suggest-mapping \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSchema": {
      "user_name": { "type": "string" },
      "user_email": { "type": "string" },
      "created_at": { "type": "string" }
    },
    "targetSchema": {
      "name": { "type": "string" },
      "email": { "type": "string" },
      "timestamp": { "type": "string" }
    },
    "context": "Mapping user data from Slack to Notion"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "mappings": [
      {
        "sourceField": "user_name",
        "targetField": "name",
        "confidence": 0.95,
        "reasoning": "Direct mapping of user name"
      },
      {
        "sourceField": "user_email",
        "targetField": "email",
        "confidence": 0.95,
        "reasoning": "Direct mapping of email address"
      },
      {
        "sourceField": "created_at",
        "targetField": "timestamp",
        "confidence": 0.90,
        "reasoning": "Mapping creation time to timestamp"
      }
    ],
    "overallConfidence": 0.93,
    "warnings": []
  }
}
```

---

### Step 4: Add UI Component (1 hour)

#### 4.1 Create AI Mapping Button
Create `src/ui/components/ai-mapping-button.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from './button';
import { Sparkles, Loader2 } from 'lucide-react';

interface AIMappingButtonProps {
  sourceSchema: any;
  targetSchema: any;
  context?: string;
  onMappingGenerated: (mappings: any) => void;
}

export function AIMappingButton({
  sourceSchema,
  targetSchema,
  context,
  onMappingGenerated,
}: AIMappingButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/ai/suggest-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSchema,
          targetSchema,
          context,
        }),
      });

      const data = await response.json();
      if (data.success) {
        onMappingGenerated(data.data);
      }
    } catch (error) {
      console.error('Failed to generate mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          AI Suggest Mappings
        </>
      )}
    </Button>
  );
}
```

#### 4.2 Integrate into Workflow Builder
Update `src/ui/workflow/field-mapping-configurator.tsx`:

```typescript
import { AIMappingButton } from '@/ui/components/ai-mapping-button';

// Add this to your existing component
<div className="flex justify-between items-center mb-4">
  <h3>Field Mappings</h3>
  <AIMappingButton
    sourceSchema={sourceAction.outputSchema}
    targetSchema={targetAction.inputSchema}
    context={`Mapping ${sourceIntegration} to ${targetIntegration}`}
    onMappingGenerated={(mappings) => {
      // Auto-populate field mappings
      console.log('AI suggested mappings:', mappings);
      // TODO: Apply mappings to form
    }}
  />
</div>
```

---

## 📊 Success Checklist (Day 1)

After completing the above steps, you should have:

- [x] OpenAI API configured
- [x] AI service layer created
- [x] Field mapping service working
- [x] API endpoint tested
- [x] UI component created
- [x] First AI feature live! 🎉

---

## 🎯 Next Steps (Week 2, Days 2-7)

### Day 2: Enhanced Mapping
- Add integration-specific context
- Store successful mappings for learning
- Add confidence thresholds

### Day 3: Vector Store Setup
- Setup Pinecone (optional)
- Index integration schemas
- Implement similarity search

### Day 4: Error Classification
- Build error classification service
- Pattern matching for common errors
- AI classification for complex errors

### Day 5: Testing & Polish
- Comprehensive tests
- Error handling
- Cost monitoring
- Documentation

### Weekend: Plan Week 3
- Review progress
- Adjust timeline if needed
- Prepare for next features

---

## 💰 Cost Monitoring

### Track Gemini API Usage
Create `src/services/ai/usage-tracker.ts`:

```typescript
import { prisma } from '@/lib/prisma';

export async function trackAIUsage(
  feature: string,
  tokens: number,
  cost: number
) {
  await prisma.aiUsage.create({
    data: {
      feature,
      tokens,
      cost,
    },
  });
}

export async function getMonthlyUsage() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usage = await prisma.aiUsage.aggregate({
    where: {
      createdAt: { gte: startOfMonth },
    },
    _sum: {
      tokens: true,
      cost: true,
    },
  });

  return {
    tokens: usage._sum.tokens || 0,
    cost: usage._sum.cost || 0,
  };
}
```

### Add to Prisma Schema
```prisma
model AIUsage {
  id        String   @id @default(cuid())
  feature   String
  tokens    Int
  cost      Float
  createdAt DateTime @default(now())
}
```

### Gemini Pricing (Much Cheaper!)
**Free Tier**:
- 15 requests/minute
- 1 million tokens/day
- 1,500 requests/day

**Paid Tier** (if you exceed free tier):
- Input: $0.00035 per 1K tokens
- Output: $0.0014 per 1K tokens
- **~100x cheaper than GPT-4!**

---

## 🚨 Common Issues & Solutions

### Issue: Gemini API Key Not Working
```bash
# Check if key is set
echo $GOOGLE_GEMINI_API_KEY

# Test with curl
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$GOOGLE_GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

### Issue: Rate Limits (Free Tier)
- **Free tier**: 15 requests/minute, 1M tokens/day
- Implement request queuing
- Add caching for repeated requests
- Consider upgrading if needed (still very cheap!)

### Issue: JSON Parsing Errors
- Gemini sometimes wraps JSON in markdown code blocks
- The service handles this automatically
- If issues persist, add more explicit JSON instructions

### Cost Optimization (Already Very Cheap!)
- **Free tier is generous**: 1M tokens/day
- Cache results aggressively
- Implement usage limits per account
- Monitor with usage tracker

---

## 📚 Resources

### Documentation
- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Gemini Node.js SDK](https://github.com/google/generative-ai-js)

### Learning
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [Gemini Cookbook](https://github.com/google-gemini/cookbook)
- [Google AI Blog](https://blog.google/technology/ai/)

### Community
- [Google AI Discord](https://discord.gg/google-ai)
- [r/GoogleAI](https://reddit.com/r/GoogleAI)

---

## 🎉 Celebrate Your Progress!

You've completed Week 1 and started Week 2! Here's what you've built:

✅ **11 Production Integrations**  
✅ **Error Recovery System**  
✅ **Comprehensive Documentation**  
✅ **Modern UI with Search**  
✅ **AI Infrastructure Setup** ← You are here!  
🚧 **AI Field Mapping** ← Building now  

**Next milestone**: Complete AI field mapping by end of Week 3

---

**Ready to continue? Follow the detailed plan in `PHASE_2_ROADMAP.md`**

Let's build AI-powered automation! 🚀

