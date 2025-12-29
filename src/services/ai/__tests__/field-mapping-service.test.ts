import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { fieldMappingService } from '../field-mapping-service';
import { geminiService } from '../gemini-service';

describe('Field Mapping Service', () => {
  it('should suggest mappings between simple schemas', async () => {
    if (!geminiService.isAvailable()) {
      console.log('⚠️  Skipping test - Gemini not configured');
      return;
    }

    const sourceSchema = z.object({
      user_name: z.string(),
      user_email: z.string(),
      created_at: z.string(),
    });

    const targetSchema = z.object({
      name: z.string(),
      email: z.string(),
      timestamp: z.string(),
    });

    const result = await fieldMappingService.suggestMapping(
      sourceSchema,
      targetSchema,
      'Mapping user data from Slack to Notion'
    );

    expect(result).toHaveProperty('mappings');
    expect(result).toHaveProperty('overallConfidence');
    expect(result).toHaveProperty('warnings');
    expect(Array.isArray(result.mappings)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(typeof result.overallConfidence).toBe('number');
    expect(result.mappings.length).toBeGreaterThan(0);

    // Check first mapping structure
    const firstMapping = result.mappings[0];
    expect(firstMapping).toHaveProperty('sourceField');
    expect(firstMapping).toHaveProperty('targetField');
    expect(firstMapping).toHaveProperty('confidence');
    expect(firstMapping).toHaveProperty('reasoning');
    expect(typeof firstMapping.confidence).toBe('number');
    expect(firstMapping.confidence).toBeGreaterThanOrEqual(0);
    expect(firstMapping.confidence).toBeLessThanOrEqual(1);
  }, 60000); // 60 second timeout for AI processing

  it('should handle complex nested schemas', async () => {
    if (!geminiService.isAvailable()) {
      console.log('⚠️  Skipping test - Gemini not configured');
      return;
    }

    const sourceSchema = z.object({
      user: z.object({
        id: z.string(),
        profile: z.object({
          name: z.string(),
          email: z.string(),
        }),
      }),
    });

    const targetSchema = z.object({
      userId: z.string(),
      fullName: z.string(),
      contactEmail: z.string(),
    });

    const result = await fieldMappingService.suggestMapping(
      sourceSchema,
      targetSchema
    );

    expect(result.mappings.length).toBeGreaterThan(0);
    expect(result.overallConfidence).toBeGreaterThan(0);
  }, 60000);

  it('should throw error when Gemini is not available', async () => {
    if (geminiService.isAvailable()) {
      console.log('⚠️  Skipping test - Gemini is available');
      return;
    }

    const sourceSchema = z.object({ test: z.string() });
    const targetSchema = z.object({ test: z.string() });

    await expect(
      fieldMappingService.suggestMapping(sourceSchema, targetSchema)
    ).rejects.toThrow('not available');
  });
});

