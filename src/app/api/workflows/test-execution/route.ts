import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { workflowExecutor } from '@/services/workflow-executor';
import { z } from 'zod';

const testExecutionSchema = z.object({
  workflow: z.object({
    name: z.string(),
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
  }),
  input: z.any().optional(),
  endUserId: z.string().optional(),
});

/**
 * POST /api/workflows/test-execution
 * Test execute a workflow without saving it first
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { workflow, input, endUserId } = testExecutionSchema.parse(body);

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

    // Create a temporary workflow for testing
    // Get first integration for placeholder
    const firstIntegration = await prisma.integration.findFirst();
    if (!firstIntegration) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No integrations available' } },
        { status: 404 }
      );
    }

    const tempWorkflow = await prisma.workflow.create({
      data: {
        name: `[TEST] ${workflow.name}`,
        appId: app.id,
        integrationId: firstIntegration.id,
        definition: {
          nodes: workflow.nodes,
          edges: workflow.edges,
        },
        enabled: false, // Don't enable test workflows
      },
    });

    console.info(`[API] Test executing workflow: ${tempWorkflow.id}`);

    // Execute workflow
    const effectiveEndUserId = endUserId || 'demo-user-1';
    const result = await workflowExecutor.execute(
      tempWorkflow.id,
      effectiveEndUserId,
      app.id,
      input
    );

    // Clean up temporary workflow
    await prisma.workflow.delete({
      where: { id: tempWorkflow.id },
    });

    const duration = Date.now() - startTime;

    console.info(`[API] Test execution ${result.status} (${duration}ms)`);

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
    console.error('[API] Failed to test execute workflow:', error);

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
          message: error.message || 'Failed to test execute workflow',
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

