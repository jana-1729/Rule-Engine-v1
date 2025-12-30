import { integrationRegistry, loadIntegrations } from '@/integrations/registry';
import { z } from 'zod';

// Ensure integrations are loaded
let integrationsLoaded = false;
async function ensureIntegrationsLoaded() {
  if (!integrationsLoaded) {
    await loadIntegrations();
    integrationsLoaded = true;
  }
}

/**
 * IntegrationSchemaService - Dynamically fetch integration schemas from plugins
 * 
 * Features:
 * - Fetch actions from integration plugins (not database)
 * - Convert Zod schemas to JSON for frontend
 * - Support dynamic/conditional fields
 * - Cache schemas for performance
 * - Validate field configurations
 */

export interface FieldDefinition {
  name: string;
  type: 'string' | 'textarea' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'email' | 'url' | 'password' | 'json';
  label: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  default?: any;
  options?: string[] | { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  dependsOn?: {
    field: string;
    value: any;
  };
}

export interface ActionSchema {
  id: string;
  name: string;
  description: string;
  category?: string;
  fields: FieldDefinition[];
  examples?: {
    title: string;
    description: string;
    input: Record<string, any>;
  }[];
}

export interface TriggerSchema {
  id: string;
  name: string;
  description: string;
  category?: string;
  outputFields: FieldDefinition[];
  webhookConfig?: {
    method: string;
    path: string;
  };
}

export class IntegrationSchemaService {
  private schemaCache: Map<string, { schema: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all available actions for an integration (from plugin, not database!)
   */
  async getActions(integrationSlug: string): Promise<Array<{
    id: string;
    name: string;
    description: string;
    category?: string;
  }>> {
    try {
      // Ensure integrations are loaded
      await ensureIntegrationsLoaded();
      
      const integration = integrationRegistry.get(integrationSlug);
      
      if (!integration) {
        console.error(`[IntegrationSchemaService] Integration not found in registry: ${integrationSlug}`);
        console.error(`[IntegrationSchemaService] Available integrations:`, integrationRegistry.list().map(i => i.metadata.slug));
        throw new Error(`Integration ${integrationSlug} not found in registry`);
      }
      
      const actions = integration.actions || {};
      
      const actionList = Object.entries(actions).map(([key, action]) => ({
        id: action.id || key,
        name: action.name || this.formatLabel(key),
        description: action.description || `Execute ${key} action`,
        category: (action as any).category,
      }));
      
      console.info(`[IntegrationSchemaService] Found ${actionList.length} actions for ${integrationSlug}`);
      
      return actionList;
    } catch (error) {
      console.error(`[IntegrationSchemaService] Error getting actions for ${integrationSlug}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all available triggers for an integration
   */
  async getTriggers(integrationSlug: string): Promise<Array<{
    id: string;
    name: string;
    description: string;
    category?: string;
  }>> {
    try {
      // Ensure integrations are loaded
      await ensureIntegrationsLoaded();
      
      const integration = integrationRegistry.get(integrationSlug);
      
      if (!integration) {
        throw new Error(`Integration ${integrationSlug} not found in registry`);
      }
      
      const triggers = integration.triggers || {};
      
      const triggerList = Object.entries(triggers).map(([key, trigger]: [string, any]) => ({
        id: trigger.id || key,
        name: trigger.name || this.formatLabel(key),
        description: trigger.description || `${key} trigger`,
        category: trigger.category,
      }));
      
      console.info(`[IntegrationSchemaService] Found ${triggerList.length} triggers for ${integrationSlug}`);
      
      return triggerList;
    } catch (error) {
      console.error(`[IntegrationSchemaService] Error getting triggers for ${integrationSlug}:`, error);
      throw error;
    }
  }
  
  /**
   * Get dynamic input schema for an action
   */
  async getActionSchema(
    integrationSlug: string, 
    actionId: string, 
    context?: Record<string, any>
  ): Promise<ActionSchema> {
    try {
      // Ensure integrations are loaded
      await ensureIntegrationsLoaded();
      
      // Check cache first
      const cacheKey = `${integrationSlug}:${actionId}:${JSON.stringify(context || {})}`;
      const cached = this.schemaCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.info(`[IntegrationSchemaService] Cache hit for ${cacheKey}`);
        return cached.schema;
      }
      
      const integration = integrationRegistry.get(integrationSlug);
      
      if (!integration) {
        throw new Error(`Integration ${integrationSlug} not found in registry`);
      }
      
      const action = integration.actions?.[actionId];
      
      if (!action) {
        throw new Error(`Action ${actionId} not found in integration ${integrationSlug}`);
      }
      
      // Get input schema (can be dynamic based on context!)
      const inputSchema = action.inputSchema;
      
      if (!inputSchema) {
        throw new Error(`No input schema defined for action ${actionId}`);
      }
      
      // Convert Zod schema to field definitions
      const fields = this.zodSchemaToFields(inputSchema);
      
      // Build action schema
      const schema: ActionSchema = {
        id: action.id || actionId,
        name: action.name || this.formatLabel(actionId),
        description: action.description || '',
        category: (action as any).category,
        fields,
        examples: (action as any).examples,
      };
      
      // Cache the schema
      this.schemaCache.set(cacheKey, {
        schema,
        timestamp: Date.now(),
      });
      
      console.info(`[IntegrationSchemaService] Generated schema for ${integrationSlug}.${actionId} with ${fields.length} fields`);
      
      return schema;
    } catch (error) {
      console.error(`[IntegrationSchemaService] Error getting action schema for ${integrationSlug}.${actionId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get output schema for a trigger
   */
  async getTriggerSchema(
    integrationSlug: string, 
    triggerId: string
  ): Promise<TriggerSchema> {
    try {
      // Ensure integrations are loaded
      await ensureIntegrationsLoaded();
      
      const integration = integrationRegistry.get(integrationSlug);
      
      if (!integration) {
        throw new Error(`Integration ${integrationSlug} not found in registry`);
      }
      
      const trigger = integration.triggers?.[triggerId];
      
      if (!trigger) {
        throw new Error(`Trigger ${triggerId} not found in integration ${integrationSlug}`);
      }
      
      // Get output schema
      const outputSchema = (trigger as any).outputSchema;
      
      if (!outputSchema) {
        throw new Error(`No output schema defined for trigger ${triggerId}`);
      }
      
      // Convert Zod schema to field definitions
      const outputFields = this.zodSchemaToFields(outputSchema);
      
      const schema: TriggerSchema = {
        id: (trigger as any).id || triggerId,
        name: (trigger as any).name || this.formatLabel(triggerId),
        description: (trigger as any).description || '',
        category: (trigger as any).category,
        outputFields,
        webhookConfig: (trigger as any).webhookConfig,
      };
      
      console.info(`[IntegrationSchemaService] Generated trigger schema for ${integrationSlug}.${triggerId}`);
      
      return schema;
    } catch (error) {
      console.error(`[IntegrationSchemaService] Error getting trigger schema for ${integrationSlug}.${triggerId}:`, error);
      throw error;
    }
  }
  
  /**
   * Convert Zod schema to field definitions
   */
  private zodSchemaToFields(schema: z.ZodType<any>): FieldDefinition[] {
    const fields: FieldDefinition[] = [];
    
    try {
      // Handle ZodObject
      if (schema instanceof z.ZodObject) {
        const shape = schema.shape;
        
        for (const [key, fieldSchema] of Object.entries(shape)) {
          const field = this.zodTypeToField(key, fieldSchema as z.ZodType);
          if (field) {
            fields.push(field);
          }
        }
      }
      // Handle ZodEffects (refinements/transforms)
      else if (schema instanceof z.ZodEffects) {
        return this.zodSchemaToFields((schema as any)._def.schema);
      }
      // Handle other types
      else {
        console.warn('[IntegrationSchemaService] Unsupported schema type:', schema.constructor.name);
      }
    } catch (error) {
      console.error('[IntegrationSchemaService] Error converting Zod schema to fields:', error);
    }
    
    return fields;
  }
  
  /**
   * Convert a single Zod type to field definition
   */
  private zodTypeToField(name: string, schema: z.ZodType): FieldDefinition | null {
    try {
      const field: FieldDefinition = {
        name,
        type: 'string',
        label: this.formatLabel(name),
        required: true,
      };
      
      // Unwrap optional/nullable
      let unwrapped = schema;
      let isOptional = false;
      
      if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
        isOptional = true;
        unwrapped = (schema as any)._def.innerType;
      }
      
      if (schema instanceof z.ZodDefault) {
        isOptional = true;
        field.default = (schema as any)._def.defaultValue();
        unwrapped = (schema as any)._def.innerType;
      }
      
      field.required = !isOptional;
      
      // Get description from Zod
      const description = (unwrapped as any)._def.description || '';
      if (description) {
        field.description = description;
      }
      
      // Determine field type based on Zod type
      if (unwrapped instanceof z.ZodString) {
        const checks = (unwrapped as any)._def.checks || [];
        
        // Check for specific string types
        if (description.toLowerCase().includes('email') || checks.some((c: any) => c.kind === 'email')) {
          field.type = 'email';
        } else if (description.toLowerCase().includes('url') || checks.some((c: any) => c.kind === 'url')) {
          field.type = 'url';
        } else if (description.toLowerCase().includes('password') || name.toLowerCase().includes('password')) {
          field.type = 'password';
        } else if (description.length > 100 || name.toLowerCase().includes('body') || name.toLowerCase().includes('content')) {
          field.type = 'textarea';
        } else {
          field.type = 'string';
        }
        
        // Extract validation rules
        for (const check of checks) {
          if (check.kind === 'min') {
            field.validation = field.validation || {};
            field.validation.min = check.value;
          }
          if (check.kind === 'max') {
            field.validation = field.validation || {};
            field.validation.max = check.value;
          }
          if (check.kind === 'regex') {
            field.validation = field.validation || {};
            field.validation.pattern = check.regex.source;
          }
        }
        
        // Generate placeholder
        field.placeholder = this.generatePlaceholder(field);
      }
      else if (unwrapped instanceof z.ZodNumber) {
        field.type = 'number';
        
        const checks = (unwrapped as any)._def.checks || [];
        for (const check of checks) {
          if (check.kind === 'min') {
            field.validation = field.validation || {};
            field.validation.min = check.value;
          }
          if (check.kind === 'max') {
            field.validation = field.validation || {};
            field.validation.max = check.value;
          }
        }
        
        field.placeholder = field.validation?.min ? `Min: ${field.validation.min}` : 'Enter a number';
      }
      else if (unwrapped instanceof z.ZodBoolean) {
        field.type = 'boolean';
        field.placeholder = undefined;
      }
      else if (unwrapped instanceof z.ZodDate) {
        field.type = 'date';
        field.placeholder = 'Select a date';
      }
      else if (unwrapped instanceof z.ZodEnum) {
        field.type = 'select';
        field.options = (unwrapped as any)._def.values;
        field.placeholder = 'Select an option';
      }
      else if (unwrapped instanceof z.ZodArray) {
        const elementType = (unwrapped as any)._def.type;
        
        if (elementType instanceof z.ZodEnum) {
          field.type = 'multiselect';
          field.options = (elementType as any)._def.values;
        } else if (elementType instanceof z.ZodString) {
          field.type = 'textarea';
          field.description = (field.description || '') + ' (Enter multiple values, one per line)';
        } else {
          field.type = 'json';
          field.description = (field.description || '') + ' (JSON array)';
        }
        
        field.placeholder = 'Enter values';
      }
      else if (unwrapped instanceof z.ZodObject) {
        field.type = 'json';
        field.placeholder = '{ "key": "value" }';
        field.description = (field.description || '') + ' (JSON object)';
      }
      else {
        // Default to string for unknown types
        field.type = 'string';
        console.warn(`[IntegrationSchemaService] Unknown Zod type for field ${name}:`, unwrapped.constructor.name);
      }
      
      return field;
    } catch (error) {
      console.error(`[IntegrationSchemaService] Error converting field ${name}:`, error);
      return null;
    }
  }
  
  /**
   * Format field name to label
   */
  private formatLabel(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
  
  /**
   * Generate placeholder text based on field type
   */
  private generatePlaceholder(field: FieldDefinition): string {
    switch (field.type) {
      case 'email':
        return 'user@example.com';
      case 'url':
        return 'https://example.com';
      case 'password':
        return '••••••••';
      case 'textarea':
        return `Enter ${field.label.toLowerCase()}...`;
      case 'number':
        return 'Enter a number';
      case 'date':
        return 'Select a date';
      case 'json':
        return '{ "key": "value" }';
      default:
        return `Enter ${field.label.toLowerCase()}`;
    }
  }
  
  /**
   * Validate field value against schema
   */
  async validateFieldValue(
    integrationSlug: string,
    actionId: string,
    fieldName: string,
    value: any
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const schema = await this.getActionSchema(integrationSlug, actionId);
      const field = schema.fields.find(f => f.name === fieldName);
      
      if (!field) {
        return { valid: false, error: 'Field not found' };
      }
      
      // Required field check
      if (field.required && (value === null || value === undefined || value === '')) {
        return { valid: false, error: `${field.label} is required` };
      }
      
      // Type-specific validation
      if (value !== null && value !== undefined && value !== '') {
        switch (field.type) {
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              return { valid: false, error: 'Invalid email format' };
            }
            break;
          
          case 'url':
            try {
              new URL(value);
            } catch {
              return { valid: false, error: 'Invalid URL format' };
            }
            break;
          
          case 'number':
            if (isNaN(Number(value))) {
              return { valid: false, error: 'Must be a number' };
            }
            if (field.validation?.min !== undefined && Number(value) < field.validation.min) {
              return { valid: false, error: `Must be at least ${field.validation.min}` };
            }
            if (field.validation?.max !== undefined && Number(value) > field.validation.max) {
              return { valid: false, error: `Must be at most ${field.validation.max}` };
            }
            break;
          
          case 'json':
            try {
              JSON.parse(value);
            } catch {
              return { valid: false, error: 'Invalid JSON format' };
            }
            break;
        }
        
        // String length validation
        if (field.type === 'string' || field.type === 'textarea') {
          if (field.validation?.min && value.length < field.validation.min) {
            return { valid: false, error: `Must be at least ${field.validation.min} characters` };
          }
          if (field.validation?.max && value.length > field.validation.max) {
            return { valid: false, error: `Must be at most ${field.validation.max} characters` };
          }
        }
      }
      
      return { valid: true };
    } catch (error) {
      console.error('[IntegrationSchemaService] Error validating field:', error);
      return { valid: false, error: 'Validation error' };
    }
  }
  
  /**
   * Clear schema cache
   */
  clearCache(integrationSlug?: string): void {
    if (integrationSlug) {
      // Clear cache for specific integration
      for (const key of this.schemaCache.keys()) {
        if (key.startsWith(`${integrationSlug}:`)) {
          this.schemaCache.delete(key);
        }
      }
      console.info(`[IntegrationSchemaService] Cleared cache for ${integrationSlug}`);
    } else {
      // Clear all cache
      this.schemaCache.clear();
      console.info('[IntegrationSchemaService] Cleared all schema cache');
    }
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.schemaCache.size,
      entries: Array.from(this.schemaCache.keys()),
    };
  }
}

export const integrationSchemaService = new IntegrationSchemaService();

