import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { apiKeyService } from '@/services/api-key-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify app belongs to this account
    const app = await prisma.app.findFirst({
      where: {
        id: params.id,
        accountId: session.accountId,
      },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Rotate the API key
    const result = await apiKeyService.rotateKey(params.id);

    return NextResponse.json({
      success: true,
      apiKey: result.newKey, // Return the new key (only time it's shown)
      message: 'API key regenerated successfully',
      rotatedAt: result.rotatedAt,
    });
  } catch (error) {
    console.error('Failed to regenerate API key:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate API key' },
      { status: 500 }
    );
  }
}

