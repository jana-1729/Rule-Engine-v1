import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const app = await prisma.app.findFirst({
      where: {
        id: params.id,
        accountId: session.accountId,
      },
      include: {
        _count: {
          select: {
            connections: true,
            executions: true,
            endUsers: true,
          },
        },
      },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Don't return the actual API key hash
    const { apiKey, ...appData } = app;

    return NextResponse.json({
      app: {
        ...appData,
        apiKey: '***hidden***', // Masked for security
      },
    });
  } catch (error) {
    console.error('Failed to fetch app:', error);
    return NextResponse.json(
      { error: 'Failed to fetch app' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, status } = body;

    // Verify app belongs to this account
    const existingApp = await prisma.app.findFirst({
      where: {
        id: params.id,
        accountId: session.accountId,
      },
    });

    if (!existingApp) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Update app
    const app = await prisma.app.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            connections: true,
            executions: true,
            endUsers: true,
          },
        },
      },
    });

    return NextResponse.json({ app });
  } catch (error) {
    console.error('Failed to update app:', error);
    return NextResponse.json(
      { error: 'Failed to update app' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify app belongs to this account
    const existingApp = await prisma.app.findFirst({
      where: {
        id: params.id,
        accountId: session.accountId,
      },
    });

    if (!existingApp) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Delete app (cascade will delete related records)
    await prisma.app.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete app:', error);
    return NextResponse.json(
      { error: 'Failed to delete app' },
      { status: 500 }
    );
  }
}

