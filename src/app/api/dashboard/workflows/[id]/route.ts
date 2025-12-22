import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(
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

    // Delete the workflow
    await prisma.workflow.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting workflow:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { id } = params;

    // Fetch workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        app: {
          select: {
            id: true,
            name: true,
            appId: true,
            accountId: true,
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

    return NextResponse.json({
      success: true,
      workflow,
    });
  } catch (error: any) {
    console.error('Error fetching workflow:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

