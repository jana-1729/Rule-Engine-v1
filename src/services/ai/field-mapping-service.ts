import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { geminiServiceEnhanced as geminiService } from './gemini-service-enhanced';
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

/**
 * AI-Powered Field Mapping Service
 * Uses Gemini AI to intelligently suggest field mappings between integrations
 * 
 * Features:
 * - Automatic field mapping suggestions
 * - Context-aware mapping
 * - Learning from previous mappings
 * - Confidence scores
 * - Transformation suggestions
 */
class FieldMappingService {
  /**
   * Suggest field mappings between two schemas
   */
  async suggestMapping(
    sourceSchema: z.ZodType,
    targetSchema: z.ZodType,
    context?: string
  ): Promise<MappingSuggestion> {
    if (!geminiService.getHealth().available) {
      throw new Error('Gemini AI service not available. Please configure GOOGLE_GEMINI_API_KEY.');
    }

    try {
      // Convert Zod schemas to JSON Schema
      const sourceJson = zodToJsonSchema(sourceSchema, 'sourceSchema');
      const targetJson = zodToJsonSchema(targetSchema, 'targetSchema');

      // Build the prompt
      const prompt = this.buildMappingPrompt(
        sourceJson,
        targetJson,
        context
      );

      // Get AI suggestions with enhanced service
      const response = await geminiService.chatWithJSON([
        {
          role: 'system',
          content: 'You are an expert at mapping data between different API schemas. Provide accurate field mappings with confidence scores.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ], {
        useCache: true,
        cacheTTL: 3600, // Cache for 1 hour
        temperature: 0.7 // Lower temperature for more consistent results
      });

      // Extract the actual suggestion (without _meta)
      const { _meta, ...suggestion } = response;

      // Log usage
      console.log(`Field mapping: ${_meta.usage.totalTokens} tokens, $${_meta.usage.estimatedCost.toFixed(6)}, cached: ${_meta.cached}`);

      // Validate response structure
      this.validateMappingSuggestion(suggestion);

      return suggestion as MappingSuggestion;
    } catch (error: any) {
      console.error('Field mapping error:', error);
      throw new Error(`Failed to generate field mappings: ${error.message}`);
    }
  }

  /**
   * Suggest mappings with integration context
   */
  async suggestMappingWithIntegrations(
    sourceIntegration: string,
    sourceAction: string,
    sourceSchema: z.ZodType,
    targetIntegration: string,
    targetAction: string,
    targetSchema: z.ZodType,
    context?: string
  ): Promise<MappingSuggestion> {
    // Find similar mappings from history
    const similarMappings = await schemaCacheService.findSimilarSchemas(
      `${sourceIntegration} ${sourceAction} to ${targetIntegration} ${targetAction}`,
      3
    );

    // Build enhanced context
    const enhancedContext = context 
      ? `${context}\n\nMapping from ${sourceIntegration} (${sourceAction}) to ${targetIntegration} (${targetAction})`
      : `Mapping from ${sourceIntegration} (${sourceAction}) to ${targetIntegration} (${targetAction})`;

    // Add similar mappings to context if available
    let similarMappingsText = '';
    if (similarMappings.length > 0) {
      similarMappingsText = '\n\nSimilar mappings from history:\n' + 
        JSON.stringify(similarMappings.slice(0, 2), null, 2);
    }

    // Get suggestions
    const suggestion = await this.suggestMapping(
      sourceSchema,
      targetSchema,
      enhancedContext + similarMappingsText
    );

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

  /**
   * Build the AI prompt for field mapping
   */
  private buildMappingPrompt(
    sourceSchema: any,
    targetSchema: any,
    context?: string
  ): string {
    return `
Map fields from the source schema to the target schema.

SOURCE SCHEMA:
${JSON.stringify(sourceSchema, null, 2)}

TARGET SCHEMA:
${JSON.stringify(targetSchema, null, 2)}

${context ? `CONTEXT: ${context}` : ''}

Analyze both schemas and provide intelligent field mappings. Consider:
1. Field name similarity
2. Data type compatibility
3. Semantic meaning
4. Common naming conventions
5. Nested object structures

Provide a JSON response with this exact structure:
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
  "warnings": ["any potential issues or ambiguities"]
}

Rules:
1. Use dot notation for nested fields (e.g., "user.email")
2. Confidence should be 0-1 (1 = certain, 0 = uncertain)
3. Include transformation if data type conversion is needed
4. Provide clear reasoning for each mapping
5. Flag any ambiguous or risky mappings in warnings
6. Only map fields that have clear correspondence
`;
  }

  /**
   * Store mapping pattern for future learning
   */
  private async storeMappingPattern(
    sourceIntegration: string,
    sourceAction: string,
    targetIntegration: string,
    targetAction: string,
    suggestion: MappingSuggestion
  ): Promise<void> {
    try {
      await schemaCacheService.indexSchema(
        `mapping-${sourceIntegration}-${targetIntegration}`,
        `${sourceAction}-${targetAction}`,
        suggestion,
        {
          type: 'mapping',
          confidence: suggestion.overallConfidence,
          sourceIntegration,
          sourceAction,
          targetIntegration,
          targetAction,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error('Failed to store mapping pattern:', error);
      // Don't throw - this is optional learning feature
    }
  }

  /**
   * Validate mapping suggestion structure
   */
  private validateMappingSuggestion(suggestion: any): void {
    if (!suggestion || typeof suggestion !== 'object') {
      throw new Error('Invalid mapping suggestion: not an object');
    }

    if (!Array.isArray(suggestion.mappings)) {
      throw new Error('Invalid mapping suggestion: mappings must be an array');
    }

    if (typeof suggestion.overallConfidence !== 'number') {
      throw new Error('Invalid mapping suggestion: overallConfidence must be a number');
    }

    if (!Array.isArray(suggestion.warnings)) {
      throw new Error('Invalid mapping suggestion: warnings must be an array');
    }

    // Validate each mapping
    for (const mapping of suggestion.mappings) {
      if (!mapping.sourceField || !mapping.targetField) {
        throw new Error('Invalid mapping: missing sourceField or targetField');
      }
      if (typeof mapping.confidence !== 'number') {
        throw new Error('Invalid mapping: confidence must be a number');
      }
    }
  }

  /**
   * Record user feedback on mapping suggestions
   */
  async recordFeedback(
    mappingId: string,
    feedback: 'accept' | 'reject' | 'modify',
    modifications?: Partial<FieldMapping>[]
  ): Promise<void> {
    // TODO: Implement feedback storage for future model improvement
    console.log(`Feedback recorded for ${mappingId}:`, feedback, modifications);
  }
}

// Export singleton instance
export const fieldMappingService = new FieldMappingService();

// Export class for testing
export { FieldMappingService };

