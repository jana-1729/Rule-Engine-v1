/**
 * Embeddable Workflow Builder
 * For customers to create workflows with field mapping
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';

interface Action {
  id: string;
  name: string;
  description: string;
  inputSchema: any;
}

interface Integration {
  id: string;
  slug: string;
  name: string;
  logo: string;
  actions: Action[];
}

interface WorkflowBuilderProps {
  apiKey: string;
  integrationSlug: string;
  baseUrl?: string;
  onSave?: (workflow: any) => void;
}

export function WorkflowBuilder({
  apiKey,
  integrationSlug,
  baseUrl = '/api/public/v1',
  onSave,
}: WorkflowBuilderProps) {
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [fieldMapping, setFieldMapping] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadIntegration();
  }, [integrationSlug]);

  const loadIntegration = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/integrations`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });

      const data = await response.json();

      if (data.success) {
        const found = data.data.integrations.find(
          (i: any) => i.slug === integrationSlug
        );
        if (found) {
          setIntegration(found);
          if (found.actions.length > 0) {
            setSelectedAction(found.actions[0]);
            initializeFieldMapping(found.actions[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading integration:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeFieldMapping = (action: Action) => {
    const schema = action.inputSchema;
    const initialMapping: Record<string, any> = {};

    if (schema && schema.shape) {
      Object.keys(schema.shape).forEach((key) => {
        initialMapping[key] = '';
      });
    }

    setFieldMapping(initialMapping);
  };

  const handleActionChange = (actionId: string) => {
    const action = integration?.actions.find((a) => a.id === actionId);
    if (action) {
      setSelectedAction(action);
      initializeFieldMapping(action);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFieldMapping((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSave = async () => {
    if (!workflowName || !selectedAction) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${baseUrl}/workflows/create`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workflowName,
          description: workflowDescription,
          integrationSlug,
          action: selectedAction.id,
          fieldMapping,
          triggerType: 'manual',
          enabled: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSave?.(data.data.workflow);
        alert('Workflow created successfully!');
        
        // Reset form
        setWorkflowName('');
        setWorkflowDescription('');
        initializeFieldMapping(selectedAction);
      } else {
        alert(`Error: ${data.error.message}`);
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      alert('Failed to create workflow');
    } finally {
      setSaving(false);
    }
  };

  const renderFieldInput = (fieldName: string, fieldSchema: any) => {
    const value = fieldMapping[fieldName] || '';
    const description = fieldSchema._def?.description || '';
    const isRequired = !fieldSchema.isOptional();

    return (
      <div key={fieldName} className="space-y-2">
        <Label htmlFor={fieldName}>
          {fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}

        <div className="relative">
          <Input
            id={fieldName}
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={`Enter ${fieldName} or use {{variable}}`}
            className="font-mono text-sm"
          />
          <div className="absolute right-2 top-2 text-xs text-gray-400">
            Template variables: {`{{user.name}}`}
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Use {`{{variable}}`} syntax to insert dynamic data
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!integration) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-600">Integration not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {integration.logo && (
          <img
            src={integration.logo}
            alt={integration.name}
            className="w-16 h-16 rounded-lg"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Create {integration.name} Workflow
          </h2>
          <p className="text-gray-600">
            Configure your automation with field mapping
          </p>
        </div>
      </div>

      {/* Workflow Details */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="workflow-name">
              Workflow Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="workflow-name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="e.g., Send Slack notification on new user"
            />
          </div>

          <div>
            <Label htmlFor="workflow-description">Description</Label>
            <Textarea
              id="workflow-description"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              placeholder="Describe what this workflow does..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Action</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="action-select">Action</Label>
            <select
              id="action-select"
              value={selectedAction?.id || ''}
              onChange={(e) => handleActionChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {integration.actions.map((action) => (
                <option key={action.id} value={action.id}>
                  {action.name}
                </option>
              ))}
            </select>
            {selectedAction && (
              <p className="text-sm text-gray-600 mt-2">
                {selectedAction.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Field Mapping */}
      {selectedAction && (
        <Card>
          <CardHeader>
            <CardTitle>Field Mapping</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Map fields for the {selectedAction.name} action. Use template variables like {`{{user.name}}`} or {`{{order.id}}`} to insert dynamic data.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedAction.inputSchema && selectedAction.inputSchema.shape ? (
              Object.entries(selectedAction.inputSchema.shape).map(
                ([fieldName, fieldSchema]: [string, any]) =>
                  renderFieldInput(fieldName, fieldSchema)
              )
            ) : (
              <p className="text-gray-600">No fields to configure</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Example Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Template Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">
              You can use these template variables in your field values:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">{`{{user.name}}`}</code> - User's name
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">{`{{user.email}}`}</code> - User's email
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">{`{{user.id}}`}</code> - User's ID
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">{`{{order.id}}`}</code> - Order ID
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">{`{{order.total}}`}</code> - Order total
              </li>
            </ul>
            <p className="text-gray-500 mt-4">
              These variables will be replaced with actual values when the workflow executes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || !workflowName}>
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating...
            </div>
          ) : (
            'Create Workflow'
          )}
        </Button>
      </div>
    </div>
  );
}

