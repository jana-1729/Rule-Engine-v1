/**
 * Public API: Get Execution Logs
 * Get execution logs for workflows
 * 
 * @swagger
 * /api/public/v1/executions/logs:
 *   get:
 *     summary: Get execution logs
 *     tags: [Public API]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: endUserId
 *         schema:
 *           type: string
 *         description: Filter by end user
 *       - in: query
 *         name: workflowId
 *         schema:
 *           type: string
 *         description: Filter by workflow
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, failed, running, pending]
 *         description: Filter by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: Execution logs
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
    const workflowId = searchParams.get('workflowId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      appId: app.id,
    };

    if (endUserId) {
      const endUser = await prisma.endUser.findFirst({
        where: {
          appId: app.id,
          externalId: endUserId,
        },
      });
      if (endUser) {
        where.endUserId = endUser.id;
      }
    }

    if (workflowId) {
      where.workflowId = workflowId;
    }

    if (status) {
      where.status = status;
    }

    // Get executions
    const [executions, total] = await Promise.all([
      prisma.execution.findMany({
        where,
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
            },
          },
          integration: {
            select: {
              id: true,
              slug: true,
              name: true,
              logo: true,
            },
          },
          endUser: {
            select: {
              id: true,
              externalId: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.execution.count({ where }),
    ]);

    // Format response
    const formattedExecutions = executions.map((exec) => ({
      id: exec.id,
      workflow: exec.workflow,
      integration: exec.integration,
      endUser: {
        id: exec.endUser.externalId,
        email: exec.endUser.email,
        name: exec.endUser.name,
      },
      status: exec.status,
      input: exec.input,
      output: exec.output,
      error: exec.error,
      logs: exec.logs,
      createdAt: exec.createdAt.toISOString(),
      completedAt: exec.completedAt?.toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        executions: formattedExecutions,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error('Error getting execution logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get execution logs',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

