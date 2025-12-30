import { NextRequest, NextResponse } from 'next/server';
import { integrationSchemaService } from '@/services/integration-schema-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/[slug]/actions/[actionId]/schema
 * 
 * Fetch dynamic schema for a specific action from the integration plugin
 * This endpoint converts Zod schemas to JSON format for the frontend
 * 
 * Query params:
 * - context: Optional JSON context for dynamic fields
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; actionId: string } }
) {
  const startTime = Date.now();
  
  try {
    const { slug, actionId } = params;
    const { searchParams } = new URL(request.url);
    
    // Parse optional context for dynamic fields
    let context: Record<string, any> | undefined;
    const contextParam = searchParams.get('context');
    if (contextParam) {
      try {
        context = JSON.parse(contextParam);
      } catch (error) {
        console.warn('[API] Invalid context parameter:', error);
      }
    }

    // Fetch dynamic schema from integration plugin
    const schema = await integrationSchemaService.getActionSchema(
      slug,
      actionId,
      context
    );

    const duration = Date.now() - startTime;

    console.info(`[API] Fetched schema for ${slug}.${actionId} with ${schema.fields.length} fields in ${duration}ms`);

    return NextResponse.json({
      success: true,
      data: {
        schema,
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
        source: 'plugin', // Indicates schema is from plugin Zod definition
        cached: duration < 10, // Quick response indicates cache hit
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[API] Failed to fetch action schema:', error);

    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';

    if (error.message.includes('not found in registry')) {
      statusCode = 404;
      errorCode = 'INTEGRATION_NOT_FOUND';
    } else if (error.message.includes('Action') && error.message.includes('not found')) {
      statusCode = 404;
      errorCode = 'ACTION_NOT_FOUND';
    } else if (error.message.includes('No input schema')) {
      statusCode = 500;
      errorCode = 'SCHEMA_NOT_DEFINED';
    }

    return NextResponse.json(
      { 
        success: false,
        error: {
          code: errorCode,
          message: error.message || 'Failed to fetch action schema',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        meta: {
          duration,
          timestamp: new Date().toISOString(),
        },
      },
      { status: statusCode }
    );
  }
}
