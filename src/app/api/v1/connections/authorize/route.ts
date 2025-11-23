import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiKey } from '@/lib/auth';
import { nanoid } from 'nanoid';
import { integrationRegistry } from '@/integrations/registry';

/**
 * Initialize OAuth Flow for End User
 * 
 * POST /api/v1/connections/authorize
 * 
 * Company X calls this to get an OAuth URL for their end-user to connect
 * 
 * Body:
 * {
 *   "endUserId": "user-123-from-company-x",
 *   "integrationSlug": "slack",
 *   "redirectUri": "https://company-x.com/integrations/callback",
 *   "metadata": { "userName": "John Doe", "email": "john@example.com" }
 * }
 * 
 * Response:
 * {
 *   "authorizationUrl": "https://slack.com/oauth/authorize?client_id=...&state=...",
 *   "state": "state_abc123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401 }
      );
    }

    const app = await verifyApiKey(apiKey);
    if (!app) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Parse request
    const body = await request.json();
    const { endUserId, integrationSlug, redirectUri, metadata } = body;

    if (!endUserId || !integrationSlug || !redirectUri) {
      return NextResponse.json(
        { error: 'Missing required fields: endUserId, integrationSlug, redirectUri' },
        { status: 400 }
      );
    }

    // Get integration
    const integration = await prisma.integration.findUnique({
      where: { slug: integrationSlug },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Check if integration is enabled for this app
    const appIntegration = await prisma.appIntegration.findUnique({
      where: {
        appId_integrationId: {
          appId: app.id,
          integrationId: integration.id,
        },
      },
    });

    if (!appIntegration || !appIntegration.enabled) {
      return NextResponse.json(
        { error: 'Integration not enabled for your app' },
        { status: 403 }
      );
    }

    // Create or get end user
    let endUser = await prisma.endUser.findUnique({
      where: {
        appId_externalId: {
          appId: app.id,
          externalId: endUserId,
        },
      },
    });

    if (!endUser) {
      endUser = await prisma.endUser.create({
        data: {
          appId: app.id,
          externalId: endUserId,
          email: metadata?.email,
          name: metadata?.name,
          metadata: metadata || {},
        },
      });
    }

    // Generate OAuth state
    const state = `state_${nanoid(32)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.oAuthState.create({
      data: {
        state,
        appId: app.id,
        endUserId: endUser.id,
        integrationId: integration.id,
        redirectUri,
        expiresAt,
      },
    });

    // Build authorization URL based on auth type
    let authorizationUrl: string;

    if (integration.authType === 'oauth2') {
      const authConfig = integration.authConfig as any;
      
      const params = new URLSearchParams({
        client_id: authConfig.clientId || process.env[`${integrationSlug.toUpperCase()}_CLIENT_ID`] || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/connections/callback`,
        state,
        scope: (authConfig.scopes || []).join(' '),
        response_type: 'code',
      });

      authorizationUrl = `${authConfig.authorizationUrl}?${params.toString()}`;
    } else if (integration.authType === 'api_key') {
      // For API key auth, return a different flow
      return NextResponse.json({
        authType: 'api_key',
        state,
        instructions: 'Please provide your API key',
        fields: (integration.authConfig as any).fields || [
          { name: 'apiKey', label: 'API Key', type: 'password', required: true }
        ],
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported auth type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      authorizationUrl,
      state,
      expiresAt,
    });
  } catch (error: any) {
    console.error('Error initiating OAuth:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

