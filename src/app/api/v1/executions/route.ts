import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiKey } from '@/lib/auth';

/**
 * Get Executions (Logs)
 * 
 * GET /api/v1/executions
 * 
 * Company X calls this to view logs for all their end-users
 * 
 * Query params:
 *   ?endUserId=user-123         - Filter by end user
 *   ?integrationSlug=slack      - Filter by integration
 *   ?status=success             - Filter by status
 *   ?limit=50                   - Results per page
 *   ?offset=0                   - Pagination offset
 *   ?startDate=2024-01-01       - Filter by date range
 *   ?endDate=2024-01-31
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const endUserId = searchParams.get('endUserId');
    const integrationSlug = searchParams.get('integrationSlug');
    const status = searchParams.get('status');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {
      appId: app.id,
    };

    if (endUserId) {
      const endUser = await prisma.endUser.findUnique({
        where: {
          appId_externalId: {
            appId: app.id,
            externalId: endUserId,
          },
        },
      });
      if (endUser) {
        where.endUserId = endUser.id;
      }
    }

    if (integrationSlug) {
      const integration = await prisma.integration.findUnique({
        where: { slug: integrationSlug },
      });
      if (integration) {
        where.integrationId = integration.id;
      }
    }

    if (status) {
      where.status = status;
    }

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get executions
    const [executions, total] = await Promise.all([
      prisma.execution.findMany({
        where,
        include: {
          endUser: {
            select: {
              externalId: true,
              email: true,
              name: true,
            },
          },
          integration: {
            select: {
              slug: true,
              name: true,
              logo: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.execution.count({ where }),
    ]);

    // Calculate stats
    const stats = await prisma.execution.groupBy({
      by: ['status'],
      where: { appId: app.id },
      _count: true,
    });

    const statsMap = new Map(stats.map(s => [s.status, s._count]));

    return NextResponse.json({
      executions: executions.map(exec => ({
        id: exec.id,
        requestId: exec.requestId,
        endUser: {
          id: exec.endUser.externalId,
          email: exec.endUser.email,
          name: exec.endUser.name,
        },
        integration: {
          slug: exec.integration.slug,
          name: exec.integration.name,
          logo: exec.integration.logo,
        },
        action: exec.action,
        status: exec.status,
        input: exec.input,
        output: exec.output,
        error: exec.errorMessage ? {
          code: exec.errorCode,
          message: exec.errorMessage,
          details: exec.errorDetails,
        } : null,
        startedAt: exec.startedAt,
        finishedAt: exec.finishedAt,
        duration: exec.duration,
        retryCount: exec.retryCount,
      })),
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
      stats: {
        total,
        success: statsMap.get('success') || 0,
        failed: statsMap.get('failed') || 0,
        pending: statsMap.get('pending') || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching executions:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

