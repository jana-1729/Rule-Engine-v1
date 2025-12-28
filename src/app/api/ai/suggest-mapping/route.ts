/**
 * AI Field Mapping API Endpoint
 * 
 * POST /api/ai/suggest-mapping
 * 
 * Suggests intelligent field mappings between integrations using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiFieldMapper } from '@/services/ai-mapping-service';
import { getSession } from '@/lib/session';

const requestSchema = z.object({
  sourceIntegration: z.string(),
  targetIntegration: z.string(),
  sourceAction: z.string(),
  targetAction: z.string(),
  sourceSchema: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string().optional(),
    required: z.boolean().optional(),
  })),
  targetSchema: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string().optional(),
    required: z.boolean().optional(),
  })),
  context: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validatedData = requestSchema.parse(body);

    // Generate AI-powered mapping suggestions
    const result = await aiFieldMapper.suggestMapping(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI mapping error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate mapping suggestions',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Learn from mapping feedback
 * 
 * POST /api/ai/suggest-mapping/feedback
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mapping, feedback, context } = body;

    await aiFieldMapper.learnFromMapping(mapping, feedback, context);

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded',
    });
  } catch (error) {
    console.error('Feedback error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to record feedback',
        },
      },
      { status: 500 }
    );
  }
}

