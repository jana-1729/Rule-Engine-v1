import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/integrations
 * 
 * Fetches all available integrations from the database
 */
export async function GET(request: NextRequest) {
  try {
    // Get all integrations from database
    const integrations = await prisma.integrations.findMany({
      where: {
        status: 'available',
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
    
    // Transform to API format
    const formattedIntegrations = integrations.map((integration) => {
      const actions = integration.actions as any;
      const triggers = integration.triggers as any;
      
      return {
        id: integration.id,
        slug: integration.slug,
        name: integration.name,
        description: integration.description || '',
        logo: integration.logo || '',
        category: integration.category,
        status: integration.status,
        version: integration.version,
        authType: integration.authType,
        website: integration.website || '',
        actionsCount: actions ? Object.keys(actions).length : 0,
        triggersCount: triggers ? Object.keys(triggers).length : 0,
      };
    });
    
    return NextResponse.json({
      success: true,
      integrations: formattedIntegrations,
      total: formattedIntegrations.length,
    });
  } catch (error) {
    console.error('Failed to fetch integrations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch integrations',
      },
      { status: 500 }
    );
  }
}
