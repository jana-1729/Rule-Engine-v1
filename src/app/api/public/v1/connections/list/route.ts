/**
 * Public API: List Connections
 * Get all connections for an end user
 * 
 * @swagger
 * /api/public/v1/connections/list:
 *   get:
 *     summary: List end user connections
 *     tags: [Public API]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: endUserId
 *         required: true
 *         schema:
 *           type: string
 *         description: End user ID
 *       - in: query
 *         name: integrationSlug
 *         schema:
 *           type: string
 *         description: Filter by integration
 *     responses:
 *       200:
 *         description: List of connections
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiKeyService } from '@/services/api-key-service';

export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_API_KEY', message: 'API key is required' } },
        { status: 401 }
      );
    }

    const { valid, app } = await apiKeyService.validateKey(apiKey);
    if (!valid || !app) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_API_KEY', message: 'Invalid API key' } },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const endUserId = searchParams.get('endUserId');
    const integrationSlug = searchParams.get('integrationSlug');

    if (!endUserId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'endUserId is required',
          },
        },
        { status: 400 }
      );
    }

    // Get end user
    const endUser = await prisma.end_users.findFirst({
      where: {
        appId: app.id,
        externalId: endUserId,
      },
    });

    if (!endUser) {
      return NextResponse.json({
        success: true,
        data: {
          connections: [],
          total: 0,
        },
      });
    }

    // Build where clause
    const where: any = {
      appId: app.id,
      endUserId: endUser.id,
    };

    if (integrationSlug) {
      const integration = await prisma.integrations.findUnique({
        where: { slug: integrationSlug },
      });
      if (integration) {
        where.integrationId = integration.id;
      }
    }

    // Get connections
    const connections = await prisma.end_usersConnection.findMany({
      where,
      include: {
        integration: {
          select: {
            id: true,
            slug: true,
            name: true,
            logo: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response (don't expose tokens)
    const formattedConnections = connections.map((conn) => ({
      id: conn.id,
      integration: {
        id: conn.integrations.id,
        slug: conn.integrations.slug,
        name: conn.integrations.name,
        logo: conn.integrations.logo,
        category: conn.integrations.category,
      },
      status: conn.status,
      scope: conn.scope,
      createdAt: conn.createdAt.toISOString(),
      expiresAt: conn.expiresAt?.toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        connections: formattedConnections,
        total: formattedConnections.length,
      },
    });
  } catch (error: any) {
    console.error('Error listing connections:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list connections',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

