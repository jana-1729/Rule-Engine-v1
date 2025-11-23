import { FieldMapping, Transform } from '../integrations/types';
import { get, set } from 'lodash';

/**
 * Field Mapping Engine
 * Applies field mappings with transformations
 */

/**
 * Apply field mappings to transform data
 */
export async function applyFieldMappings(
  mappings: FieldMapping[],
  sourceData: any,
  staticValues: Record<string, any> = {}
): Promise<any> {
  const result: any = { ...staticValues };

  for (const mapping of mappings) {
    try {
      // Extract value from source using JSONPath
      let value = extractValue(sourceData, mapping.source);

      // Apply transformation if specified
      if (mapping.transform) {
        value = await applyTransform(value, mapping.transform, sourceData);
      }

      // Set value in target using JSONPath
      setValue(result, mapping.target, value);
    } catch (error) {
      console.error(`Error applying mapping ${mapping.source} -> ${mapping.target}:`, error);
      throw error;
    }
  }

  return result;
}

/**
 * Extract value from object using JSONPath-like expression
 */
function extractValue(obj: any, path: string): any {
  // Handle special cases
  if (path === '$') return obj;
  if (path.startsWith('$.')) path = path.slice(2);
  
  // Use lodash get for nested path access
  return get(obj, path);
}

/**
 * Set value in object using JSONPath-like expression
 */
function setValue(obj: any, path: string, value: any): void {
  if (path === '$') {
    throw new Error('Cannot set root object');
  }
  if (path.startsWith('$.')) path = path.slice(2);
  
  // Use lodash set for nested path setting
  set(obj, path, value);
}

/**
 * Apply transformation to a value
 */
async function applyTransform(
  value: any,
  transform: Transform,
  sourceData: any
): Promise<any> {
  switch (transform.type) {
    case 'static':
      return transform.config.value;

    case 'template':
      return applyTemplate(transform.config.template, sourceData);

    case 'function':
      return applyFunction(value, transform.config.code, sourceData);

    case 'conditional':
      return applyConditional(value, transform.config, sourceData);

    case 'format-date':
      return formatDate(value, transform.config);

    case 'format-number':
      return formatNumber(value, transform.config);

    case 'parse-json':
      return typeof value === 'string' ? JSON.parse(value) : value;

    case 'to-uppercase':
      return String(value).toUpperCase();

    case 'to-lowercase':
      return String(value).toLowerCase();

    case 'trim':
      return String(value).trim();

    case 'split':
      return String(value).split(transform.config.delimiter || ',');

    case 'join':
      return Array.isArray(value) 
        ? value.join(transform.config.delimiter || ',')
        : value;

    case 'replace':
      return String(value).replace(
        new RegExp(transform.config.search, transform.config.flags || 'g'),
        transform.config.replacement
      );

    case 'regex':
      const match = String(value).match(new RegExp(transform.config.pattern, transform.config.flags));
      return match ? match[transform.config.group || 0] : null;

    default:
      console.warn(`Unknown transform type: ${transform.type}`);
      return value;
  }
}

/**
 * Apply template string with variable substitution
 */
function applyTemplate(template: string, data: any): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = extractValue(data, path.trim());
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Apply custom JavaScript function
 * SECURITY NOTE: In production, this should use a sandboxed environment
 */
function applyFunction(value: any, code: string, data: any): any {
  try {
    // Create a function from the code string
    const fn = new Function('value', 'data', code);
    return fn(value, data);
  } catch (error) {
    console.error('Error executing custom function:', error);
    throw error;
  }
}

/**
 * Apply conditional transformation
 */
function applyConditional(value: any, config: any, data: any): any {
  const { condition, ifTrue, ifFalse } = config;
  
  // Evaluate condition
  const conditionResult = evaluateCondition(value, condition, data);
  
  return conditionResult ? ifTrue : ifFalse;
}

/**
 * Evaluate a condition
 */
function evaluateCondition(value: any, condition: any, data: any): boolean {
  const { operator, compareValue } = condition;
  
  switch (operator) {
    case 'equals':
      return value === compareValue;
    case 'not_equals':
      return value !== compareValue;
    case 'greater_than':
      return value > compareValue;
    case 'less_than':
      return value < compareValue;
    case 'contains':
      return String(value).includes(compareValue);
    case 'exists':
      return value !== null && value !== undefined;
    case 'empty':
      return !value || (Array.isArray(value) && value.length === 0);
    default:
      return false;
  }
}

/**
 * Format date value
 */
function formatDate(value: any, config: any): string {
  const date = new Date(value);
  
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  
  // Simple ISO format by default
  if (!config.format) {
    return date.toISOString();
  }
  
  // Custom formatting would go here
  // For production, use date-fns or similar
  return date.toISOString();
}

/**
 * Format number value
 */
function formatNumber(value: any, config: any): string {
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new Error(`Invalid number: ${value}`);
  }
  
  const { decimals = 2, locale = 'en-US' } = config;
  
  return num.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

