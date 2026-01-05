import { NextRequest, NextResponse } from 'next/server';
import { geminiServiceEnhanced } from '@/services/ai/gemini-service-enhanced';
import { redisClient } from '@/lib/redis';

/**
 * GET /api/v1/ai/health
 * 
 * Health check endpoint for AI services
 */
export async function GET(request: NextRequest) {
  try {
    const health = geminiServiceEnhanced.getHealth();
    
    // Add additional health checks
    const healthStatus = {
      ...health,
      redis: {
        connected: redisClient.isReady(),
        status: redisClient.isReady() ? 'healthy' : 'disconnected'
      },
      timestamp: new Date().toISOString(),
      status: health.available && redisClient.isReady() ? 'healthy' : 'degraded'
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

