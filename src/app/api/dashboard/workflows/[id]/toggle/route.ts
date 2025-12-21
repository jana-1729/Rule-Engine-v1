import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { id } = params;

    // Check if workflow exists and belongs to user's account
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        app: {
          select: {
            accountId: true,
          },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    if (workflow.app.accountId !== session.accountId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Toggle the enabled status
    const updatedWorkflow = await prisma.workflow.update({
      where: { id },
      data: {
        enabled: !workflow.enabled,
      },
    });

    return NextResponse.json({
      success: true,
      workflow: {
        id: updatedWorkflow.id,
        enabled: updatedWorkflow.enabled,
      },
      message: `Workflow ${updatedWorkflow.enabled ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error: any) {
    console.error('Error toggling workflow:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to toggle workflow status' },
      { status: 500 }
    );
  }
}

