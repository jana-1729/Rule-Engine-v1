import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiKeyService } from '@/services/api-key-service';
import { integrationRegistry } from '@/integrations/registry';
import { z } from 'zod';

const executeWorkflowSchema = z.object({
  workflowId: z.string(),
  endUserId: z.string(),
  data: z.record(z.any()),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Extract and validate API key
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7);
    const validation = await apiKeyService.validateKey(apiKey);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid API key' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { workflowId, endUserId, data } = executeWorkflowSchema.parse(body);

    // Fetch workflow with all necessary relations
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        appId: validation.appId,
        enabled: true,
      },
      include: {
        integration: true,
        app: true,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found or not enabled' },
        { status: 404 }
      );
    }

    // Verify end user belongs to this app
    const endUser = await prisma.endUser.findFirst({
      where: {
        id: endUserId,
        appId: validation.appId,
      },
    });

    if (!endUser) {
      return NextResponse.json(
        { error: 'End user not found' },
        { status: 404 }
      );
    }

    // Get end user's connection for this integration
    const connection = await prisma.endUserConnection.findFirst({
      where: {
        endUserId,
        integrationId: workflow.integrationId,
        status: 'active',
      },
    });

    if (!connection) {
      return NextResponse.json(
        { 
          error: 'No active connection found for this integration',
          details: {
            integrationId: workflow.integrationId,
            integrationName: workflow.integration.name,
            message: 'End user needs to connect their account first',
          },
        },
        { status: 400 }
      );
    }

    // Create execution record
    const execution = await prisma.execution.create({
      data: {
        appId: validation.appId!,
        endUserId,
        workflowId,
        integrationId: workflow.integrationId,
        action: workflow.definition.action,
        input: data,
        status: 'running',
        requestId,
        logs: [],
      },
    });

    // Execute the workflow
    try {
      const result = await executeWorkflow(
        workflow,
        connection,
        data,
        execution.id,
        requestId
      );

      // Update execution with result
      const completedAt = new Date();
      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: result.success ? 'success' : 'failed',
          output: result.data,
          error: result.error ? {
            code: result.error.code,
            message: result.error.message,
            details: result.error.details,
          } : null,
          completedAt,
          logs: result.logs || [],
        },
      });

      return NextResponse.json({
        success: result.success,
        executionId: execution.id,
        requestId,
        data: result.data,
        error: result.error,
        duration: Date.now() - startTime,
      });
    } catch (error: any) {
      // Update execution with error
      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          error: {
            code: 'EXECUTION_ERROR',
            message: error.message,
            details: error.stack,
          },
          completedAt: new Date(),
        },
      });

      throw error;
    }
  } catch (error: any) {
    console.error('Workflow execution error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors,
          requestId,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Workflow execution failed',
        message: error.message,
        requestId,
      },
      { status: 500 }
    );
  }
}

async function executeWorkflow(
  workflow: any,
  connection: any,
  inputData: Record<string, any>,
  executionId: string,
  requestId: string
): Promise<{
  success: boolean;
  data?: any;
  error?: any;
  logs?: any[];
}> {
  const logs: any[] = [];
  
  const logger = {
    info: (message: string, data?: any) => {
      logs.push({ level: 'info', message, data, timestamp: new Date() });
    },
    warn: (message: string, data?: any) => {
      logs.push({ level: 'warn', message, data, timestamp: new Date() });
    },
    error: (message: string, error?: any) => {
      logs.push({ level: 'error', message, error: error?.message, timestamp: new Date() });
    },
    debug: (message: string, data?: any) => {
      logs.push({ level: 'debug', message, data, timestamp: new Date() });
    },
  };

  try {
    logger.info('Starting workflow execution', {
      workflowId: workflow.id,
      workflowName: workflow.name,
      action: workflow.definition.action,
    });

    // Get the integration and action
    const integration = integrationRegistry.get(workflow.integration.slug);
    if (!integration) {
      throw new Error(`Integration ${workflow.integration.slug} not found in registry`);
    }

    const action = integration.actions[workflow.definition.action];
    if (!action) {
      throw new Error(`Action ${workflow.definition.action} not found in integration`);
    }

    // Apply field mappings to input data
    const mappedInput = applyFieldMappings(
      inputData,
      workflow.definition.fieldMappings,
      logger
    );

    logger.info('Field mappings applied', { mappedInput });

    // Execute the action
    const credentials = {
      type: integration.auth.type,
      data: {
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken,
      },
    };

    const context = {
      organizationId: workflow.appId,
      workflowId: workflow.id,
      executionId,
      stepNumber: 1,
      logger,
    };

    const result = await action.execute(mappedInput, credentials, context);

    logger.info('Action executed', { success: result.success });

    return {
      ...result,
      logs,
    };
  } catch (error: any) {
    logger.error('Workflow execution failed', error);
    
    return {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: error.message,
        details: error.stack,
      },
      logs,
    };
  }
}

function applyFieldMappings(
  inputData: Record<string, any>,
  fieldMappings: Record<string, any>,
  logger: any
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [targetField, mapping] of Object.entries(fieldMappings)) {
    try {
      // Handle template variables like {{field_name}}
      if (typeof mapping === 'string' && mapping.includes('{{')) {
        result[targetField] = replaceTemplateVariables(mapping, inputData);
      } else {
        result[targetField] = mapping;
      }
    } catch (error: any) {
      logger.warn(`Failed to map field ${targetField}`, { error: error.message });
      result[targetField] = mapping; // Use original mapping as fallback
    }
  }

  return result;
}

function replaceTemplateVariables(
  template: string,
  data: Record<string, any>
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    const value = getNestedValue(data, trimmedKey);
    return value !== undefined ? String(value) : match;
  });
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
