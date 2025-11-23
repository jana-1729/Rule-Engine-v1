import { NextRequest, NextResponse } from 'next/server';
import { generateFieldMappings } from '@/services/ai-service';
import { z } from 'zod';

/**
 * API Route: Generate Field Mapping
 * POST /api/ai/generate-mapping
 * 
 * Uses AI to generate field mappings between schemas
 */

const schema = z.object({
  sourceSchema: z.array(z.any()),
  targetSchema: z.array(z.any()),
  organizationId: z.string(),
  context: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    const result = await generateFieldMappings(
      data.sourceSchema,
      data.targetSchema,
      data.organizationId,
      data.context
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error generating mapping:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

