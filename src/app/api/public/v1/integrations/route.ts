/**
 * Public API: List Integrations
 * For customers to display available integrations to their end users
 * 
 * @swagger
 * /api/public/v1/integrations:
 *   get:
 *     summary: List available integrations
 *     tags: [Public API]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or description
 *     responses:
 *       200:
 *         description: List of integrations
 */

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
        actions: true,
        triggers: true,
        version: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get connection counts for this app
    const connectionCounts = await prisma.endUserConnection.groupBy({
      by: ['integrationId'],
      where: {
        appId: app.id,
        status: 'active',
      },
      _count: true,
    });

    const countMap = new Map(
      connectionCounts.map((c) => [c.integrationId, c._count])
    );

    // Format response
    const formattedIntegrations = integrations.map((integration) => ({
      id: integration.id,
      slug: integration.slug,
      name: integration.name,
      description: integration.description,
      category: integration.category,
      logo: integration.logo,
      color: integration.color,
      website: integration.website,
      authType: integration.authType,
      requiresEndUserAuth: integration.requiresEndUserAuth,
      version: integration.version,
      connectedUsers: countMap.get(integration.id) || 0,
      actions: Array.isArray(integration.actions) ? integration.actions : [],
      triggers: Array.isArray(integration.triggers) ? integration.triggers : [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        integrations: formattedIntegrations,
        total: formattedIntegrations.length,
      },
    });
  } catch (error: any) {
    console.error('Error listing integrations:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list integrations',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

