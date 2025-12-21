/**
 * Public API: Disconnect
 * Disconnect an integration for an end user
 * 
 * @swagger
 * /api/public/v1/connections/disconnect:
 *   post:
 *     summary: Disconnect an integration
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
 *               - connectionId
 *             properties:
 *               connectionId:
 *                 type: string
 *                 example: conn_123
 *     responses:
 *       200:
 *         description: Connection disconnected
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiKeyService } from '@/services/api-key-service';

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
    const { connectionId } = body;

    if (!connectionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'connectionId is required',
          },
        },
        { status: 400 }
      );
    }

    // Get connection
    const connection = await prisma.endUserConnection.findUnique({
      where: { id: connectionId },
      include: {
        integration: true,
      },
    });

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONNECTION_NOT_FOUND',
            message: 'Connection not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify connection belongs to this app
    if (connection.appId !== app.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Connection does not belong to this app',
          },
        },
        { status: 403 }
      );
    }

    // Update connection status to revoked
    await prisma.endUserConnection.update({
      where: { id: connectionId },
      data: {
        status: 'revoked',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        connectionId,
        integration: connection.integration.slug,
        status: 'disconnected',
      },
    });
  } catch (error: any) {
    console.error('Error disconnecting:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to disconnect',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

