import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fieldMappingService } from '@/services/ai/field-mapping-service';

const feedbackSchema = z.object({
  mappingId: z.string(),
  feedback: z.enum(['accept', 'reject', 'modify']),
  modifications: z.array(z.any()).optional(),
});

/**
 * AI Mapping Feedback Endpoint
 * POST /api/v1/ai/mapping-feedback
 * 
 * Records user feedback on AI-generated mappings for continuous improvement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = feedbackSchema.parse(body);

    await fieldMappingService.recordFeedback(
      data.mappingId,
      data.feedback,
      data.modifications
    );

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully',
    });
  } catch (error: any) {
    console.error('Feedback error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid request data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to record feedback' 
      },
      { status: 500 }
    );
  }
}

