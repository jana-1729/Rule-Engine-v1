import { NextRequest, NextResponse } from 'next/server';
import { integrationRegistry } from '@/integrations/registry';
import { prisma } from '@/lib/prisma';

/**
 * API Route: List Integrations
 * GET /api/integrations
 * 
 * Returns available integrations and connection status
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const category = searchParams.get('category');

    // Get all integrations from registry
    let integrations = integrationRegistry.list();

    // Filter by category if specified
    if (category) {
      integrations = integrations.filter(i => i.metadata.category === category);
    }

    // If organizationId provided, include connection status
    let connections: any[] = [];
    if (organizationId) {
      connections = await prisma.connection.findMany({
        where: { organizationId },
        include: { integration: true },
      });
    }

    // Map integrations with connection status
    const result = integrations.map(integration => {
      const userConnections = connections.filter(
        c => c.integration.slug === integration.metadata.slug
      );

      return {
        ...integration.metadata,
        isConnected: userConnections.length > 0,
        connectionCount: userConnections.length,
        connections: userConnections.map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          lastUsedAt: c.lastUsedAt,
        })),
        actions: Object.keys(integration.actions).map(key => ({
          id: key,
          name: integration.actions[key].name,
          description: integration.actions[key].description,
        })),
        triggers: Object.keys(integration.triggers).map(key => ({
          id: key,
          name: integration.triggers[key].name,
          description: integration.triggers[key].description,
        })),
      };
    });

    // Group by category
    const categories = Array.from(new Set(result.map(i => i.category)));
    const grouped = categories.map(cat => ({
      category: cat,
      integrations: result.filter(i => i.category === cat),
    }));

    return NextResponse.json({
      integrations: result,
      grouped,
      total: result.length,
    });
  } catch (error: any) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

