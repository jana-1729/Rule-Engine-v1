import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { connectionManager } from '@/services/connection-manager';
import { z } from 'zod';

/**
 * POST /api/connections/disconnect
 * 
 * Disconnect an integration for the current user
 * 
 * Body:
 * - integration: Integration slug
 * 
 * Returns:
 * - success: boolean
 */

const disconnectSchema = z.object({
  integration: z.string().min(1, 'Integration is required'),
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
    const validation = disconnectSchema.safeParse(body);
    
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
    
    const { integration } = validation.data;
    
    // Disconnect
    await connectionManager.disconnect(session.userId, integration);
    
    const duration = Date.now() - startTime;
    
    console.info(`[API] Disconnected integration ${integration} for user ${session.userId}`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully disconnected ${integration}`,
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[API] Disconnect error:', error);
    
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    
    if (error.message.includes('not found')) {
      statusCode = 404;
      errorCode = 'CONNECTION_NOT_FOUND';
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: errorCode,
          message: error.message || 'Failed to disconnect',
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

