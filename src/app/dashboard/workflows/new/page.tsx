"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { Badge } from '@/ui/components/badge';
import { 
  ArrowLeft, 
  Save, 
  Play,
  Zap,
  Settings,
  AlertCircle
} from 'lucide-react';
import { IntegrationSelector } from '@/ui/workflow/integration-selector';
import { ActionConfigurator } from '@/ui/workflow/action-configurator';
import { FieldMappingConfigurator } from '@/ui/workflow/field-mapping-configurator';

interface Integration {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}

interface App {
  id: string;
  name: string;
  appId: string;
}

export default function NewWorkflowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [fieldMappings, setFieldMappings] = useState<Record<string, any>>({});
  const [conditions, setConditions] = useState<any[]>([]);
  
  // Data
  const [apps, setApps] = useState<App[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [actionSchema, setActionSchema] = useState<any>(null);
  
  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedIntegration) {
      fetchActions(selectedIntegration);
    }
  }, [selectedIntegration]);

  useEffect(() => {
    if (selectedIntegration && selectedAction) {
      fetchActionSchema(selectedIntegration, selectedAction);
    }
  }, [selectedIntegration, selectedAction]);

  const fetchData = async () => {
    try {
      const [appsRes, integrationsRes] = await Promise.all([
        fetch('/api/dashboard/apps'),
        fetch('/api/integrations'),
      ]);

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        console.log('📦 Apps loaded:', appsData.apps?.length || 0);
        setApps(appsData.apps || []);
      } else {
        console.error('❌ Failed to fetch apps:', appsRes.status);
      }

      if (integrationsRes.ok) {
        const integrationsData = await integrationsRes.json();
        console.log('📦 Integrations loaded:', integrationsData.integrations?.length || 0);
        console.log('📦 Integration IDs:', integrationsData.integrations?.map((i: any) => ({ slug: i.slug, id: i.id })));
        setIntegrations(integrationsData.integrations || []);
      } else {
        console.error('❌ Failed to fetch integrations:', integrationsRes.status);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActions = async (integrationSlug: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationSlug}/actions`);
      if (response.ok) {
        const data = await response.json();
        setActions(data.actions || []);
      }
    } catch (error) {
      console.error('Failed to fetch actions:', error);
    }
  };

  const fetchActionSchema = async (integrationSlug: string, actionId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationSlug}/actions/${actionId}/schema`);
      if (response.ok) {
        const data = await response.json();
        setActionSchema(data.schema);
      }
    } catch (error) {
      console.error('Failed to fetch action schema:', error);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!workflowName.trim()) {
        newErrors.workflowName = 'Workflow name is required';
      }
      if (!selectedApp) {
        newErrors.selectedApp = 'Please select an app';
      }
      if (!selectedIntegration) {
        newErrors.selectedIntegration = 'Please select an integration';
      }
    }

    if (step === 2) {
      if (!selectedAction) {
        newErrors.selectedAction = 'Please select an action';
      }
    }

    if (step === 3) {
      // Validate required fields in field mappings
      if (actionSchema?.fields) {
        actionSchema.fields.forEach((field: any) => {
          if (field.required && !fieldMappings[field.name]?.trim()) {
            newErrors[field.name] = `${field.label || field.name} is required`;
          }
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSave = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setSaving(true);
    try {
      const foundIntegration = integrations.find(i => i.slug === selectedIntegration);
      
      console.log('🔍 Debug - Selected Integration:', selectedIntegration);
      console.log('🔍 Debug - Found Integration:', foundIntegration);
      console.log('🔍 Debug - All Integrations:', integrations);
      
      if (!foundIntegration?.id) {
        setErrors({ submit: 'Integration not found. Please select a valid integration.' });
        setSaving(false);
        return;
      }

      const workflow = {
        name: workflowName,
        description: workflowDescription,
        appId: selectedApp,
        integrationId: foundIntegration.id,
        definition: {
          version: '1.0',
          action: selectedAction,
          fieldMappings,
          conditions,
        },
        enabled: false, // Start as disabled
      };

      console.log('📤 Sending workflow data:', workflow);

      const response = await fetch('/api/dashboard/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });

      if (response.ok) {
        router.push('/dashboard/workflows');
      } else {
        const data = await response.json();
        console.error('❌ Workflow creation failed:', data);
        setErrors({ submit: data.error || 'Failed to create workflow' });
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      setErrors({ submit: 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedIntegrationData = integrations.find(i => i.slug === selectedIntegration);
  const selectedActionData = actions.find(a => a.id === selectedAction);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Workflow</h1>
            <p className="text-gray-600 mt-1">
              Build an integration-specific automation workflow
            </p>
          </div>
        </div>
        <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Basic Info', icon: Settings },
              { num: 2, label: 'Select Action', icon: Zap },
              { num: 3, label: 'Field Mapping', icon: Settings },
            ].map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;
              
              return (
                <div key={step.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isActive
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : isCompleted
                          ? 'border-green-600 bg-green-50 text-green-600'
                          : 'border-gray-300 bg-gray-50 text-gray-400'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-medium mt-2 text-center">
                      {step.label}
                    </div>
                  </div>
                  {idx < 2 && (
                    <div
                      className={`h-0.5 flex-1 mx-4 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {errors.submit && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>{errors.submit}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Basic Info & Integration Selection */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Details</CardTitle>
              <CardDescription>
                Provide basic information about your workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workflow Name *
                </label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.workflowName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Send Slack notification on new lead"
                />
                {errors.workflowName && (
                  <p className="text-sm text-red-600 mt-1">{errors.workflowName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe what this workflow does..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select App *
                </label>
                <select
                  value={selectedApp}
                  onChange={(e) => setSelectedApp(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.selectedApp ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Choose an app...</option>
                  {apps.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name} ({app.appId})
                    </option>
                  ))}
                </select>
                {errors.selectedApp && (
                  <p className="text-sm text-red-600 mt-1">{errors.selectedApp}</p>
                )}
                {apps.length === 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    No apps found. Please create an app first.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <IntegrationSelector
            integrations={integrations}
            selectedIntegration={selectedIntegration}
            onSelect={setSelectedIntegration}
            error={errors.selectedIntegration}
          />
        </div>
      )}

      {/* Step 2: Action Selection */}
      {currentStep === 2 && selectedIntegrationData && (
        <ActionConfigurator
          integration={selectedIntegrationData}
          actions={actions}
          selectedAction={selectedAction}
          onSelectAction={setSelectedAction}
          error={errors.selectedAction}
        />
      )}

      {/* Step 3: Field Mapping */}
      {currentStep === 3 && actionSchema && (
        <FieldMappingConfigurator
          actionName={selectedActionData?.name || 'Action'}
          actionDescription={selectedActionData?.description}
          fields={actionSchema.fields || []}
          mappings={fieldMappings}
          onMappingsChange={setFieldMappings}
          errors={errors}
          integrationName={selectedIntegrationData?.name || ''}
          actionId={selectedAction}
        />
      )}

      {/* Navigation Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  Previous
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {currentStep < 3 ? (
                <Button onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Workflow
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
