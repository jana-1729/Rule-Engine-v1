import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API Route: Get Workflow Executions
 * GET /api/workflows/[id]/executions
 * 
 * Returns execution history for a workflow
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {
      workflowId: params.id,
    };

    if (status) {
      where.status = status;
    }

    // Get executions
    const [executions, total] = await Promise.all([
      prisma.workflowExecution.findMany({
        where,
        include: {
          stepLogs: {
            orderBy: { stepNumber: 'asc' },
          },
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.workflowExecution.count({ where }),
    ]);

    // Calculate statistics
    const stats = {
      total,
      success: executions.filter(e => e.status === 'success').length,
      failed: executions.filter(e => e.status === 'failed').length,
      running: executions.filter(e => e.status === 'running').length,
      averageDuration: executions.reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length,
    };

    return NextResponse.json({
      executions,
      stats,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
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

