import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { generateApiKey, hashApiKey, getKeyPrefix } from '@/lib/auth';
import { nanoid } from 'nanoid';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createAppSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Fetch all apps for this account
    const apps = await prisma.app.findMany({
      where: {
        accountId: session.accountId,
      },
      select: {
        id: true,
        appId: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      apps,
    });
  } catch (error: any) {
    console.error('Failed to fetch apps:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch apps' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { name, description } = createAppSchema.parse(body);

    // Verify account exists
    const account = await prisma.account.findUnique({
      where: { id: session.accountId },
    });

    if (!account) {
      console.error('Account not found for session:', session.accountId);
      return NextResponse.json(
        { error: 'Account not found. Please log in again.' },
        { status: 400 }
      );
    }

    // Generate app ID and API key
    const appId = `app_${nanoid(16)}`;
    const apiKey = generateApiKey(appId);
    const apiKeyHash = hashApiKey(apiKey);

    // Create app
    const app = await prisma.app.create({
      data: {
        accountId: session.accountId,
        appId,
        apiKey: apiKeyHash,
        name,
        description,
        status: 'active',
      },
    });

    return NextResponse.json(
      {
        success: true,
        app: {
          id: app.id,
          appId: app.appId,
          name: app.name,
          apiKey: apiKey, // Show once on creation
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('App creation error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    // Handle Prisma foreign key constraint errors
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid account reference. Please log in again.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create app' },
      { status: 500 }
    );
  }
}

