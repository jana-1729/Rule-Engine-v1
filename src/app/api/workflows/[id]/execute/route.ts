import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { workflowExecutor } from '@/services/workflow-executor';
import { z } from 'zod';

const executeSchema = z.object({
  endUserId: z.string().optional(),
  input: z.any().optional(),
});

/**
 * POST /api/workflows/[id]/execute
 * Execute a workflow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id: workflowId } = params;
    const body = await request.json();
    const { endUserId, input } = executeSchema.parse(body);

    // Get app ID (for now, use first app)
    const app = await prisma.app.findFirst({
      where: { accountId: session.userId },
    });

    if (!app) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'App not found' } },
        { status: 404 }
      );
    }

    // Use provided endUserId or default
    const effectiveEndUserId = endUserId || 'demo-user-1';

    console.info(`[API] Executing workflow: ${workflowId}`);

    // Execute workflow
    const result = await workflowExecutor.execute(
      workflowId,
      effectiveEndUserId,
      app.id,
      input
    );

    const duration = Date.now() - startTime;

    console.info(`[API] Workflow execution ${result.status}: ${workflowId} (${duration}ms)`);

    return NextResponse.json({
      success: result.status === 'completed',
      execution: {
        id: result.executionId,
        status: result.status,
        output: result.output,
        error: result.error,
        duration: result.duration,
        nodeResults: result.nodeResults,
        logs: result.logs,
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[API] Failed to execute workflow:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
          meta: {
            duration,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error.message || 'Failed to execute workflow',
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        meta: {
          duration,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

