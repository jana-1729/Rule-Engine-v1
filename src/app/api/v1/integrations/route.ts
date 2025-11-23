import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiKey } from '@/lib/auth';

/**
 * List Available Integrations
 * 
 * GET /api/v1/integrations
 * 
 * Company X calls this to show which integrations they can offer to their users
 * 
 * Headers:
 *   X-API-Key: app_xxx_yyy
 */
export async function GET(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401 }
      );
    }

    const app = await verifyApiKey(apiKey);
    if (!app) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      status: 'available',
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get integrations
    const integrations = await prisma.integration.findMany({
      where,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        category: true,
        logo: true,
        color: true,
        website: true,
        authType: true,
        requiresEndUserAuth: true,
        requiresAppAuth: true,
        actions: true,
        triggers: true,
        version: true,
      },
      orderBy: { name: 'asc' },
    });

    // Check which integrations are enabled for this app
    const enabledIntegrations = await prisma.appIntegration.findMany({
      where: {
        appId: app.id,
        enabled: true,
      },
      select: {
        integrationId: true,
      },
    });

    const enabledIds = new Set(enabledIntegrations.map(i => i.integrationId));

    // Add connection stats per integration
    const connectionCounts = await prisma.endUserConnection.groupBy({
      by: ['integrationId'],
      where: {
        appId: app.id,
        status: 'active',
      },
      _count: true,
    });

    const countMap = new Map(
      connectionCounts.map(c => [c.integrationId, c._count])
    );

    // Format response
    const result = integrations.map(integration => ({
      ...integration,
      enabled: enabledIds.has(integration.id),
      connectedUsers: countMap.get(integration.id) || 0,
    }));

    return NextResponse.json({
      integrations: result,
      total: result.length,
    });
  } catch (error: any) {
    console.error('Error listing integrations:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

