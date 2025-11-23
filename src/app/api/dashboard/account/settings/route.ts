import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const settingsSchema = z.object({
  accountName: z.string().min(1),
  userName: z.string().min(1),
  email: z.string().email(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { accountName, userName, email } = settingsSchema.parse(body);

    // Update account and user in transaction
    await prisma.$transaction([
      prisma.account.update({
        where: { id: session.accountId },
        data: { name: accountName },
      }),
      prisma.accountUser.update({
        where: { id: session.userId },
        data: {
          name: userName,
          email,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error: any) {
    console.error('Settings update error:', error);

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
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

