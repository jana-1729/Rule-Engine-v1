/**
 * AI-Powered Field Mapping Service
 * 
 * Uses OpenAI to intelligently suggest field mappings between integrations
 */

import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface FieldSchema {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
}

export interface MappingSuggestion {
  source: string;
  target: string;
  confidence: number;
  reasoning?: string;
}

export interface MappingRequest {
  sourceIntegration: string;
  targetIntegration: string;
  sourceAction: string;
  targetAction: string;
  sourceSchema: FieldSchema[];
  targetSchema: FieldSchema[];
  context?: string;
}

export interface MappingResponse {
  suggestions: MappingSuggestion[];
  unmappedSource: string[];
  unmappedTarget: string[];
}

/**
 * AI Field Mapper Service
 */
export class AIFieldMapperService {
  /**
   * Suggest field mappings using AI
   */
  async suggestMapping(request: MappingRequest): Promise<MappingResponse> {
    try {
      const prompt = this.buildPrompt(request);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert at mapping data fields between different APIs and integrations. 
Your task is to suggest intelligent field mappings based on field names, types, and descriptions. 
Always respond with valid JSON matching the specified schema.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more deterministic results
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0].message.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(responseText);
      
      return {
        suggestions: result.suggestions || [],
        unmappedSource: result.unmappedSource || [],
        unmappedTarget: result.unmappedTarget || [],
      };
    } catch (error) {
      console.error('AI mapping failed:', error);
      
      // Fallback to simple name-based matching
      return this.fallbackMapping(request);
    }
  }

  /**
   * Build the prompt for OpenAI
   */
  private buildPrompt(request: MappingRequest): string {
    return `
Map fields from ${request.sourceIntegration} ${request.sourceAction} to ${request.targetIntegration} ${request.targetAction}.

${request.context ? `Context: ${request.context}\n` : ''}

Source Fields:
${request.sourceSchema.map(f => `- ${f.name} (${f.type})${f.description ? `: ${f.description}` : ''}${f.required ? ' [required]' : ''}`).join('\n')}

Target Fields:
${request.targetSchema.map(f => `- ${f.name} (${f.type})${f.description ? `: ${f.description}` : ''}${f.required ? ' [required]' : ''}`).join('\n')}

Provide mappings in this JSON format:
{
  "suggestions": [
    {
      "source": "source_field_name",
      "target": "target_field_name",
      "confidence": 0.95,
      "reasoning": "Brief explanation of why this mapping makes sense"
    }
  ],
  "unmappedSource": ["source_fields_with_no_match"],
  "unmappedTarget": ["target_fields_with_no_match"]
}

Rules:
1. Confidence should be 0.0 to 1.0
2. Only suggest mappings with confidence > 0.7
3. Consider field names, types, and descriptions
4. Prefer exact or semantic matches
5. List fields that couldn't be mapped
`;
  }

  /**
   * Fallback mapping using simple name matching
   */
  private fallbackMapping(request: MappingRequest): MappingResponse {
    const suggestions: MappingSuggestion[] = [];
    const unmappedSource: string[] = [];
    const unmappedTarget: string[] = [];

    const targetFieldNames = new Set(request.targetSchema.map(f => f.name.toLowerCase()));
    const mappedTargets = new Set<string>();

    // Try exact name matches
    for (const sourceField of request.sourceSchema) {
      const sourceLower = sourceField.name.toLowerCase();
      let matched = false;

      for (const targetField of request.targetSchema) {
        const targetLower = targetField.name.toLowerCase();
        
        if (sourceLower === targetLower && !mappedTargets.has(targetLower)) {
          suggestions.push({
            source: sourceField.name,
            target: targetField.name,
            confidence: 0.9,
            reasoning: 'Exact name match',
          });
          mappedTargets.add(targetLower);
          matched = true;
          break;
        }
      }

      if (!matched) {
        // Try partial matches
        for (const targetField of request.targetSchema) {
          const targetLower = targetField.name.toLowerCase();
          
          if ((sourceLower.includes(targetLower) || targetLower.includes(sourceLower)) && 
              !mappedTargets.has(targetLower)) {
            suggestions.push({
              source: sourceField.name,
              target: targetField.name,
              confidence: 0.75,
              reasoning: 'Partial name match',
            });
            mappedTargets.add(targetLower);
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        unmappedSource.push(sourceField.name);
      }
    }

    // Find unmapped target fields
    for (const targetField of request.targetSchema) {
      if (!mappedTargets.has(targetField.name.toLowerCase())) {
        unmappedTarget.push(targetField.name);
      }
    }

    return { suggestions, unmappedSource, unmappedTarget };
  }

  /**
   * Learn from user feedback on mappings
   */
  async learnFromMapping(
    mapping: MappingSuggestion,
    feedback: 'accept' | 'reject',
    context: Partial<MappingRequest>
  ): Promise<void> {
    // TODO: Store feedback in database for future improvements
    // This could be used to fine-tune the AI model or improve fallback logic
    
    console.log('Learning from mapping feedback:', {
      mapping,
      feedback,
      context: {
        sourceIntegration: context.sourceIntegration,
        targetIntegration: context.targetIntegration,
      },
    });
  }
}

// Singleton instance
export const aiFieldMapper = new AIFieldMapperService();

