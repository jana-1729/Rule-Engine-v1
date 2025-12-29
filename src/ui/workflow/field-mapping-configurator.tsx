"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { Badge } from '@/ui/components/badge';
import { AIMappingButton } from '@/ui/components/ai-mapping-button';
import { 
  Zap, 
  Info, 
  Copy, 
  Check,
  AlertCircle,
  Code,
  Sparkles
} from 'lucide-react';

interface Field {
  name: string;
  type: string;
  label: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  default?: any;
  options?: any[];
}

interface FieldMappingConfiguratorProps {
  actionName: string;
  actionDescription?: string;
  fields: Field[];
  mappings: Record<string, string>;
  onMappingsChange: (mappings: Record<string, string>) => void;
  errors?: Record<string, string>;
  integrationName?: string;
  actionId?: string;
}

export function FieldMappingConfigurator({
  actionName,
  actionDescription,
  fields,
  mappings,
  onMappingsChange,
  errors = {},
  integrationName = '',
  actionId = '',
}: FieldMappingConfiguratorProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const handleFieldChange = (fieldName: string, value: string) => {
    onMappingsChange({
      ...mappings,
      [fieldName]: value,
    });
  };

  const copyTemplate = (fieldName: string) => {
    const template = `{{${fieldName}}}`;
    navigator.clipboard.writeText(template);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const insertTemplate = (fieldName: string, template: string) => {
    const currentValue = mappings[fieldName] || '';
    handleFieldChange(fieldName, currentValue + template);
  };

  const commonTemplates = [
    { label: 'User ID', value: '{{user_id}}' },
    { label: 'User Name', value: '{{user_name}}' },
    { label: 'User Email', value: '{{user_email}}' },
    { label: 'Timestamp', value: '{{timestamp}}' },
    { label: 'Date', value: '{{date}}' },
  ];

  const requiredFields = fields.filter(f => f.required);
  const optionalFields = fields.filter(f => !f.required);
  const completedRequired = requiredFields.filter(f => mappings[f.name]?.trim()).length;
  const progress = requiredFields.length > 0 
    ? Math.round((completedRequired / requiredFields.length) * 100) 
    : 100;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900">{actionName}</h3>
              {actionDescription && (
                <p className="text-sm text-blue-800 mt-1">{actionDescription}</p>
              )}
              
              {/* Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-blue-900 font-medium">
                    Required Fields: {completedRequired}/{requiredFields.length}
                  </span>
                  <span className="text-blue-700">{progress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      {showHelp && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-purple-900 mb-2">
                  How to use Field Mapping
                </h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Use <code className="px-1.5 py-0.5 bg-purple-100 rounded text-xs">{'{{variable_name}}'}</code> to insert dynamic data</li>
                  <li>• Mix static text with variables: <code className="px-1.5 py-0.5 bg-purple-100 rounded text-xs">Hello {'{{user_name}}'}</code></li>
                  <li>• Click template buttons to quickly insert common variables</li>
                  <li>• Required fields must be filled before saving</li>
                </ul>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI-Powered Field Mapping */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base">AI-Powered Field Mapping</CardTitle>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                NEW
              </Badge>
            </div>
            <AIMappingButton
              sourceSchema={fields.reduce((acc, field) => ({
                ...acc,
                [field.name]: { type: field.type, description: field.description }
              }), {})}
              targetSchema={fields.reduce((acc, field) => ({
                ...acc,
                [field.name]: { type: field.type, description: field.description }
              }), {})}
              context={`Mapping fields for ${actionName} in ${integrationName}`}
              onMappingGenerated={(suggestions) => {
                // Apply AI suggestions to field mappings
                const newMappings = { ...mappings };
                suggestions.mappings.forEach((mapping: any) => {
                  if (mapping.sourceField && mapping.targetField) {
                    newMappings[mapping.targetField] = `{{${mapping.sourceField}}}`;
                  }
                });
                onMappingsChange(newMappings);
                setShowAIPanel(true);
              }}
            />
          </div>
          <CardDescription>
            Let AI intelligently suggest field mappings based on field names and types
          </CardDescription>
        </CardHeader>
        {showAIPanel && (
          <CardContent>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">
                  AI suggestions applied! Review the mappings below and adjust as needed.
                </span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Common Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-base">Quick Templates</CardTitle>
          </div>
          <CardDescription>
            Click to copy common template variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {commonTemplates.map((template) => (
              <Button
                key={template.value}
                variant="outline"
                size="sm"
                onClick={() => copyTemplate(template.value.slice(2, -2))}
                className="gap-2"
              >
                {copiedField === template.value.slice(2, -2) ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {template.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Required Fields */}
      {requiredFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Required Fields
            </CardTitle>
            <CardDescription>
              These fields must be configured for the workflow to work
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {requiredFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-900">
                    {field.label}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertTemplate(field.name, `{{${field.name}}}`)}
                    className="h-7 text-xs"
                  >
                    <Code className="h-3 w-3 mr-1" />
                    Insert {'{{' + field.name + '}}'}
                  </Button>
                </div>
                
                {field.description && (
                  <p className="text-xs text-gray-600">{field.description}</p>
                )}
                
                <div className="relative">
                  {field.type === 'textarea' ? (
                    <textarea
                      value={mappings[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder || `Enter value or use {{variable}}`}
                      rows={3}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                        errors[field.name] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={mappings[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder || `Enter value or use {{variable}}`}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                        errors[field.name] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  )}
                  
                  {mappings[field.name]?.trim() && (
                    <div className="absolute right-3 top-2">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
                
                {errors[field.name] && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors[field.name]}
                  </p>
                )}
                
                {/* Example */}
                {field.placeholder && !errors[field.name] && (
                  <p className="text-xs text-gray-500">
                    Example: <code className="px-1.5 py-0.5 bg-gray-100 rounded">{field.placeholder}</code>
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Optional Fields */}
      {optionalFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Optional Fields</CardTitle>
            <CardDescription>
              Configure these fields if needed for your use case
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {optionalFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    <Badge variant="secondary" className="ml-2 text-xs">Optional</Badge>
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertTemplate(field.name, `{{${field.name}}}`)}
                    className="h-7 text-xs"
                  >
                    <Code className="h-3 w-3 mr-1" />
                    Insert {'{{' + field.name + '}}'}
                  </Button>
                </div>
                
                {field.description && (
                  <p className="text-xs text-gray-600">{field.description}</p>
                )}
                
                {field.type === 'textarea' ? (
                  <textarea
                    value={mappings[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder || `Enter value or use {{variable}}`}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                ) : (
                  <input
                    type="text"
                    value={mappings[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder || `Enter value or use {{variable}}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                )}
                
                {field.placeholder && (
                  <p className="text-xs text-gray-500">
                    Example: <code className="px-1.5 py-0.5 bg-gray-100 rounded">{field.placeholder}</code>
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-green-900 mb-1">
                Field Mapping Summary
              </h4>
              <p className="text-sm text-green-800">
                {completedRequired === requiredFields.length ? (
                  <>✓ All required fields are configured. You can now save the workflow.</>
                ) : (
                  <>Please configure {requiredFields.length - completedRequired} more required field(s) before saving.</>
                )}
              </p>
              <div className="mt-2 text-xs text-green-700">
                Total fields: {fields.length} • Required: {requiredFields.length} • Optional: {optionalFields.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

