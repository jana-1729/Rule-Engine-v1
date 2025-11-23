import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { generateApiKey, hashApiKey, getKeyPrefix } from '@/lib/auth';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const createAppSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { name, description } = createAppSchema.parse(body);

    // Generate app ID and API key
    const appId = `app_${nanoid(16)}`;
    const apiKey = generateApiKey(appId);
    const apiKeyHash = hashApiKey(apiKey);

    // Create app and API key version in transaction
    const result = await prisma.$transaction(async (tx) => {
      const app = await tx.app.create({
        data: {
          accountId: session.accountId,
          appId,
          apiKey: apiKeyHash,
          name,
          description,
          status: 'active',
        },
      });

      await tx.apiKeyVersion.create({
        data: {
          appId: app.id,
          keyHash: apiKeyHash,
          keyPrefix: getKeyPrefix(apiKey),
          status: 'active',
        },
      });

      return { app, apiKey };
    });

    return NextResponse.json(
      {
        success: true,
        app: {
          id: result.app.id,
          appId: result.app.appId,
          name: result.app.name,
          apiKey: result.apiKey, // Show once on creation
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

    return NextResponse.json(
      { error: 'Failed to create app' },
      { status: 500 }
    );
  }
}

