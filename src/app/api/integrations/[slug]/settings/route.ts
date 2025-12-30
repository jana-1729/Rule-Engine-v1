import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';
import { z } from 'zod';

const settingsSchema = z.object({
  credentialMode: z.enum(['platform', 'custom']),
  customClientId: z.string().optional().nullable(),
  customClientSecret: z.string().optional().nullable(),
  customScopes: z.array(z.string()).optional().default([]),
});

/**
 * GET /api/integrations/[slug]/settings
 * Get integration settings for the current app
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const startTime = Date.now();
  
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { slug } = params;

    // Get integration
    const integration = await prisma.integration.findUnique({
      where: { slug },
    });

    if (!integration) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Integration not found' } },
        { status: 404 }
      );
    }

    // Get app (for now, get the first app - in production, this should come from session)
    const app = await prisma.app.findFirst({
      where: { accountId: session.userId },
    });

    if (!app) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'App not found' } },
        { status: 404 }
      );
    }

    // Get app integration settings
    const appIntegration = await prisma.appIntegration.findUnique({
      where: {
        appId_integrationId: {
          appId: app.id,
          integrationId: integration.id,
        },
      },
    });

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      settings: appIntegration ? {
        id: appIntegration.id,
        credentialMode: appIntegration.credentialMode,
        customClientId: appIntegration.customClientId ? await decrypt(appIntegration.customClientId) : null,
        customScopes: appIntegration.customScopes,
        lastTestedAt: appIntegration.lastTestedAt,
        testStatus: appIntegration.testStatus,
      } : null,
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[API] Failed to get integration settings:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to get integration settings',
        },
        meta: {
          duration,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/[slug]/settings
 * Save integration settings for the current app
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const startTime = Date.now();
  
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { slug } = params;
    const body = await request.json();
    const validatedData = settingsSchema.parse(body);

    // Get integration
    const integration = await prisma.integration.findUnique({
      where: { slug },
    });

    if (!integration) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Integration not found' } },
        { status: 404 }
      );
    }

    // Get app
    const app = await prisma.app.findFirst({
      where: { accountId: session.userId },
    });

    if (!app) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'App not found' } },
        { status: 404 }
      );
    }

    // Validate custom credentials if mode is custom
    if (validatedData.credentialMode === 'custom') {
      if (!validatedData.customClientId) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Client ID is required for custom credentials' } },
          { status: 400 }
        );
      }
    }

    // Encrypt credentials if provided
    let encryptedClientId = null;
    let encryptedClientSecret = null;

    if (validatedData.credentialMode === 'custom') {
      if (validatedData.customClientId) {
        encryptedClientId = await encrypt(validatedData.customClientId);
      }
      if (validatedData.customClientSecret) {
        encryptedClientSecret = await encrypt(validatedData.customClientSecret);
      }
    }

    // Get existing settings to preserve secret if not provided
    const existingSettings = await prisma.appIntegration.findUnique({
      where: {
        appId_integrationId: {
          appId: app.id,
          integrationId: integration.id,
        },
      },
    });

    // Upsert app integration settings
    const appIntegration = await prisma.appIntegration.upsert({
      where: {
        appId_integrationId: {
          appId: app.id,
          integrationId: integration.id,
        },
      },
      create: {
        appId: app.id,
        integrationId: integration.id,
        credentialMode: validatedData.credentialMode,
        customClientId: encryptedClientId,
        customClientSecret: encryptedClientSecret,
        customScopes: validatedData.customScopes || [],
        enabled: true,
      },
      update: {
        credentialMode: validatedData.credentialMode,
        customClientId: encryptedClientId || existingSettings?.customClientId,
        customClientSecret: encryptedClientSecret || existingSettings?.customClientSecret,
        customScopes: validatedData.customScopes || [],
        updatedAt: new Date(),
      },
    });

    const duration = Date.now() - startTime;
    console.info(`[API] Integration settings saved for ${slug} (mode: ${validatedData.credentialMode})`);

    return NextResponse.json({
      success: true,
      settings: {
        id: appIntegration.id,
        credentialMode: appIntegration.credentialMode,
        lastTestedAt: appIntegration.lastTestedAt,
        testStatus: appIntegration.testStatus,
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[API] Failed to save integration settings:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
          meta: {
            duration,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to save integration settings',
        },
        meta: {
          duration,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

