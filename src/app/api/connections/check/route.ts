import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { connectionManager } from '@/services/connection-manager';
import { z } from 'zod';

/**
 * POST /api/connections/check
 * 
 * Check if user has an active connection for an integration
 * 
 * Body:
 * - appId: App ID
 * - endUserId: End user ID
 * - integrationId: Integration slug (e.g., 'slack', 'gmail')
 * 
 * Returns:
 * - hasConnection: boolean
 * - connection: ConnectionStatus | null
 */

const checkConnectionSchema = z.object({
  appId: z.string().min(1, 'App ID is required'),
  endUserId: z.string().min(1, 'End user ID is required'),
  integrationId: z.string().min(1, 'Integration ID is required'),
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
    console.log('[API] Connection check request:', body);
    
    const validation = checkConnectionSchema.safeParse(body);
    
    if (!validation.success) {
      console.error('[API] Validation error:', validation.error.errors);
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
    
    const { appId, endUserId, integrationId } = validation.data;
    
    // Check if connection exists (pass appId to filter by app)
    const hasConnection = await connectionManager.hasConnection(
      endUserId,
      integrationId,
      appId
    );
    
    // If has connection, get full details
    let connectionDetails = null;
    if (hasConnection) {
      try {
        const conn = await connectionManager.getConnection(
          endUserId,
          integrationId,
          appId
        );
        
        if (conn) {
          connectionDetails = {
            id: conn.id,
            status: conn.status,
            lastUsedAt: conn.lastUsedAt,
            lastErrorAt: conn.lastErrorAt,
            errorCount: conn.errorCount,
            integration: {
              slug: conn.integrations.slug,
              name: conn.integrations.name,
              logo: conn.integrations.logo,
            },
          };
        }
      } catch (error) {
        console.error('[API] Error getting connection details:', error);
        // Continue with hasConnection=true but no details
      }
    }
    
    const duration = Date.now() - startTime;
    
    console.log(`[API] Connection check result: ${hasConnection} for ${integrationId}`);
    
    return NextResponse.json({
      success: true,
      hasConnection,
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

