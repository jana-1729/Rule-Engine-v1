import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch all integrations from database
    const integrations = await prisma.integration.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        category: true,
        logo: true,
        color: true,
        authType: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      integrations,
    });
  } catch (error) {
    console.error('Failed to fetch integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

