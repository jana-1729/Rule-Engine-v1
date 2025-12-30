import { NextRequest, NextResponse } from 'next/server';
import { connectionManager } from '@/services/connection-manager';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/connections/callback
 * 
 * OAuth callback handler
 * 
 * Query params:
 * - code: OAuth authorization code
 * - state: OAuth state parameter
 * - error: OAuth error (if authorization failed)
 * - error_description: Error description
 * 
 * Redirects to:
 * - Success: Stored redirectUri or /dashboard/integrations
 * - Error: Stored redirectUri or /dashboard/integrations with error
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    // Get the stored OAuth state to retrieve the redirect URI
    let redirectUri = '/dashboard/integrations';
    let integrationId = '';
    
    if (state) {
      try {
        const oauthState = await prisma.oAuthState.findUnique({
          where: { state },
        });
        
        if (oauthState) {
          redirectUri = oauthState.redirectUri || '/dashboard/integrations';
          integrationId = oauthState.integrationId;
        }
      } catch (err) {
        console.warn('[API] Could not retrieve OAuth state for redirect:', err);
      }
    }
    
    // Handle OAuth errors
    if (error) {
      console.error('[API] OAuth error:', error, errorDescription);
      
      const errorParam = encodeURIComponent(error);
      const descParam = errorDescription ? encodeURIComponent(errorDescription) : '';
      
      return NextResponse.redirect(
        `${baseUrl}${redirectUri}?error=${errorParam}&error_description=${descParam}`
      );
    }
    
    // Validate required parameters
    if (!code || !state) {
      console.error('[API] Missing OAuth parameters:', { code: !!code, state: !!state });
      
      return NextResponse.redirect(
        `${baseUrl}${redirectUri}?error=missing_parameters`
      );
    }
    
    // Handle OAuth callback
    console.info('[API] Processing OAuth callback...');
    
    const connection = await connectionManager.handleOAuthCallback(code, state);
    
    const duration = Date.now() - startTime;
    
    console.info(`[API] OAuth callback successful, connection: ${connection.id}, duration: ${duration}ms`);
    
    // Build success redirect URL through intermediate success page
    // This ensures the session is maintained and provides better UX
    const successUrl = new URL('/auth/oauth-success', baseUrl);
    successUrl.searchParams.set('connected', 'true');
    successUrl.searchParams.set('integration', connection.integrationId);
    successUrl.searchParams.set('connectionId', connection.id);
    successUrl.searchParams.set('redirect', redirectUri);
    
    console.info(`[API] Redirecting to success page, final destination: ${redirectUri}`);
    
    // Redirect to success page which will then redirect to the original page
    return NextResponse.redirect(successUrl.toString());
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[API] OAuth callback error:', error);
    
    // Try to get redirect URI from state even on error
    let redirectUri = '/dashboard/integrations';
    try {
      const { searchParams } = new URL(request.url);
      const state = searchParams.get('state');
      if (state) {
        const oauthState = await prisma.oAuthState.findUnique({
          where: { state },
        });
        if (oauthState?.redirectUri) {
          redirectUri = oauthState.redirectUri;
        }
      }
    } catch (err) {
      console.warn('[API] Could not retrieve redirect URI on error:', err);
    }
    
    // Determine error type for better user messaging
    let errorCode = 'connection_failed';
    
    if (error.message.includes('Invalid OAuth state')) {
      errorCode = 'invalid_state';
    } else if (error.message.includes('expired')) {
      errorCode = 'state_expired';
    } else if (error.message.includes('already used')) {
      errorCode = 'state_used';
    } else if (error.message.includes('Failed to exchange')) {
      errorCode = 'token_exchange_failed';
    } else if (error.message.includes('not configured')) {
      errorCode = 'configuration_error';
    }
    
    console.error(`[API] OAuth callback failed with error: ${errorCode}, duration: ${duration}ms`);
    
    return NextResponse.redirect(
      `${baseUrl}${redirectUri}?error=${errorCode}&error_message=${encodeURIComponent(error.message)}`
    );
  }
}

