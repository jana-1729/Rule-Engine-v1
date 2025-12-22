/**
 * Public API: Initiate Connection
 * Start OAuth flow for end user to connect an integration
 * 
 * @swagger
 * /api/public/v1/connections/connect:
 *   post:
 *     summary: Initiate OAuth connection for end user
 *     tags: [Public API]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - integrationSlug
 *               - endUserId
 *             properties:
 *               integrationSlug:
 *                 type: string
 *                 example: slack
 *               endUserId:
 *                 type: string
 *                 example: user-123
 *               redirectUri:
 *                 type: string
 *                 example: https://yourapp.com/integrations/callback
 *               metadata:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   name:
 *                     type: string
 *     responses:
 *       200:
 *         description: OAuth URL to redirect user to
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiKeyService } from '@/services/api-key-service';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_API_KEY', message: 'API key is required' } },
        { status: 401 }
      );
    }

    const { valid, app } = await apiKeyService.validateKey(apiKey);
    if (!valid || !app) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_API_KEY', message: 'Invalid API key' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { integrationSlug, endUserId, redirectUri, metadata } = body;

    // Validate required fields
    if (!integrationSlug || !endUserId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'integrationSlug and endUserId are required',
          },
        },
        { status: 400 }
      );
    }

    // Get integration
    const integration = await prisma.integration.findUnique({
      where: { slug: integrationSlug },
    });

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTEGRATION_NOT_FOUND',
            message: `Integration '${integrationSlug}' not found`,
          },
        },
        { status: 404 }
      );
    }

    // Create or get end user
    let endUser = await prisma.endUser.findFirst({
      where: {
        appId: app.id,
        externalId: endUserId,
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
    const state = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OAuth state
    await prisma.oAuthState.create({
      data: {
        state,
        appId: app.id,
        endUserId: endUser.id,
        integrationId: integration.id,
        redirectUri: redirectUri || app.webhookUrl || '',
        expiresAt,
      },
    });

    // Build OAuth URL based on integration type
    let authUrl = '';
    const authConfig = integration.authConfig as any;

    if (integration.authType === 'oauth2') {
      const params = new URLSearchParams({
        client_id: authConfig.clientId || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/public/v1/connections/callback`,
        state,
        response_type: 'code',
        scope: authConfig.scopes?.join(' ') || '',
      });

      authUrl = `${authConfig.authorizationUrl}?${params.toString()}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        authUrl,
        state,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error initiating connection:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to initiate connection',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

