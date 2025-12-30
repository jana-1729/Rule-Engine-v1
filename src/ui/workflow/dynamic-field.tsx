"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/ui/components/input';
import { Textarea } from '@/ui/components/textarea';
import { Label } from '@/ui/components/label';
import { Badge } from '@/ui/components/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import { Switch } from '@/ui/components/switch';
import { 
  AlertCircle, 
  Info, 
  CheckCircle2,
  Sparkles,
  Code,
} from 'lucide-react';

/**
 * DynamicField Component
 * 
 * Renders a form field based on dynamic schema from IntegrationSchemaService
 * Supports all field types: string, textarea, number, boolean, select, etc.
 */

interface FieldDefinition {
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

interface DynamicFieldProps {
  field: FieldDefinition;
  value: any;
  onChange: (name: string, value: any) => void;
  error?: string;
  disabled?: boolean;
  showValidation?: boolean;
  allValues?: Record<string, any>;
}

export function DynamicField({
  field,
  value,
  onChange,
  error,
  disabled = false,
  showValidation = true,
  allValues = {},
}: DynamicFieldProps) {
  const [localValue, setLocalValue] = useState(value || field.default || '');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>('');

  // Check if field should be visible based on dependencies
  const isVisible = () => {
    if (!field.dependsOn) return true;
    
    const dependentValue = allValues[field.dependsOn.field];
    return dependentValue === field.dependsOn.value;
  };

  useEffect(() => {
    setLocalValue(value || field.default || '');
  }, [value, field.default]);

  // Validate field value
  useEffect(() => {
    if (!showValidation || !localValue) {
      setIsValid(null);
      setValidationMessage('');
      return;
    }

    const validate = () => {
      // Required check
      if (field.required && !localValue) {
        setIsValid(false);
        setValidationMessage(`${field.label} is required`);
        return;
      }

      // Type-specific validation
      switch (field.type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(localValue)) {
            setIsValid(false);
            setValidationMessage('Invalid email format');
            return;
          }
          break;

        case 'url':
          try {
            new URL(localValue);
          } catch {
            setIsValid(false);
            setValidationMessage('Invalid URL format');
            return;
          }
          break;

        case 'number':
          if (isNaN(Number(localValue))) {
            setIsValid(false);
            setValidationMessage('Must be a number');
            return;
          }
          if (field.validation?.min !== undefined && Number(localValue) < field.validation.min) {
            setIsValid(false);
            setValidationMessage(`Must be at least ${field.validation.min}`);
            return;
          }
          if (field.validation?.max !== undefined && Number(localValue) > field.validation.max) {
            setIsValid(false);
            setValidationMessage(`Must be at most ${field.validation.max}`);
            return;
          }
          break;

        case 'json':
          try {
            JSON.parse(localValue);
          } catch {
            setIsValid(false);
            setValidationMessage('Invalid JSON format');
            return;
          }
          break;
      }

      // String length validation
      if ((field.type === 'string' || field.type === 'textarea') && typeof localValue === 'string') {
        if (field.validation?.min && localValue.length < field.validation.min) {
          setIsValid(false);
          setValidationMessage(`Must be at least ${field.validation.min} characters`);
          return;
        }
        if (field.validation?.max && localValue.length > field.validation.max) {
          setIsValid(false);
          setValidationMessage(`Must be at most ${field.validation.max} characters`);
          return;
        }
      }

      setIsValid(true);
      setValidationMessage('');
    };

    const timeoutId = setTimeout(validate, 300);
    return () => clearTimeout(timeoutId);
  }, [localValue, field, showValidation]);

  const handleChange = (newValue: any) => {
    setLocalValue(newValue);
    onChange(field.name, newValue);
  };

  if (!isVisible()) {
    return null;
  }

