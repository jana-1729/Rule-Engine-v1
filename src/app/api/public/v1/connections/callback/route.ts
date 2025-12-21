/**
 * Public API: OAuth Callback
 * Handles OAuth callback and creates connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth error
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/error?error=${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/error?error=missing_parameters`
      );
    }

    // Get OAuth state
    const oauthState = await prisma.oAuthState.findUnique({
      where: { state },
      include: {
        integration: true,
        app: true,
        endUser: true,
      },
    });

    if (!oauthState) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/error?error=invalid_state`
      );
    }

    // Check if expired
    if (new Date() > oauthState.expiresAt) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/error?error=state_expired`
      );
    }

    // Exchange code for token
    const authConfig = oauthState.integration.authConfig as any;
    
    const tokenResponse = await axios.post(
      authConfig.tokenUrl,
      {
        grant_type: 'authorization_code',
        code,
        client_id: authConfig.clientId,
        client_secret: authConfig.clientSecret,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/public/v1/connections/callback`,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const { access_token, refresh_token, expires_in, scope } = tokenResponse.data;

    // Encrypt tokens
    const encryptedAccessToken = encrypt(access_token);
    const encryptedRefreshToken = refresh_token ? encrypt(refresh_token) : null;

    // Calculate expiration
    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000)
      : null;

    // Create or update connection
    const existingConnection = await prisma.endUserConnection.findFirst({
      where: {
        appId: oauthState.appId,
        endUserId: oauthState.endUserId,
        integrationId: oauthState.integrationId,
      },
    });

    let connection;
    if (existingConnection) {
      connection = await prisma.endUserConnection.update({
        where: { id: existingConnection.id },
        data: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
          scope: scope || authConfig.scopes?.join(' '),
          status: 'active',
        },
      });
    } else {
      connection = await prisma.endUserConnection.create({
        data: {
          appId: oauthState.appId,
          endUserId: oauthState.endUserId,
          integrationId: oauthState.integrationId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
          scope: scope || authConfig.scopes?.join(' '),
          status: 'active',
        },
      });
    }

    // Delete OAuth state
    await prisma.oAuthState.delete({
      where: { state },
    });

    // Redirect to customer's redirect URI
    const redirectUrl = new URL(oauthState.redirectUri || oauthState.app.webhookUrl || '/');
    redirectUrl.searchParams.set('success', 'true');
    redirectUrl.searchParams.set('connectionId', connection.id);
    redirectUrl.searchParams.set('integration', oauthState.integration.slug);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/error?error=callback_failed&message=${encodeURIComponent(error.message)}`
    );
  }
}

