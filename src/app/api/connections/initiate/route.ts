import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { connectionManager } from '@/services/connection-manager';
import { z } from 'zod';

/**
 * POST /api/connections/initiate
 * 
 * Initiate OAuth flow for an integration
 * 
 * Body:
 * - integration: Integration slug
 * - redirectUri: Optional redirect URI after OAuth completion
 * 
 * Returns:
 * - authUrl: OAuth authorization URL
 * - state: OAuth state parameter
 */

const initiateSchema = z.object({
  integration: z.string().min(1, 'Integration is required'),
  redirectUri: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get session
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        }, 
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = initiateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: validation.error.errors,
          },
        }, 
        { status: 400 }
      );
    }
    
    const { integration, redirectUri } = validation.data;
    
    // Initiate OAuth flow
    const result = await connectionManager.initiateOAuth(
      session.accountId,
      session.userId,
      integration,
      redirectUri
    );
    
    const duration = Date.now() - startTime;
    
    console.info(`[API] OAuth initiated for user ${session.userId}, integration ${integration}`);
    
    return NextResponse.json({
      success: true,
      data: {
        authUrl: result.authUrl,
        state: result.state,
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[API] OAuth initiation error:', error);
    
    // Determine error type
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    
    if (error.message.includes('not found')) {
      statusCode = 404;
      errorCode = 'INTEGRATION_NOT_FOUND';
    } else if (error.message.includes('does not support')) {
      statusCode = 400;
      errorCode = 'UNSUPPORTED_AUTH_TYPE';
    } else if (error.message.includes('not configured')) {
      statusCode = 500;
      errorCode = 'CONFIGURATION_ERROR';
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: errorCode,
          message: error.message || 'Failed to initiate OAuth',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        meta: {
          duration,
          timestamp: new Date().toISOString(),
        },
      },
      { status: statusCode }
    );
  }
}

