import { NextRequest, NextResponse } from 'next/server';
import { integrationRegistry, loadIntegrations } from '@/integrations/registry';

/**
 * GET /api/integrations
 * 
 * Fetches all available integrations from the registry
 */
export async function GET(request: NextRequest) {
  try {
    // Ensure integrations are loaded
    await loadIntegrations();
    
    // Get all integrations from registry
    const allIntegrations = integrationRegistry.list();
    
    // Transform to API format
    const integrations = allIntegrations.map((integration) => ({
      id: integration.metadata.id,
      slug: integration.metadata.slug,
      name: integration.metadata.name,
      description: integration.metadata.description,
      logo: integration.metadata.icon,
      category: integration.metadata.category,
      status: 'available',
      version: integration.metadata.version,
      authType: integration.metadata.authType,
      website: integration.metadata.website,
      documentation: integration.metadata.documentation,
      actionsCount: Object.keys(integration.actions).length,
      triggersCount: Object.keys(integration.triggers).length,
    }));
    
    return NextResponse.json({
      success: true,
      integrations,
      total: integrations.length,
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
