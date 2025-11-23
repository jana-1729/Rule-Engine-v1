import { 
  WorkflowDefinition, 
  WorkflowStep, 
  ExecutionContext,
  ExecutionStatus,
  Logger 
} from '../integrations/types';
import { integrationRegistry } from '../integrations/registry';
import { prisma } from '../lib/prisma';
import { applyFieldMappings } from './field-mapper';
import { nanoid } from 'nanoid';

/**
 * Workflow Execution Engine
 * Handles the execution of workflows with full traceability
 */
export class WorkflowEngine {
  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    organizationId: string,
    triggerPayload: any,
    triggerSource: string = 'manual'
  ): Promise<ExecutionStatus> {
    const executionId = nanoid();
    
    console.log(`🚀 Starting workflow execution: ${executionId}`);

    // Create execution record
    const execution = await prisma.workflowExecution.create({
      data: {
        id: executionId,
        workflowId,
        organizationId,
        status: 'running',
        triggerSource,
        inputPayload: triggerPayload,
        startedAt: new Date(),
      },
    });

    // Get workflow definition
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      await this.updateExecutionStatus(executionId, 'failed', {
        code: 'WORKFLOW_NOT_FOUND',
        message: 'Workflow not found',
      });
      throw new Error('Workflow not found');
    }

    const definition = workflow.definition as unknown as WorkflowDefinition;
    
    try {
      // Execute steps sequentially
      let stepData = triggerPayload;
      
      for (let i = 0; i < definition.steps.length; i++) {
        const step = definition.steps[i];
        
        console.log(`  📍 Executing step ${i + 1}/${definition.steps.length}: ${step.name}`);
        
        const stepResult = await this.executeStep(
          step,
          stepData,
          {
            organizationId,
            workflowId,
            executionId,
            stepNumber: i + 1,
            logger: this.createLogger(executionId, i + 1),
          }
        );

        if (!stepResult.success) {
          // Handle step failure
          if (step.continueOnError) {
            console.warn(`  ⚠️ Step ${i + 1} failed but continuing due to continueOnError`);
            continue;
          } else {
            // Stop execution
            await this.updateExecutionStatus(executionId, 'failed', {
              stepNumber: i + 1,
              stepName: step.name,
              code: stepResult.error?.code || 'STEP_FAILED',
              message: stepResult.error?.message || 'Step execution failed',
              details: stepResult.error?.details,
              retryCount: 0,
            });
            
            throw new Error(`Step ${i + 1} failed: ${stepResult.error?.message}`);
          }
        }

        // Use step output as input for next step
        stepData = stepResult.data;
      }

      // All steps completed successfully
      const finishedAt = new Date();
      const duration = finishedAt.getTime() - execution.startedAt.getTime();

      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'success',
          finishedAt,
          duration,
          outputPayload: stepData,
        },
      });

      console.log(`✅ Workflow execution completed: ${executionId} (${duration}ms)`);

      return {
        executionId,
        workflowId,
        status: 'success',
        startedAt: execution.startedAt,
        finishedAt,
        duration,
        totalSteps: definition.steps.length,
      };
    } catch (error: any) {
      console.error(`❌ Workflow execution failed: ${executionId}`, error);
      
      const finishedAt = new Date();
      const duration = finishedAt.getTime() - execution.startedAt.getTime();

      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'failed',
          finishedAt,
          duration,
          error: {
            message: error.message,
            stack: error.stack,
          },
        },
      });

      throw error;
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    previousStepData: any,
    context: ExecutionContext
  ) {
    const stepLogId = nanoid();
    const startedAt = new Date();

    try {
      // Create step log
      await prisma.workflowStepLog.create({
        data: {
          id: stepLogId,
          executionId: context.executionId,
          stepNumber: context.stepNumber,
          stepName: step.name,
          integration: step.integration,
          action: step.action,
          status: 'running',
          startedAt,
        },
      });

      // Get integration action
      const action = integrationRegistry.getAction(step.integration, step.action);
      
      if (!action) {
        throw new Error(`Action ${step.action} not found in integration ${step.integration}`);
      }

      // Get connection credentials
      const connection = await prisma.connection.findUnique({
        where: { id: step.connectionId },
      });

      if (!connection) {
        throw new Error(`Connection ${step.connectionId} not found`);
      }

      // Prepare input by applying field mappings
      const mappedInput = await applyFieldMappings(
        step.input.mappings,
        previousStepData,
        step.input.static || {}
      );

      // Log input
      await prisma.workflowStepLog.update({
        where: { id: stepLogId },
        data: { input: mappedInput },
      });

      // Execute action
      const result = await action.execute(
        mappedInput,
        {
          type: connection.integration.authType,
          data: connection.credentials as any,
        } as any,
        context
      );

      // Log result
      const finishedAt = new Date();
      const duration = finishedAt.getTime() - startedAt.getTime();

      await prisma.workflowStepLog.update({
        where: { id: stepLogId },
        data: {
          status: result.success ? 'success' : 'failed',
          output: result.data,
          error: result.error,
          finishedAt,
          duration,
        },
      });

      return result;
    } catch (error: any) {
      const finishedAt = new Date();
      const duration = finishedAt.getTime() - startedAt.getTime();

      await prisma.workflowStepLog.update({
        where: { id: stepLogId },
        data: {
          status: 'failed',
          error: {
            message: error.message,
            stack: error.stack,
          },
          finishedAt,
          duration,
        },
      });

      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error.message,
          details: error.stack,
        },
      };
    }
  }

  /**
   * Update execution status
   */
  private async updateExecutionStatus(
    executionId: string,
    status: string,
    error?: any
  ) {
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status,
        finishedAt: new Date(),
        error,
      },
    });
  }

  /**
   * Create a logger for step execution
   */
  private createLogger(executionId: string, stepNumber: number): Logger {
    return {
      info: (message: string, data?: any) => {
        console.log(`[${executionId}:${stepNumber}] INFO: ${message}`, data || '');
      },
      warn: (message: string, data?: any) => {
        console.warn(`[${executionId}:${stepNumber}] WARN: ${message}`, data || '');
      },
      error: (message: string, error?: any) => {
        console.error(`[${executionId}:${stepNumber}] ERROR: ${message}`, error || '');
      },
      debug: (message: string, data?: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[${executionId}:${stepNumber}] DEBUG: ${message}`, data || '');
        }
      },
    };
  }
}

// Singleton instance
export const workflowEngine = new WorkflowEngine();

