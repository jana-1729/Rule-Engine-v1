import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fieldMappingService } from '@/services/ai/field-mapping-service';

const requestSchema = z.object({
  sourceSchema: z.record(z.any()),
  targetSchema: z.record(z.any()),
  context: z.string().optional(),
});

/**
 * AI Field Mapping Endpoint
 * POST /api/v1/ai/suggest-mapping
 * 
 * Generates intelligent field mapping suggestions between two schemas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = requestSchema.parse(body);

    // Convert plain objects to Zod schemas
    const sourceSchema = z.object(
      Object.fromEntries(
        Object.entries(data.sourceSchema).map(([key, value]: [string, any]) => [
          key,
          z.any().describe(value.description || ''),
        ])
      )
    );

    const targetSchema = z.object(
      Object.fromEntries(
        Object.entries(data.targetSchema).map(([key, value]: [string, any]) => [
          key,
          z.any().describe(value.description || ''),
        ])
      )
    );

    // Generate mapping suggestions
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
    
    // Handle specific error types
    if (error.message?.includes('not available')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'AI service not configured. Please set GOOGLE_GEMINI_API_KEY.',
          code: 'AI_SERVICE_UNAVAILABLE'
        },
        { status: 503 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid request data',
          details: error.errors,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to generate mapping suggestions',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * Get AI service status
 * GET /api/v1/ai/suggest-mapping
 */
export async function GET() {
  const { geminiService } = await import('@/services/ai/gemini-service');
  
  return NextResponse.json({
    success: true,
    data: geminiService.getStatus(),
  });
}