  const renderField = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            id={field.name}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={`min-h-[100px] ${error || (showValidation && isValid === false) ? 'border-red-500' : ''} ${showValidation && isValid ? 'border-green-500' : ''}`}
            rows={4}
          />
        );

      case 'number':
        return (
          <Input
            id={field.name}
            type="number"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            min={field.validation?.min}
            max={field.validation?.max}
            className={`${error || (showValidation && isValid === false) ? 'border-red-500' : ''} ${showValidation && isValid ? 'border-green-500' : ''}`}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={field.name}
              checked={localValue === true || localValue === 'true'}
              onCheckedChange={(checked: boolean) => handleChange(checked)}
              disabled={disabled}
            />
            <Label htmlFor={field.name} className="text-sm text-gray-600">
              {localValue ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        );

      case 'select':
        return (
          <Select
            value={localValue}
            onValueChange={handleChange}
            disabled={disabled}
          >
            <SelectTrigger className={`${error || (showValidation && isValid === false) ? 'border-red-500' : ''} ${showValidation && isValid ? 'border-green-500' : ''}`}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => {
                const optionValue = typeof option === 'string' ? option : option.value;
                const optionLabel = typeof option === 'string' ? option : option.label;
                return (
                  <SelectItem key={optionValue} value={optionValue}>
                    {optionLabel}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <Input
            id={field.name}
            type="date"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={`${error || (showValidation && isValid === false) ? 'border-red-500' : ''} ${showValidation && isValid ? 'border-green-500' : ''}`}
          />
        );

      case 'email':
        return (
          <Input
            id={field.name}
            type="email"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder || 'user@example.com'}
            disabled={disabled}
            className={`${error || (showValidation && isValid === false) ? 'border-red-500' : ''} ${showValidation && isValid ? 'border-green-500' : ''}`}
          />
        );

      case 'url':
        return (
          <Input
            id={field.name}
            type="url"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder || 'https://example.com'}
            disabled={disabled}
            className={`${error || (showValidation && isValid === false) ? 'border-red-500' : ''} ${showValidation && isValid ? 'border-green-500' : ''}`}
          />
        );

      case 'password':
        return (
          <Input
            id={field.name}
            type="password"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder || '••••••••'}
            disabled={disabled}
            className={`${error || (showValidation && isValid === false) ? 'border-red-500' : ''} ${showValidation && isValid ? 'border-green-500' : ''}`}
          />
        );

      case 'json':
        return (
          <div className="space-y-2">
            <Textarea
              id={field.name}
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder || '{ "key": "value" }'}
              disabled={disabled}
              className={`font-mono text-sm min-h-[120px] ${error || (showValidation && isValid === false) ? 'border-red-500' : ''} ${showValidation && isValid ? 'border-green-500' : ''}`}
              rows={5}
            />
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Code className="h-3 w-3" />
              <span>JSON format required</span>
            </div>
          </div>
        );

      default: // string
        return (
          <Input
            id={field.name}
            type="text"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={`${error || (showValidation && isValid === false) ? 'border-red-500' : ''} ${showValidation && isValid ? 'border-green-500' : ''}`}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={field.name} className="text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        {showValidation && isValid === true && (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
      </div>

      {field.description && (
        <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 p-2 rounded-md">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>{field.description}</span>
        </div>
      )}

      {renderField()}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-md">
          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Validation message */}
      {!error && showValidation && validationMessage && (
        <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>{validationMessage}</span>
        </div>
      )}

      {/* Validation rules hint */}
      {field.validation && !error && !validationMessage && (
        <div className="text-xs text-gray-400">
          {field.validation.min && field.validation.max && (
            <span>
              {field.type === 'number' 
                ? `Range: ${field.validation.min} - ${field.validation.max}`
                : `Length: ${field.validation.min} - ${field.validation.max} characters`
              }
            </span>
          )}
          {field.validation.min && !field.validation.max && (
            <span>
              {field.type === 'number' 
                ? `Minimum: ${field.validation.min}`
                : `Min length: ${field.validation.min} characters`
              }
            </span>
          )}
          {field.validation.max && !field.validation.min && (
            <span>
              {field.type === 'number' 
                ? `Maximum: ${field.validation.max}`
                : `Max length: ${field.validation.max} characters`
              }
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * DynamicFieldGroup Component
 * 
 * Renders a group of dynamic fields with proper spacing and organization
 */

interface DynamicFieldGroupProps {
  fields: FieldDefinition[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  showValidation?: boolean;
  title?: string;
  description?: string;
}

export function DynamicFieldGroup({
  fields,
  values,
  onChange,
  errors = {},
  disabled = false,
  showValidation = true,
  title,
  description,
}: DynamicFieldGroupProps) {
  const requiredFields = fields.filter(f => f.required);
  const optionalFields = fields.filter(f => !f.required);

  return (
    <div className="space-y-6">
      {title && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}

      {/* Required fields */}
      {requiredFields.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">Required</Badge>
            <span className="text-xs text-gray-500">{requiredFields.length} field{requiredFields.length !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {requiredFields.map((field) => (
              <DynamicField
                key={field.name}
                field={field}
                value={values[field.name]}
                onChange={onChange}
                error={errors[field.name]}
                disabled={disabled}
                showValidation={showValidation}
                allValues={values}
              />
            ))}
          </div>
        </div>
      )}

      {/* Optional fields */}
      {optionalFields.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">Optional</Badge>
            <span className="text-xs text-gray-500">{optionalFields.length} field{optionalFields.length !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {optionalFields.map((field) => (
              <DynamicField
                key={field.name}
                field={field}
                value={values[field.name]}
                onChange={onChange}
                error={errors[field.name]}
                disabled={disabled}
                showValidation={showValidation}
                allValues={values}
              />
            ))}
          </div>
        </div>
      )}

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No fields to configure</p>
        </div>
      )}
    </div>
  );
}

