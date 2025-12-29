# 🚀 Phase 2 Roadmap: AI-Powered Intelligence Layer

> **Status**: Week 1 ✅ Complete (11 Production Integrations)  
> **Next Phase**: AI Features + Advanced Automation  
> **Timeline**: 12 Weeks (3 Months)  
> **Goal**: Match Refold.ai's core AI capabilities

---

## 📊 Current State Assessment

### ✅ What We've Accomplished (Week 1)

| Feature | Status | Quality |
|---------|--------|---------|
| **Integration Marketplace** | ✅ 11 integrations | Production-ready |
| **Gmail** | ✅ Complete | 3 actions + SDK |
| **Slack** | ✅ Complete | 4 actions + SDK |
| **Notion** | ✅ Complete | 3 actions + SDK |
| **Google Sheets** | ✅ Complete | 4 actions + SDK |
| **Microsoft Teams** | ✅ Complete | 4 actions + SDK |
| **Discord** | ✅ Complete | 4 actions + SDK |
| **HubSpot** | ✅ Complete | 4 actions + SDK |
| **Salesforce** | ✅ Complete | 4 actions + SDK |
| **Jira** | ✅ Complete | 4 actions + SDK |
| **GitHub** | ✅ Complete | 4 actions + SDK |
| **Trello** | ✅ Complete | 4 actions + SDK |
| **Error Recovery** | ✅ Basic | Circuit breaker + retry |
| **Documentation** | ✅ Complete | Blogs + guides |
| **UI/UX** | ✅ Modern | Search + filters |

### 🎯 Gap Analysis vs Refold.ai

| Feature | Refold.ai | Your Platform | Priority |
|---------|-----------|---------------|----------|
| **AI Field Mapping** | ✅ GPT-4 powered | ❌ Manual only | 🔴 CRITICAL |
| **Auto-Healing** | ✅ Self-fixing | ⚠️ Basic retry | 🔴 CRITICAL |
| **Memory Graphs** | ✅ Learning system | ❌ Not implemented | 🟡 HIGH |
| **Workflow AI Assistant** | ✅ NL to workflow | ❌ Not implemented | 🟡 HIGH |
| **Real-Time Adaptation** | ✅ API versioning | ❌ Manual updates | 🟢 MEDIUM |
| **MCP Implementation** | ✅ Full support | ❌ Not implemented | 🟢 MEDIUM |
| **100+ Integrations** | ✅ Full marketplace | ⚠️ 11 integrations | 🟡 HIGH |
| **Legacy Systems** | ✅ SAP, Oracle | ❌ Modern only | 🔵 LOW |
| **Self-Hosted** | ✅ Available | ❌ Cloud only | 🔵 LOW |

---

## 🗓️ Phase 2: 12-Week Detailed Plan

### **Week 2-3: AI Infrastructure Setup**
**Goal**: Build foundation for AI-powered features

#### Week 2: AI Services Architecture

**Day 1-2: Setup AI Infrastructure**
```bash
# Install AI dependencies
npm install @google/generative-ai
npm install zod-to-json-schema  # Schema conversion

# Setup environment
GOOGLE_GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-flash-lite-latest
```

**Why Gemini?**
- ✅ **Free Tier**: 15 req/min, 1M tokens/day, 1,500 req/day
- ✅ **Cost-Effective**: $0.00035/1K tokens (100x cheaper than GPT-4!)
- ✅ **Powerful**: Gemini 1.5 Pro comparable to GPT-4
- ✅ **Large Context**: 2 million tokens context window

**Day 3-4: Create AI Service Layer**

