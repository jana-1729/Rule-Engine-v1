import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { connectionManager } from '@/services/connection-manager';

/**
 * GET /api/connections/check
 * 
 * Check if user has an active connection for an integration
 * 
 * Query params:
 * - integration: Integration slug (e.g., 'slack', 'gmail')
 * 
 * Returns:
 * - connected: boolean
 * - connection: ConnectionStatus | null
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
    
    // Get integration slug from query params
    const { searchParams } = new URL(request.url);
    const integration = searchParams.get('integration');
    
    if (!integration) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'Integration parameter is required',
          },
        }, 
        { status: 400 }
      );
    }
    
    // Check if connection exists
    const hasConnection = await connectionManager.hasConnection(
      session.userId,
      integration
    );
    
    // If has connection, get full details
    let connectionDetails = null;
    if (hasConnection) {
      try {
        const conn = await connectionManager.getConnection(
          session.userId,
          integration
        );
        
        if (conn) {
          connectionDetails = {
            id: conn.id,
            status: conn.status,
            lastUsedAt: conn.lastUsedAt,
            lastErrorAt: conn.lastErrorAt,
            errorCount: conn.errorCount,
            integration: {
              slug: conn.integration.slug,
              name: conn.integration.name,
              logo: conn.integration.logo,
            },
          };
        }
      } catch (error) {
        console.error('[API] Error getting connection details:', error);
        // Continue with hasConnection=true but no details
      }
    }
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      connected: hasConnection,
      connection: connectionDetails,
      meta: {
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[API] Connection check error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check connection',
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

