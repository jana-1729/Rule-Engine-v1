import OpenAI from 'openai';
import { FieldSchema, FieldMapping } from '../integrations/types';
import { prisma } from '../lib/prisma';

/**
 * AI Service
 * Provides AI-assisted field mapping and workflow generation
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate field mappings using AI
 */
export async function generateFieldMappings(
  sourceSchema: FieldSchema[],
  targetSchema: FieldSchema[],
  organizationId: string,
  context?: string
): Promise<{
  mappings: FieldMapping[];
  confidence: number;
  explanation: string;
}> {
  console.log('🤖 Generating AI field mappings...');

  const prompt = buildMappingPrompt(sourceSchema, targetSchema, context);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert at data mapping and transformation. 
Generate field mappings between source and target schemas. 
Return ONLY valid JSON with this structure:
{
  "mappings": [
    {
      "source": "$.fieldName",
      "target": "$.fieldName",
      "transform": { "type": "...", "config": {...} }
    }
  ],
  "confidence": 0.95,
  "explanation": "Brief explanation of the mapping logic"
}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Store AI-generated mapping for future reference
    await prisma.aiGeneratedMapping.create({
      data: {
        organizationId,
        sourceSchema: sourceSchema as any,
        targetSchema: targetSchema as any,
        mapping: result.mappings,
        confidence: result.confidence || 0.8,
        model: 'gpt-4-turbo-preview',
      },
    });

    console.log(`✓ Generated ${result.mappings.length} field mappings (confidence: ${result.confidence})`);

    return {
      mappings: result.mappings,
      confidence: result.confidence || 0.8,
      explanation: result.explanation || 'AI-generated mapping',
    };
  } catch (error) {
    console.error('AI mapping generation failed:', error);
    throw error;
  }
}

/**
 * Build prompt for field mapping
 */
function buildMappingPrompt(
  sourceSchema: FieldSchema[],
  targetSchema: FieldSchema[],
  context?: string
): string {
  let prompt = `Generate field mappings from source schema to target schema.\n\n`;

  if (context) {
    prompt += `Context: ${context}\n\n`;
  }

  prompt += `Source Schema:\n${JSON.stringify(sourceSchema, null, 2)}\n\n`;
  prompt += `Target Schema:\n${JSON.stringify(targetSchema, null, 2)}\n\n`;

  prompt += `Rules:
- Match fields by name similarity and type compatibility
- Use transformations when needed (format-date, to-uppercase, etc.)
- Use JSONPath for nested fields (e.g., "$.user.name")
- Provide confidence score (0-1)
- Only map fields that have clear matches`;

  return prompt;
}

/**
 * Generate workflow from natural language description
 */
export async function generateWorkflowFromDescription(
  description: string,
  organizationId: string
): Promise<any> {
  console.log('🤖 Generating workflow from description...');

  const prompt = `Generate a workflow definition from this description:

"${description}"

Available integrations: google_sheets, notion, slack

Return ONLY valid JSON matching this structure:
{
  "name": "Workflow name",
  "description": "Brief description",
  "trigger": {
    "integration": "google_sheets",
    "trigger": "new_row",
    "config": {}
  },
  "steps": [
    {
      "id": "step-1",
      "name": "Step name",
      "integration": "notion",
      "action": "create_page",
      "input": {
        "mappings": [],
        "static": {}
      }
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating integration workflows. Generate valid workflow definitions from natural language descriptions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const workflow = JSON.parse(response.choices[0].message.content || '{}');

    console.log(`✓ Generated workflow: ${workflow.name}`);

    return workflow;
  } catch (error) {
    console.error('Workflow generation failed:', error);
    throw error;
  }
}

/**
 * Suggest fixes for failed workflow step
 */
export async function suggestStepFix(
  stepDefinition: any,
  error: any,
  executionContext: any
): Promise<{
  suggestions: string[];
  fixedStep?: any;
}> {
  console.log('🤖 Analyzing error and suggesting fixes...');

  const prompt = `A workflow step failed with this error:

Step: ${JSON.stringify(stepDefinition, null, 2)}
Error: ${JSON.stringify(error, null, 2)}
Context: ${JSON.stringify(executionContext, null, 2)}

Analyze the error and suggest:
1. Possible causes
2. Recommended fixes
3. Corrected step definition if possible

Return JSON:
{
  "suggestions": ["suggestion 1", "suggestion 2"],
  "fixedStep": { /* corrected step or null */ }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at debugging integration workflows. Analyze errors and provide actionable fixes.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      suggestions: result.suggestions || [],
      fixedStep: result.fixedStep,
    };
  } catch (error) {
    console.error('Error analysis failed:', error);
    return {
      suggestions: ['Unable to analyze error. Please check logs for details.'],
    };
  }
}

/**
 * Explain what a workflow does in natural language
 */
export async function explainWorkflow(workflow: any): Promise<string> {
  const prompt = `Explain this workflow in simple terms:

${JSON.stringify(workflow, null, 2)}

Provide a clear, concise explanation that a non-technical user would understand.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are helpful at explaining technical workflows in simple, clear language.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || 'Unable to explain workflow';
  } catch (error) {
    console.error('Workflow explanation failed:', error);
    return 'Unable to explain workflow';
  }
}

