import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import axios from 'axios';

/**
 * OAuth Callback Handler
 * 
 * GET /api/v1/connections/callback?code=xxx&state=yyy
 * 
 * This is called by the OAuth provider (e.g., Slack) after user authorization
 * We exchange the code for tokens and redirect back to Company X's redirectUri
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/error?error=${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state' },
        { status: 400 }
      );
    }

    // Get OAuth state from database
    const oauthState = await prisma.oAuthState.findUnique({
      where: { state },
      include: {
        integration: true,
      },
    });

    if (!oauthState) {
      return NextResponse.json(
        { error: 'Invalid state' },
        { status: 400 }
      );
    }

    // Check if expired
    if (oauthState.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'State expired' },
        { status: 400 }
      );
    }

    // Check if already used
    if (oauthState.usedAt) {
      return NextResponse.json(
        { error: 'State already used' },
        { status: 400 }
      );
    }

    // Mark state as used
    await prisma.oAuthState.update({
      where: { id: oauthState.id },
      data: { usedAt: new Date() },
    });

    const integration = oauthState.integration;
    const authConfig = integration.authConfig as any;

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      authConfig.tokenUrl,
      {
        grant_type: 'authorization_code',
        code,
        client_id: authConfig.clientId || process.env[`${integration.slug.toUpperCase()}_CLIENT_ID`],
        client_secret: authConfig.clientSecret || process.env[`${integration.slug.toUpperCase()}_CLIENT_SECRET`],
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/connections/callback`,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const {
      access_token,
      refresh_token,
      expires_in,
      scope,
      ...otherData
    } = tokenResponse.data;

    // Encrypt sensitive data
    const encryptedAccessToken = await encrypt(access_token);
    const encryptedRefreshToken = refresh_token ? await encrypt(refresh_token) : null;

    const expiresAt = expires_in 
      ? new Date(Date.now() + expires_in * 1000)
      : null;

    // Create or update connection
    const connection = await prisma.endUserConnection.upsert({
      where: {
        appId_endUserId_integrationId: {
          appId: oauthState.appId,
          endUserId: oauthState.endUserId,
          integrationId: integration.id,
        },
      },
      create: {
        appId: oauthState.appId,
        endUserId: oauthState.endUserId,
        integrationId: integration.id,
        name: `${integration.name} Connection`,
        credentials: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          ...otherData,
        },
        scopes: scope ? scope.split(' ') : [],
        expiresAt,
        status: 'active',
      },
      update: {
        credentials: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          ...otherData,
        },
        scopes: scope ? scope.split(' ') : [],
        expiresAt,
        status: 'active',
        errorCount: 0,
        lastError: null,
      },
    });

    // Update end user last active
    await prisma.endUser.update({
      where: { id: oauthState.endUserId },
      data: { lastActiveAt: new Date() },
    });

    // Send webhook to Company X
    const app = await prisma.app.findUnique({
      where: { id: oauthState.appId },
    });

    if (app?.webhookUrl) {
      await sendWebhook(app, {
        event: 'connection.created',
        data: {
          connectionId: connection.id,
          endUserId: oauthState.endUserId,
          integration: integration.slug,
          status: 'active',
        },
      });
    }

    // Redirect back to Company X's redirect URI
    const redirectUrl = new URL(oauthState.redirectUri);
    redirectUrl.searchParams.set('success', 'true');
    redirectUrl.searchParams.set('connectionId', connection.id);
    redirectUrl.searchParams.set('integration', integration.slug);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    
    return NextResponse.json(
      { error: 'Failed to complete OAuth', message: error.message },
      { status: 500 }
    );
  }
}

async function sendWebhook(app: any, payload: any) {
  try {
    await axios.post(app.webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': app.webhookSecret,
      },
      timeout: 5000,
    });
  } catch (error) {
    console.error('Webhook delivery failed:', error);
    // Queue for retry
    await prisma.webhookEvent.create({
      data: {
        appId: app.id,
        eventType: payload.event,
        payload,
        status: 'failed',
        attempts: 1,
      },
    });
  }
}

