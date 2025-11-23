import { NextRequest, NextResponse } from 'next/server';
import { enqueueWorkflow } from '@/services/queue-service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * API Route: Execute Workflow
 * POST /api/workflows/execute
 * 
 * Enqueues a workflow for execution
 */

const executeSchema = z.object({
  workflowId: z.string(),
  triggerPayload: z.any().optional(),
  triggerSource: z.string().optional().default('manual'),
  priority: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const data = executeSchema.parse(body);

    // Get workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id: data.workflowId },
      select: {
        id: true,
        name: true,
        status: true,
        organizationId: true,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Check if workflow is active
    if (workflow.status !== 'active') {
      return NextResponse.json(
        { error: 'Workflow is not active' },
        { status: 400 }
      );
    }

    // Enqueue workflow
    const jobId = await enqueueWorkflow(
      workflow.id,
      workflow.organizationId,
      data.triggerPayload || {},
      data.triggerSource,
      {
        priority: data.priority,
      }
    );

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Workflow queued for execution',
    });
  } catch (error: any) {
    console.error('Error executing workflow:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

