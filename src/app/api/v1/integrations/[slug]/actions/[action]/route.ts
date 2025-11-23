import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiKey } from '@/lib/auth';
import { integrationRegistry } from '@/integrations/registry';
import { decrypt } from '@/lib/encryption';
import { nanoid } from 'nanoid';

/**
 * Execute Integration Action
 * 
 * POST /api/v1/integrations/:slug/actions/:action
 * 
 * Company X calls this instead of calling Slack/Notion/etc directly
 * 
 * Example: POST /api/v1/integrations/slack/actions/send_message
 * 
 * Body:
 * {
 *   "endUserId": "user-123-from-company-x",
 *   "input": {
 *     "channel": "#general",
 *     "text": "Hello from Company X!"
 *   }
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string; action: string } }
) {
  const executionId = nanoid();
  const startTime = Date.now();

  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401 }
      );
    }

    const app = await verifyApiKey(apiKey);
    if (!app) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Parse request
    const body = await request.json();
    const { endUserId, input } = body;

    if (!endUserId || !input) {
      return NextResponse.json(
        { error: 'Missing required fields: endUserId, input' },
        { status: 400 }
      );
    }

    // Get integration
    const integration = await prisma.integration.findUnique({
      where: { slug: params.slug },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Get end user
    const endUser = await prisma.endUser.findUnique({
      where: {
        appId_externalId: {
          appId: app.id,
          externalId: endUserId,
        },
      },
    });

    if (!endUser) {
      return NextResponse.json(
        { error: 'End user not found. Please create user first.' },
        { status: 404 }
      );
    }

    // Get connection
    const connection = await prisma.endUserConnection.findUnique({
      where: {
        appId_endUserId_integrationId: {
          appId: app.id,
          endUserId: endUser.id,
          integrationId: integration.id,
        },
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'User has not connected this integration' },
        { status: 404 }
      );
    }

    if (connection.status !== 'active') {
      return NextResponse.json(
        { error: `Connection is ${connection.status}. User needs to reconnect.` },
        { status: 400 }
      );
    }

    // Get action from registry
    const integrationPlugin = integrationRegistry.get(params.slug);
    if (!integrationPlugin) {
      return NextResponse.json(
        { error: 'Integration plugin not loaded' },
        { status: 500 }
      );
    }

    const actionHandler = integrationPlugin.actions[params.action];
    if (!actionHandler) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

    // Decrypt credentials
    const credentials = connection.credentials as any;
    const decryptedAccessToken = await decrypt(credentials.accessToken);

    // Execute action
    const result = await actionHandler.execute(
      input,
      {
        type: integration.authType as any,
        data: {
          ...credentials,
          accessToken: decryptedAccessToken,
        },
      },
      {
        organizationId: app.accountId,
        workflowId: executionId,
        executionId,
        stepNumber: 1,
        logger: {
          info: (msg: string, data?: any) => console.log(`[${executionId}]`, msg, data),
          warn: (msg: string, data?: any) => console.warn(`[${executionId}]`, msg, data),
          error: (msg: string, error?: any) => console.error(`[${executionId}]`, msg, error),
          debug: (msg: string, data?: any) => console.debug(`[${executionId}]`, msg, data),
        },
      }
    );

    const duration = Date.now() - startTime;

    // Log execution
    await prisma.execution.create({
      data: {
        id: executionId,
        appId: app.id,
        endUserId: endUser.id,
        connectionId: connection.id,
        integrationId: integration.id,
        action: params.action,
        input,
        output: result.data,
        status: result.success ? 'success' : 'failed',
        errorCode: result.error?.code,
        errorMessage: result.error?.message,
        errorDetails: result.error?.details,
        duration,
        finishedAt: new Date(),
        requestId: executionId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Update connection last used
    await prisma.endUserConnection.update({
      where: { id: connection.id },
      data: {
        lastUsedAt: new Date(),
        errorCount: result.success ? 0 : connection.errorCount + 1,
        lastError: result.success ? null : result.error,
      },
    });

    // Update end user last active
    await prisma.endUser.update({
      where: { id: endUser.id },
      data: { lastActiveAt: new Date() },
    });

    // Send webhook if configured
    if (app.webhookUrl) {
      await sendWebhook(app, {
        event: result.success ? 'execution.success' : 'execution.failed',
        data: {
          executionId,
          endUserId: endUser.externalId,
          integration: params.slug,
          action: params.action,
          status: result.success ? 'success' : 'failed',
          duration,
          error: result.error,
        },
      });
    }

    // Return result
    if (result.success) {
      return NextResponse.json({
        success: true,
        executionId,
        data: result.data,
        duration,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          executionId,
          error: result.error,
          duration,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Execution error:', error);

    // Log failed execution
    try {
      await prisma.execution.create({
        data: {
          id: executionId,
          appId: (await verifyApiKey(request.headers.get('x-api-key')!))!.id,
          endUserId: body.endUserId,
          connectionId: 'unknown',
          integrationId: 'unknown',
          action: params.action,
          input: body.input,
          status: 'failed',
          errorCode: 'INTERNAL_ERROR',
          errorMessage: error.message,
          duration: Date.now() - startTime,
          finishedAt: new Date(),
          requestId: executionId,
        },
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { error: 'Execution failed', message: error.message, executionId },
      { status: 500 }
    );
  }
}

async function sendWebhook(app: any, payload: any) {
  try {
    await fetch(app.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': app.webhookSecret || '',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Webhook failed:', error);
  }
}

