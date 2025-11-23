import { WorkflowDefinition } from '../integrations/types';
import { integrationRegistry } from '../integrations/registry';

/**
 * Workflow Validator
 * Validates workflow definitions before execution
 */

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
}

/**
 * Validate a workflow definition
 */
export function validateWorkflow(workflow: WorkflowDefinition): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate version
  if (!workflow.version) {
    errors.push({
      path: 'version',
      message: 'Workflow version is required',
      code: 'MISSING_VERSION',
    });
  }

  // Validate trigger
  if (!workflow.trigger) {
    errors.push({
      path: 'trigger',
      message: 'Workflow trigger is required',
      code: 'MISSING_TRIGGER',
    });
  } else {
    validateTrigger(workflow.trigger, errors, warnings);
  }

  // Validate steps
  if (!workflow.steps || workflow.steps.length === 0) {
    errors.push({
      path: 'steps',
      message: 'Workflow must have at least one step',
      code: 'NO_STEPS',
    });
  } else {
    workflow.steps.forEach((step, index) => {
      validateStep(step, index, errors, warnings);
    });
  }

  // Validate settings
  if (workflow.settings) {
    validateSettings(workflow.settings, errors, warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate trigger configuration
 */
function validateTrigger(
  trigger: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  if (!trigger.integration) {
    errors.push({
      path: 'trigger.integration',
      message: 'Trigger integration is required',
      code: 'MISSING_INTEGRATION',
    });
    return;
  }

  if (!trigger.trigger) {
    errors.push({
      path: 'trigger.trigger',
      message: 'Trigger type is required',
      code: 'MISSING_TRIGGER_TYPE',
    });
    return;
  }

  // Check if integration exists
  const integration = integrationRegistry.get(trigger.integration);
  if (!integration) {
    errors.push({
      path: 'trigger.integration',
      message: `Integration '${trigger.integration}' not found`,
      code: 'INTEGRATION_NOT_FOUND',
    });
    return;
  }

  // Check if trigger exists in integration
  const triggerDef = integration.triggers[trigger.trigger];
  if (!triggerDef) {
    errors.push({
      path: 'trigger.trigger',
      message: `Trigger '${trigger.trigger}' not found in integration '${trigger.integration}'`,
      code: 'TRIGGER_NOT_FOUND',
    });
  }
}

/**
 * Validate workflow step
 */
function validateStep(
  step: any,
  index: number,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  const basePath = `steps[${index}]`;

  if (!step.id) {
    errors.push({
      path: `${basePath}.id`,
      message: 'Step ID is required',
      code: 'MISSING_STEP_ID',
    });
  }

  if (!step.integration) {
    errors.push({
      path: `${basePath}.integration`,
      message: 'Step integration is required',
      code: 'MISSING_INTEGRATION',
    });
    return;
  }

  if (!step.action) {
    errors.push({
      path: `${basePath}.action`,
      message: 'Step action is required',
      code: 'MISSING_ACTION',
    });
    return;
  }

  // Check if integration exists
  const integration = integrationRegistry.get(step.integration);
  if (!integration) {
    errors.push({
      path: `${basePath}.integration`,
      message: `Integration '${step.integration}' not found`,
      code: 'INTEGRATION_NOT_FOUND',
    });
    return;
  }

  // Check if action exists in integration
  const action = integration.actions[step.action];
  if (!action) {
    errors.push({
      path: `${basePath}.action`,
      message: `Action '${step.action}' not found in integration '${step.integration}'`,
      code: 'ACTION_NOT_FOUND',
    });
  }

  // Validate input mappings
  if (!step.input) {
    warnings.push({
      path: `${basePath}.input`,
      message: 'Step has no input configuration',
      code: 'NO_INPUT',
    });
  } else if (!step.input.mappings || step.input.mappings.length === 0) {
    warnings.push({
      path: `${basePath}.input.mappings`,
      message: 'Step has no field mappings',
      code: 'NO_MAPPINGS',
    });
  }

  // Validate retry configuration
  if (step.retry) {
    if (step.retry.maxAttempts < 0) {
      errors.push({
        path: `${basePath}.retry.maxAttempts`,
        message: 'Retry maxAttempts must be >= 0',
        code: 'INVALID_RETRY_ATTEMPTS',
      });
    }
  }
}

/**
 * Validate workflow settings
 */
function validateSettings(
  settings: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) {
  if (settings.timeout && settings.timeout < 0) {
    errors.push({
      path: 'settings.timeout',
      message: 'Timeout must be >= 0',
      code: 'INVALID_TIMEOUT',
    });
  }

  if (settings.concurrency && settings.concurrency < 1) {
    errors.push({
      path: 'settings.concurrency',
      message: 'Concurrency must be >= 1',
      code: 'INVALID_CONCURRENCY',
    });
  }
}

/**
 * Format validation result as human-readable string
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push('✅ Workflow is valid');
  } else {
    lines.push('❌ Workflow validation failed');
  }

  if (result.errors.length > 0) {
    lines.push('\nErrors:');
    result.errors.forEach(error => {
      lines.push(`  - ${error.path}: ${error.message} (${error.code})`);
    });
  }

  if (result.warnings.length > 0) {
    lines.push('\nWarnings:');
    result.warnings.forEach(warning => {
      lines.push(`  - ${warning.path}: ${warning.message} (${warning.code})`);
    });
  }

  return lines.join('\n');
}

