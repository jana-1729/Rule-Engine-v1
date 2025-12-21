import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Fetch integration from database
    const integration = await prisma.integration.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        actions: true,
        logo: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Parse actions from JSON
    const actions = integration.actions ? 
      (typeof integration.actions === 'string' ? 
        JSON.parse(integration.actions) : integration.actions) : 
      {};

    // Convert actions object to array
    const actionsArray = Object.entries(actions).map(([key, value]: [string, any]) => ({
      id: value.id || key,
      name: value.name || key,
      description: value.description || '',
      slug: key,
    }));

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        slug: integration.slug,
        name: integration.name,
        logo: integration.logo,
      },
      actions: actionsArray,
    });
  } catch (error) {
    console.error('Failed to fetch actions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch actions' },
      { status: 500 }
    );
  }
}
