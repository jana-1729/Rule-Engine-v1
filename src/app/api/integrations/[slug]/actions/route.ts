import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { integrationSchemaService } from '@/services/integration-schema-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/[slug]/actions
 * 
 * Fetch available actions for an integration from the plugin registry
 * This endpoint now fetches actions dynamically from integration plugins,
 * not from the database!
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const startTime = Date.now();
  
  try {
    const { slug } = params;

    // Verify integration exists in database
    const integration = await prisma.integration.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        logo: true,
        category: true,
        status: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'INTEGRATION_NOT_FOUND',
            message: `Integration '${slug}' not found`,
          },
        },
        { status: 404 }
      );
    }

    // Check if integration is available
    if (integration.status !== 'available') {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'INTEGRATION_UNAVAILABLE',
            message: `Integration '${slug}' is currently ${integration.status}`,
          },
        },
        { status: 403 }
      );
    }

    // Fetch actions from integration plugin (not database!)
    const actions = await integrationSchemaService.getActions(slug);

    const duration = Date.now() - startTime;

    console.info(`[API] Fetched ${actions.length} actions for ${slug} in ${duration}ms`);

    return NextResponse.json({
      success: true,
      data: {
        integration: {
          id: integration.id,
          slug: integration.slug,
          name: integration.name,
          logo: integration.logo,
          category: integration.category,
        },
        actions,
        total: actions.length,
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
        source: 'plugin', // Indicates data is from plugin, not database
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[API] Failed to fetch actions:', error);

    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';

    if (error.message.includes('not found in registry')) {
      statusCode = 404;
      errorCode = 'PLUGIN_NOT_FOUND';
    }

    return NextResponse.json(
      { 
        success: false,
        error: {
          code: errorCode,
          message: error.message || 'Failed to fetch actions',
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
