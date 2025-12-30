import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { connectionManager } from '@/services/connection-manager';

/**
 * GET /api/connections/list
 * 
 * Get all connections for the current user
 * 
 * Returns:
 * - connections: Array of ConnectionStatus
 */
export async function GET(request: NextRequest) {
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
    
    // Get all connections for user
    const connections = await connectionManager.getUserConnections(session.userId);
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data: {
        connections,
        total: connections.length,
      },
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[API] List connections error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list connections',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

