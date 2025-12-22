/**
 * Public API: Create Workflow
 * Create a workflow with field mapping for an integration
 * 
 * @swagger
 * /api/public/v1/workflows/create:
 *   post:
 *     summary: Create a workflow with field mapping
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
 *               - name
 *               - integrationSlug
 *               - action
 *               - fieldMapping
 *             properties:
 *               name:
 *                 type: string
 *                 example: Send Slack notification on new user
 *               description:
 *                 type: string
 *               integrationSlug:
 *                 type: string
 *                 example: slack
 *               action:
 *                 type: string
 *                 example: send_message
 *               fieldMapping:
 *                 type: object
 *                 example:
 *                   channel: "#general"
 *                   text: "{{user.name}} just signed up!"
 *               triggerType:
 *                 type: string
 *                 enum: [manual, webhook, scheduled]
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Workflow created
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiKeyService } from '@/services/api-key-service';
import { z } from 'zod';

const createWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  integrationSlug: z.string(),
  action: z.string(),
  fieldMapping: z.record(z.any()),
  triggerType: z.enum(['manual', 'webhook', 'scheduled']).default('manual'),
  enabled: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

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
    const validated = createWorkflowSchema.parse(body);

    // Get integration
    const integration = await prisma.integration.findUnique({
      where: { slug: validated.integrationSlug },
    });

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTEGRATION_NOT_FOUND',
            message: `Integration '${validated.integrationSlug}' not found`,
          },
        },
        { status: 404 }
      );
    }

    // Validate action exists
    const actions = integration.actions as any;
    const actionExists = Array.isArray(actions)
      ? actions.some((a: any) => a.id === validated.action)
      : false;

    if (!actionExists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACTION_NOT_FOUND',
            message: `Action '${validated.action}' not found in integration`,
          },
        },
        { status: 404 }
      );
    }

    // Create workflow
    const workflow = await prisma.workflow.create({
      data: {
        appId: app.id,
        name: validated.name,
        description: validated.description,
        integrationId: integration.id,
        enabled: validated.enabled,
        definition: {
          trigger: {
            type: validated.triggerType,
          },
          steps: [
            {
              id: 'step_1',
              type: 'action',
              integrationSlug: validated.integrationSlug,
              action: validated.action,
              fieldMapping: validated.fieldMapping,
            },
          ],
        },
        metadata: validated.metadata || {},
      },
      include: {
        integration: {
          select: {
            id: true,
            slug: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        workflow: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          integration: workflow.integration,
          enabled: workflow.enabled,
          definition: workflow.definition,
          createdAt: workflow.createdAt.toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create workflow',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