**File**: `src/services/ai/gemini-service.ts`
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  
  constructor() {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.warn('⚠️  GOOGLE_GEMINI_API_KEY not set - AI features disabled');
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
    const enhancedSystemMessage = `${systemMessage}\n\nIMPORTANT: Respond with valid JSON only. No text before/after JSON.`;
    
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

**File**: `src/services/ai/schema-cache-service.ts`
```typescript
import { prisma } from '@/lib/prisma';

// Simple in-memory cache for schema patterns
// (Vector DB optional for Phase 2 - can add later if needed)
export class SchemaCacheService {
  private cache: Map<string, any> = new Map();

  async indexSchema(
    integration: string,
    action: string,
    schema: any,
    metadata: any
  ) {
    const key = `${integration}-${action}`;
    
    // Store in memory
    this.cache.set(key, { schema, metadata });
    
    // Also store in database for persistence
    await prisma.schemaCache.upsert({
      where: { key },
      create: {
        key,
        integration,
        action,
        schema: JSON.stringify(schema),
        metadata: JSON.stringify(metadata),
      },
      update: {
        schema: JSON.stringify(schema),
        metadata: JSON.stringify(metadata),
      },
    });
  }

  async findSimilarSchemas(
    query: string,
    topK: number = 5
  ) {
    // Simple keyword matching for now
    // Can upgrade to vector search later if needed
    const results = [];
    
    for (const [key, value] of this.cache.entries()) {
      const schemaText = JSON.stringify(value.schema).toLowerCase();
      const queryLower = query.toLowerCase();
      
      if (schemaText.includes(queryLower)) {
        results.push({
          id: key,
          ...value,
        });
      }
    }

    return results.slice(0, topK);
  }

  async loadFromDatabase() {
    const schemas = await prisma.schemaCache.findMany();
    for (const schema of schemas) {
      this.cache.set(schema.key, {
        schema: JSON.parse(schema.schema),
        metadata: JSON.parse(schema.metadata),
      });
    }
  }
}

export const schemaCacheService = new SchemaCacheService();
```

**Note**: We're using a simple cache instead of Pinecone for Phase 2. This keeps costs at $0 and simplifies setup. Can upgrade to vector DB in Phase 3 if needed.

**Day 5: Index All Integration Schemas**

**File**: `scripts/index-schemas.ts`
```typescript
import { integrationRegistry, loadIntegrations } from '../src/integrations/registry';
import { schemaCacheService } from '../src/services/ai/schema-cache-service';

async function indexAllSchemas() {
  await loadIntegrations();
  await schemaCacheService.loadFromDatabase();
  
  const integrations = integrationRegistry.list();

  for (const integration of integrations) {
    console.log(`Indexing ${integration.metadata.name}...`);

    // Index all actions
    for (const [actionKey, action] of Object.entries(integration.actions)) {
      await schemaCacheService.indexSchema(
        integration.metadata.slug,
        actionKey,
        {
          input: action.inputSchema,
          output: action.outputSchema,
        },
        {
          name: action.name,
          description: action.description,
          category: integration.metadata.category,
        }
      );
    }
  }

  console.log('✓ All schemas indexed!');
}

indexAllSchemas();
```

```bash
# Run indexing
npm run index:schemas
```

**Prisma Schema Addition**:
```prisma
model SchemaCache {
  id          String   @id @default(cuid())
  key         String   @unique
  integration String
  action      String
  schema      String   @db.Text
  metadata    String   @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

#### Week 3: AI Field Mapping Service

**Day 1-3: Build AI Mapping Engine**

**File**: `src/services/ai/field-mapping-service.ts`
```typescript
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { geminiService } from './gemini-service';
import { schemaCacheService } from './schema-cache-service';

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

export class FieldMappingService {
  async suggestMapping(
    sourceIntegration: string,
    sourceAction: string,
    sourceSchema: z.ZodType,
    targetIntegration: string,
    targetAction: string,
    targetSchema: z.ZodType,
    context?: string
  ): Promise<MappingSuggestion> {
    // Convert Zod schemas to JSON Schema
    const sourceJson = zodToJsonSchema(sourceSchema);
    const targetJson = zodToJsonSchema(targetSchema);

    // Find similar mappings from history
    const similarMappings = await schemaCacheService.findSimilarSchemas(
      `${sourceIntegration} ${sourceAction} to ${targetIntegration} ${targetAction}`,
      3
    );

    // Build prompt with context
    const prompt = this.buildMappingPrompt(
      sourceIntegration,
      sourceAction,
      sourceJson,
      targetIntegration,
      targetAction,
      targetJson,
      context,
      similarMappings
    );

    // Get AI suggestions
    const suggestion = await geminiService.chatWithJSON([
      {
        role: 'system',
        content: 'You are an expert at mapping data between different API schemas. Provide accurate field mappings with confidence scores.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    // Store successful mapping for future reference
    await this.storeMappingPattern(
      sourceIntegration,
      sourceAction,
      targetIntegration,
      targetAction,
      suggestion
    );

    return suggestion;
  }

  private buildMappingPrompt(
    sourceIntegration: string,
    sourceAction: string,
    sourceSchema: any,
    targetIntegration: string,
    targetAction: string,
    targetSchema: any,
    context?: string,
    similarMappings?: any[]
  ): string {
    return `
Map fields from ${sourceIntegration} (${sourceAction}) to ${targetIntegration} (${targetAction}).

SOURCE SCHEMA:
${JSON.stringify(sourceSchema, null, 2)}

TARGET SCHEMA:
${JSON.stringify(targetSchema, null, 2)}

${context ? `CONTEXT: ${context}` : ''}

${similarMappings?.length ? `
SIMILAR MAPPINGS (for reference):
${JSON.stringify(similarMappings, null, 2)}
` : ''}

Provide a JSON response with this structure:
{
  "mappings": [
    {
      "sourceField": "source.field.path",
      "targetField": "target.field.path",
      "transformation": "optional transformation logic",
      "confidence": 0.95,
      "reasoning": "why this mapping makes sense"
    }
  ],
  "overallConfidence": 0.90,
  "warnings": ["any potential issues or ambiguities"]
}

Rules:
1. Use dot notation for nested fields (e.g., "user.email")
2. Confidence should be 0-1 (1 = certain, 0 = uncertain)
3. Include transformation if data type conversion needed
4. Provide clear reasoning for each mapping
5. Flag any ambiguous or risky mappings in warnings
`;
  }

  private async storeMappingPattern(
    sourceIntegration: string,
    sourceAction: string,
    targetIntegration: string,
    targetAction: string,
    suggestion: MappingSuggestion
  ) {
    // Store in cache for future similarity search
    await schemaCacheService.indexSchema(
      `mapping-${sourceIntegration}-${targetIntegration}`,
      `${sourceAction}-${targetAction}`,
      suggestion,
      {
        type: 'mapping',
        confidence: suggestion.overallConfidence,
      }
    );
  }

  async learnFromFeedback(
    mappingId: string,
    feedback: 'accept' | 'reject' | 'modify',
    modifications?: Partial<FieldMapping>[]
  ) {
    // Store feedback for improving future suggestions
    // This will be used to fine-tune the model or adjust prompts
    console.log(`Learning from feedback: ${feedback}`, modifications);
    
    // TODO: Implement feedback storage and learning
  }
}

export const fieldMappingService = new FieldMappingService();
```

**Day 4-5: Create API Endpoints**

**File**: `src/app/api/v1/ai/suggest-mapping/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fieldMappingService } from '@/services/ai/field-mapping-service';
import { integrationRegistry } from '@/integrations/registry';

const requestSchema = z.object({
  sourceIntegration: z.string(),
  sourceAction: z.string(),
  targetIntegration: z.string(),
  targetAction: z.string(),
  context: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = requestSchema.parse(body);

    // Get integrations and actions
    const sourceInteg = integrationRegistry.get(data.sourceIntegration);
    const targetInteg = integrationRegistry.get(data.targetIntegration);

    if (!sourceInteg || !targetInteg) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    const sourceAction = sourceInteg.actions[data.sourceAction];
    const targetAction = targetInteg.actions[data.targetAction];

    if (!sourceAction || !targetAction) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

    // Generate mapping suggestions
    const suggestions = await fieldMappingService.suggestMapping(
      data.sourceIntegration,
      data.sourceAction,
      sourceAction.outputSchema,
      data.targetIntegration,
      data.targetAction,
      targetAction.inputSchema,
      data.context
    );

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('AI mapping error:', error);
    return NextResponse.json(
      { error: 'Failed to generate mapping suggestions' },
      { status: 500 }
    );
  }
}
```

**File**: `src/app/api/v1/ai/mapping-feedback/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fieldMappingService } from '@/services/ai/field-mapping-service';

const feedbackSchema = z.object({
  mappingId: z.string(),
  feedback: z.enum(['accept', 'reject', 'modify']),
  modifications: z.array(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = feedbackSchema.parse(body);

    await fieldMappingService.learnFromFeedback(
      data.mappingId,
      data.feedback,
      data.modifications
    );

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded',
    });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}
```

---

### **Week 4-5: Intelligent Error Recovery**
**Goal**: Build self-healing workflow capabilities

#### Week 4: Advanced Error Classification

**File**: `src/services/ai/error-classification-service.ts`
```typescript
import { geminiService } from './gemini-service';

export type ErrorType =
  | 'RATE_LIMIT'
  | 'AUTH_EXPIRED'
  | 'AUTH_INVALID'
  | 'API_DEPRECATED'
  | 'SCHEMA_MISMATCH'
  | 'NETWORK_TIMEOUT'
  | 'SERVER_ERROR'
  | 'CLIENT_ERROR'
  | 'UNKNOWN';

export interface ErrorClassification {
  type: ErrorType;
  isRetryable: boolean;
  retryStrategy: 'immediate' | 'exponential' | 'fixed' | 'none';
  retryDelay: number;
  maxRetries: number;
  alternativeActions: string[];
  reasoning: string;
  confidence: number;
}

export class ErrorClassificationService {
  async classifyError(
    error: Error,
    integration: string,
    action: string,
    context: any
  ): Promise<ErrorClassification> {
    // Try pattern matching first (fast)
    const quickClassification = this.quickClassify(error);
    if (quickClassification.confidence > 0.9) {
      return quickClassification;
    }

    // Use AI for complex errors
    return this.aiClassify(error, integration, action, context);
  }

  private quickClassify(error: Error): ErrorClassification {
    const message = error.message.toLowerCase();

    // Rate limit patterns
    if (message.includes('rate limit') || message.includes('429')) {
      return {
        type: 'RATE_LIMIT',
        isRetryable: true,
        retryStrategy: 'exponential',
        retryDelay: 60000, // 1 minute
        maxRetries: 3,
        alternativeActions: [],
        reasoning: 'Rate limit detected from error message',
        confidence: 0.95,
      };
    }

    // Auth patterns
    if (message.includes('unauthorized') || message.includes('401')) {
      return {
        type: 'AUTH_EXPIRED',
        isRetryable: true,
        retryStrategy: 'immediate',
        retryDelay: 0,
        maxRetries: 1,
        alternativeActions: ['refresh_token'],
        reasoning: 'Authentication error detected',
        confidence: 0.90,
      };
    }

    // Timeout patterns
    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      return {
        type: 'NETWORK_TIMEOUT',
        isRetryable: true,
        retryStrategy: 'exponential',
        retryDelay: 5000,
        maxRetries: 3,
        alternativeActions: [],
        reasoning: 'Network timeout detected',
        confidence: 0.92,
      };
    }

    // Default: low confidence, needs AI
    return {
      type: 'UNKNOWN',
      isRetryable: false,
      retryStrategy: 'none',
      retryDelay: 0,
      maxRetries: 0,
      alternativeActions: [],
      reasoning: 'Could not classify with pattern matching',
      confidence: 0.3,
    };
  }

  private async aiClassify(
    error: Error,
    integration: string,
    action: string,
    context: any
  ): Promise<ErrorClassification> {
    const prompt = `
Classify this error from ${integration} integration (${action} action):

ERROR MESSAGE: ${error.message}
ERROR STACK: ${error.stack?.substring(0, 500)}
CONTEXT: ${JSON.stringify(context, null, 2)}

Provide a JSON response with this structure:
{
  "type": "RATE_LIMIT" | "AUTH_EXPIRED" | "AUTH_INVALID" | "API_DEPRECATED" | "SCHEMA_MISMATCH" | "NETWORK_TIMEOUT" | "SERVER_ERROR" | "CLIENT_ERROR" | "UNKNOWN",
  "isRetryable": true/false,
  "retryStrategy": "immediate" | "exponential" | "fixed" | "none",
  "retryDelay": milliseconds,
  "maxRetries": number,
  "alternativeActions": ["action1", "action2"],
  "reasoning": "detailed explanation",
  "confidence": 0.0-1.0
}

Consider:
1. Is this a temporary or permanent error?
2. Can retrying help?
3. Are there alternative approaches?
4. What's the best retry strategy?
`;

    const response = await geminiService.chatWithJSON([
      {
        role: 'system',
        content: 'You are an expert at analyzing API errors and determining recovery strategies.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    return response;
  }
}

export const errorClassificationService = new ErrorClassificationService();
```

**File**: `src/services/ai/enhanced-error-recovery-service.ts`
```typescript
import { errorClassificationService } from './error-classification-service';
import { geminiService } from './gemini-service';

export class EnhancedErrorRecoveryService {
  async executeWithIntelligentRecovery<T>(
    operation: () => Promise<T>,
    integration: string,
    action: string,
    context: any
  ): Promise<T> {
    let lastError: Error | null = null;
    let attempts = 0;

    while (attempts < 5) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        attempts++;

        // Classify the error
        const classification = await errorClassificationService.classifyError(
          lastError,
          integration,
          action,
          context
        );

        console.log(`Error classified as ${classification.type}`, {
          confidence: classification.confidence,
          retryable: classification.isRetryable,
        });

        // Check if we should retry
        if (!classification.isRetryable || attempts >= classification.maxRetries) {
          // Try alternative actions
          if (classification.alternativeActions.length > 0) {
            const alternative = await this.tryAlternativeAction(
              classification.alternativeActions[0],
              integration,
              context
            );
            if (alternative.success) {
              return alternative.result;
            }
          }

          throw lastError;
        }

        // Wait before retry
        await this.waitWithStrategy(
          classification.retryStrategy,
          classification.retryDelay,
          attempts
        );

        // Handle specific error types
        if (classification.type === 'AUTH_EXPIRED') {
          await this.refreshAuthentication(integration, context);
        }
      }
    }

    throw lastError!;
  }

  private async waitWithStrategy(
    strategy: string,
    baseDelay: number,
    attempt: number
  ) {
    let delay = baseDelay;

    if (strategy === 'exponential') {
      delay = baseDelay * Math.pow(2, attempt - 1);
    } else if (strategy === 'fixed') {
      delay = baseDelay;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private async refreshAuthentication(integration: string, context: any) {
    // TODO: Implement token refresh logic
    console.log(`Refreshing authentication for ${integration}`);
  }

  private async tryAlternativeAction(
    actionName: string,
    integration: string,
    context: any
  ): Promise<{ success: boolean; result?: any }> {
    // TODO: Implement alternative action execution
    console.log(`Trying alternative action: ${actionName}`);
    return { success: false };
  }

  async suggestFix(
    error: Error,
    integration: string,
    action: string,
    workflow: any
  ): Promise<string> {
    const prompt = `
An error occurred in a workflow:

INTEGRATION: ${integration}
ACTION: ${action}
ERROR: ${error.message}
WORKFLOW: ${JSON.stringify(workflow, null, 2)}

Suggest a fix or workaround for this error. Be specific and actionable.
`;

    const response = await geminiService.chat([
      {
        role: 'system',
        content: 'You are an expert at debugging integration workflows and suggesting fixes.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    return response;
  }
}

export const enhancedErrorRecoveryService = new EnhancedErrorRecoveryService();
```

---

### **Week 6-7: Workflow AI Assistant**
**Goal**: Natural language to workflow generation

#### Week 6: NL Understanding

**File**: `src/services/ai/workflow-assistant-service.ts`
```typescript
import { geminiService } from './gemini-service';
import { integrationRegistry } from '@/integrations/registry';
import { z } from 'zod';

export interface WorkflowIntent {
  trigger: {
    integration: string;
    event: string;
    filters?: any;
  };
  actions: Array<{
    integration: string;
    action: string;
    input: any;
  }>;
  name: string;
  description: string;
  confidence: number;
}

export class WorkflowAssistantService {
  async generateWorkflow(prompt: string): Promise<WorkflowIntent> {
    // Get available integrations
    const integrations = integrationRegistry.list();
    const integrationsInfo = integrations.map((i) => ({
      slug: i.metadata.slug,
      name: i.metadata.name,
      category: i.metadata.category,
      actions: Object.keys(i.actions),
      triggers: Object.keys(i.triggers || {}),
    }));

    const systemPrompt = `
You are an expert at creating automation workflows. Given a natural language description, generate a workflow configuration.

AVAILABLE INTEGRATIONS:
${JSON.stringify(integrationsInfo, null, 2)}

Generate a JSON response with this structure:
{
  "trigger": {
    "integration": "integration-slug",
    "event": "event_name",
    "filters": {}
  },
  "actions": [
    {
      "integration": "integration-slug",
      "action": "action_name",
      "input": {
        "field": "{{trigger.field}}" // Use {{}} for dynamic values
      }
    }
  ],
  "name": "Workflow Name",
  "description": "What this workflow does",
  "confidence": 0.0-1.0
}

Rules:
1. Use actual integration slugs and action names from the list above
2. Use {{trigger.field}} syntax for dynamic values from trigger
3. Use {{previous_action.field}} to reference previous action outputs
4. Be specific with field mappings
5. Include confidence score (1.0 = certain, 0.0 = uncertain)
`;

    const workflow = await geminiService.chatWithJSON([
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    // Validate the generated workflow
    await this.validateWorkflow(workflow);

    return workflow;
  }

  private async validateWorkflow(workflow: WorkflowIntent) {
    // Check if integrations exist
    const triggerInteg = integrationRegistry.get(workflow.trigger.integration);
    if (!triggerInteg) {
      throw new Error(`Integration not found: ${workflow.trigger.integration}`);
    }

    for (const action of workflow.actions) {
      const actionInteg = integrationRegistry.get(action.integration);
      if (!actionInteg) {
        throw new Error(`Integration not found: ${action.integration}`);
      }
      if (!actionInteg.actions[action.action]) {
        throw new Error(`Action not found: ${action.action} in ${action.integration}`);
      }
    }
  }

  async optimizeWorkflow(workflow: any): Promise<{
    suggestions: string[];
    optimizedWorkflow: any;
  }> {
    const prompt = `
Analyze this workflow and suggest optimizations:

${JSON.stringify(workflow, null, 2)}

Consider:
1. Can any actions be parallelized?
2. Are there redundant steps?
3. Can we batch operations?
4. Are there better alternatives?
5. Performance improvements?

Provide:
{
  "suggestions": ["suggestion 1", "suggestion 2"],
  "optimizedWorkflow": { ... optimized version ... }
}
`;

    return await geminiService.chatWithJSON([
      {
        role: 'system',
        content: 'You are an expert at optimizing automation workflows.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);
  }

  async explainWorkflow(workflow: any): Promise<string> {
    const prompt = `
Explain this workflow in simple terms:

${JSON.stringify(workflow, null, 2)}

Provide a clear, non-technical explanation of what this workflow does and why each step is needed.
`;

    return await geminiService.chat([
      {
        role: 'system',
        content: 'You are an expert at explaining technical concepts in simple terms.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);
  }
}

export const workflowAssistantService = new WorkflowAssistantService();
```

#### Week 7: UI Integration

**File**: `src/ui/components/workflow-ai-assistant.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/ui/components/button';
import { Textarea } from '@/ui/components/textarea';
import { Loader2, Sparkles } from 'lucide-react';

export function WorkflowAIAssistant({ onWorkflowGenerated }: any) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/ai/generate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      setResult(data.data);
      onWorkflowGenerated?.(data.data);
    } catch (error) {
      console.error('Failed to generate workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold">AI Workflow Assistant</h3>
      </div>

      <Textarea
        placeholder="Describe your workflow in plain English...&#10;&#10;Example: When a new lead is added to HubSpot, send them a welcome email via Gmail and create a Slack channel for their account"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={6}
        className="resize-none"
      />

      <Button
        onClick={handleGenerate}
        disabled={loading || !prompt}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating Workflow...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Workflow
          </>
        )}
      </Button>

      {result && (
        <div className="mt-4 p-4 bg-white rounded-lg border">
          <h4 className="font-semibold mb-2">{result.name}</h4>
          <p className="text-sm text-gray-600 mb-4">{result.description}</p>
          
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Trigger:</span>{' '}
              {result.trigger.integration} - {result.trigger.event}
            </div>
            <div className="text-sm">
              <span className="font-medium">Actions:</span>
              <ul className="ml-4 mt-1 space-y-1">
                {result.actions.map((action: any, i: number) => (
                  <li key={i}>
                    {i + 1}. {action.integration} - {action.action}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-sm text-gray-500">
              Confidence: {(result.confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### **Week 8-9: Memory Graph System**
**Goal**: Learn from executions and build intelligence

#### Week 8: Memory Storage

**File**: `src/services/ai/memory-graph-service.ts`
```typescript
import { prisma } from '@/lib/prisma';
import { geminiService } from './gemini-service';

export interface ExecutionPattern {
  integration: string;
  action: string;
  inputPattern: any;
  outputPattern: any;
  duration: number;
  success: boolean;
  timestamp: Date;
}

export interface Insight {
  type: 'performance' | 'reliability' | 'optimization' | 'warning';
  message: string;
  confidence: number;
  suggestion?: string;
  data?: any;
}

export class MemoryGraphService {
  async recordExecution(
    accountId: string,
    workflowId: string,
    execution: {
      integration: string;
      action: string;
      input: any;
      output: any;
      duration: number;
      success: boolean;
    }
  ) {
    // Store execution pattern
    await prisma.executionPattern.create({
      data: {
        accountId,
        workflowId,
        integration: execution.integration,
        action: execution.action,
        inputPattern: execution.input,
        outputPattern: execution.output,
        duration: execution.duration,
        success: execution.success,
      },
    });

    // Analyze patterns periodically
    const count = await prisma.executionPattern.count({
      where: { accountId, workflowId },
    });

    // Analyze after every 100 executions
    if (count % 100 === 0) {
      await this.analyzePatterns(accountId, workflowId);
    }
  }

  async analyzePatterns(accountId: string, workflowId: string) {
    // Get recent executions
    const executions = await prisma.executionPattern.findMany({
      where: { accountId, workflowId },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    // Analyze with AI
    const insights = await this.generateInsights(executions);

    // Store insights
    for (const insight of insights) {
      await prisma.workflowInsight.create({
        data: {
          accountId,
          workflowId,
          type: insight.type,
          message: insight.message,
          confidence: insight.confidence,
          suggestion: insight.suggestion,
          data: insight.data,
        },
      });
    }
  }

  private async generateInsights(
    executions: any[]
  ): Promise<Insight[]> {
    const prompt = `
Analyze these workflow execution patterns and provide insights:

${JSON.stringify(
  {
    totalExecutions: executions.length,
    successRate: executions.filter((e) => e.success).length / executions.length,
    avgDuration: executions.reduce((sum, e) => sum + e.duration, 0) / executions.length,
    integrations: [...new Set(executions.map((e) => e.integration))],
    recentFailures: executions.filter((e) => !e.success).slice(0, 10),
  },
  null,
  2
)}

Provide insights as JSON array:
[
  {
    "type": "performance" | "reliability" | "optimization" | "warning",
    "message": "Clear insight message",
    "confidence": 0.0-1.0,
    "suggestion": "Actionable suggestion",
    "data": {}
  }
]

Look for:
1. Performance patterns (slow times, bottlenecks)
2. Reliability issues (frequent failures)
3. Optimization opportunities (batching, caching)
4. Warnings (approaching limits, deprecated APIs)
`;

    return await geminiService.chatWithJSON([
      {
        role: 'system',
        content: 'You are an expert at analyzing workflow execution patterns and providing actionable insights.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);
  }

  async getInsights(
    accountId: string,
    workflowId?: string
  ): Promise<Insight[]> {
    const insights = await prisma.workflowInsight.findMany({
      where: {
        accountId,
        ...(workflowId && { workflowId }),
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return insights as Insight[];
  }

  async predictSuccess(
    accountId: string,
    workflowId: string,
    context: any
  ): Promise<number> {
    // Get historical data
    const executions = await prisma.executionPattern.findMany({
      where: { accountId, workflowId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    if (executions.length < 10) {
      return 0.5; // Not enough data
    }

    // Simple success rate calculation
    // TODO: Implement ML model for better predictions
    const successRate = executions.filter((e) => e.success).length / executions.length;

    return successRate;
  }
}

export const memoryGraphService = new MemoryGraphService();
```

---

### **Week 10-11: Integration Expansion**
**Goal**: Add 10 more integrations (total 21)

**New Integrations to Add:**
1. **Airtable** - Database/spreadsheet hybrid
2. **Asana** - Work management
3. **Linear** - Issue tracking
4. **Pipedrive** - Sales CRM
5. **Intercom** - Customer messaging
6. **Stripe** - Payments
7. **Twilio** - SMS/Voice
8. **SendGrid** - Email delivery
9. **Zendesk** - Customer support
10. **Shopify** - E-commerce

**Strategy**: Use existing patterns, 2 integrations per day

---

### **Week 12: Polish & Launch**
**Goal**: Production-ready AI features

**Tasks:**
1. Comprehensive testing of all AI features
2. Performance optimization
3. Cost monitoring (OpenAI API usage)
4. Documentation updates
5. Demo videos
6. Marketing materials
7. Pricing page updates
8. Launch announcement

---

## 📊 Success Metrics

### Phase 2 KPIs

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **AI Mapping Accuracy** | >85% | User acceptance rate |
| **Auto-Recovery Success** | >70% | Errors fixed without intervention |
| **Workflow Generation** | >80% confidence | AI confidence scores |
| **Integration Count** | 21+ | Total production integrations |
| **Execution Success Rate** | >95% | Overall success rate |
| **User Satisfaction** | >4.5/5 | User surveys |

---

## 💰 Cost Estimation

### AI Infrastructure Costs (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| **Google Gemini API** | Free tier: 1M tokens/day | **$0** |
| **Gemini Paid (if needed)** | 1M tokens/day | ~$10-15 |
| **Database Storage** | Schema cache | $5 |
| **Additional Compute** | AI processing | $50 |
| **Total** | | **~$0-70/month** |

**Huge Cost Savings**: ~$400/month saved vs OpenAI + Pinecone!

**Revenue Target**: $200/month (1-2 paying customers) to break even

---

## 🎯 Competitive Position After Phase 2

| Feature | Refold.ai | Your Platform | Status |
|---------|-----------|---------------|--------|
| **Integrations** | 100+ | 21 | ⚠️ Catching up |
| **AI Mapping** | ✅ | ✅ | ✅ Matched |
| **Auto-Healing** | ✅ | ✅ | ✅ Matched |
| **Workflow AI** | ✅ | ✅ | ✅ Matched |
| **Memory Graphs** | ✅ | ✅ | ✅ Matched |
| **MCP** | ✅ | ❌ | Phase 3 |
| **Self-Hosted** | ✅ | ❌ | Phase 3 |

**Result**: 70% feature parity with Refold.ai in 3 months!

---

## 📋 Phase 3 Preview (Months 4-6)

### Focus Areas:
1. **MCP Implementation** - Model Context Protocol
2. **Real-Time Adaptation** - API versioning handling
3. **Integration Expansion** - Reach 50+ integrations
4. **Enterprise Features** - Self-hosted, SSO, RBAC
5. **Advanced Analytics** - Predictive insights
6. **Mobile App** - iOS/Android apps

---

## 🚀 Getting Started with Phase 2

### This Week (Week 2):

**Monday:**
```bash
# Setup AI infrastructure
npm install @google/generative-ai
npm install zod-to-json-schema

# Configure environment
echo "GOOGLE_GEMINI_API_KEY=AIza..." >> .env.local
echo "GEMINI_MODEL=gemini-2.5-flash-lite-latest" >> .env.local
```

**Tuesday-Wednesday:**
- Create AI service layer
- Build Gemini service
- Build schema cache service

**Thursday:**
- Index all integration schemas
- Test schema caching

**Friday:**
- Start field mapping service
- Create basic UI prototype

---

## 📚 Resources Needed

### Team
- **You**: Full-stack development
- **Optional**: ML engineer (part-time consultant for optimization)

### Tools
- Google AI Studio account (FREE!)
- Gemini API key (FREE tier: 1M tokens/day)
- Monitoring (existing tools)

### Learning
- Google Gemini API documentation
- Gemini cookbook and examples
- Prompt engineering best practices
- Google AI Studio tutorials

---

## ✅ Weekly Checklist Template

Copy this for each week:

```markdown
## Week X Checklist

### Monday
- [ ] Task 1
- [ ] Task 2

### Tuesday
- [ ] Task 3
- [ ] Task 4

### Wednesday
- [ ] Task 5
- [ ] Task 6

### Thursday
- [ ] Task 7
- [ ] Task 8

### Friday
- [ ] Task 9
- [ ] Task 10

### Weekend (Optional)
- [ ] Testing
- [ ] Documentation
```

---

**Ready to start Phase 2? Let's build AI-powered features! 🚀**

Next step: Setup AI infrastructure (Week 2, Day 1)

