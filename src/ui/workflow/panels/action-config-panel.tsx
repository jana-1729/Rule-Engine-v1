'use client';

import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/components/card';
import { Label } from '@/ui/components/label';
import { Input } from '@/ui/components/input';
import { Button } from '@/ui/components/button';
import { Badge } from '@/ui/components/badge';
import { DynamicFieldGroup } from '../dynamic-field';
import { Search, CheckCircle2, Link as LinkIcon } from 'lucide-react';

interface ActionConfigPanelProps {
  node: Node;
  onUpdate: (data: any) => void;
}

export function ActionConfigPanel({ node, onUpdate }: ActionConfigPanelProps) {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [actionSchema, setActionSchema] = useState<any>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetchIntegrations();
    
    // Load existing configuration
    const nodeData = node.data as any;
    if (nodeData.integration) {
      setSelectedIntegration(nodeData.integration);
      setIsConnected(nodeData.connected || false);
      fetchActions(nodeData.integration.slug);
    }
    if (nodeData.action) {
      setSelectedAction(nodeData.action);
    }
  }, [node]);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/integrations');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
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

  const handleIntegrationSelect = async (integration: any) => {
    setSelectedIntegration(integration);
    setSelectedAction('');
    setActionSchema(null);
    setActions([]);
    
    // Fetch actions
    await fetchActions(integration.slug);
    
    // Check connection
    checkConnection(integration);
    
    // Update node
    onUpdate({
      integration: {
        id: integration.id,
        slug: integration.slug,
        name: integration.name,
        logo: integration.logo,
      },
      action: '',
      configured: false,
      connected: false,
      fieldCount: 0,
    });
  };

  const checkConnection = async (integration: any) => {
    try {
      const response = await fetch('/api/connections/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: 'demo-app-1', // TODO: Get from session
          endUserId: 'demo-user-1', // TODO: Get from session
          integrationId: integration.id,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected || false);
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
      setIsConnected(false);
    }
  };

  const handleActionSelect = async (action: any) => {
    setSelectedAction(action.id);
    
    // Fetch schema
    await fetchActionSchema(selectedIntegration.slug, action.id);
    
    // Update node
    onUpdate({
      integration: selectedIntegration,
      action: action.name,
      configured: false,
      connected: isConnected,
      fieldCount: 0,
    });
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    const newFieldValues = { ...fieldValues, [fieldName]: value };
    setFieldValues(newFieldValues);
    
    // Count configured fields
    const configuredCount = Object.keys(newFieldValues).filter(
      key => newFieldValues[key] !== '' && newFieldValues[key] !== null && newFieldValues[key] !== undefined
    ).length;
    
    // Update node
    onUpdate({
      integration: selectedIntegration,
      action: selectedAction,
      configured: configuredCount > 0,
      connected: isConnected,
      fieldCount: configuredCount,
      fieldValues: newFieldValues,
      label: `${selectedIntegration.name}: ${actions.find(a => a.id === selectedAction)?.name || selectedAction}`,
    });
  };

  const handleConnect = async () => {
    if (!selectedIntegration) return;
    
    try {
      const response = await fetch('/api/connections/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: 'demo-app-1', // TODO: Get from session
          endUserId: 'demo-user-1', // TODO: Get from session
          integrationId: selectedIntegration.id,
          redirectUri: window.location.href,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authorizationUrl;
      }
    } catch (error) {
      console.error('Failed to initiate OAuth:', error);
    }
  };

  const filteredIntegrations = integrations.filter(integration =>
    integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    integration.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Step 1: Select Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Select Integration</CardTitle>
          <CardDescription>
            Choose which service to perform an action on
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Integration Grid */}
          <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="col-span-2 text-center py-8 text-gray-500">
                Loading integrations...
              </div>
            ) : filteredIntegrations.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-500">
                No integrations found
              </div>
            ) : (
              filteredIntegrations.map((integration) => (
                <button
                  key={integration.id}
                  onClick={() => handleIntegrationSelect(integration)}
                  className={`p-3 border-2 rounded-lg hover:border-green-300 transition text-left ${
                    selectedIntegration?.id === integration.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {integration.logo && (
                      <img
                        src={integration.logo}
                        alt={integration.name}
                        className="w-8 h-8 rounded object-contain"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {integration.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {integration.category}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          
          {/* Selected Integration Info */}
          {selectedIntegration && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedIntegration.logo && (
                    <img
                      src={selectedIntegration.logo}
                      alt={selectedIntegration.name}
                      className="w-8 h-8 rounded"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-sm">
                      {selectedIntegration.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {selectedIntegration.category}
                    </p>
                  </div>
                </div>
                {isConnected ? (
                  <Badge variant="default" className="gap-1 bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleConnect}
                    className="gap-2"
                  >
                    <LinkIcon className="h-3 w-3" />
                    Connect
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Select Action */}
      {selectedIntegration && actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Select Action</CardTitle>
            <CardDescription>
              Choose what action to perform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionSelect(action)}
                className={`w-full p-3 border-2 rounded-lg hover:border-green-300 transition text-left ${
                  selectedAction === action.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                <p className="font-medium text-sm">{action.name}</p>
                {action.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {action.description}
                  </p>
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Configure Fields */}
      {selectedIntegration && selectedAction && actionSchema && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Configure Fields</CardTitle>
            <CardDescription>
              Fill in the required information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DynamicFieldGroup
              fields={actionSchema.fields || []}
              values={fieldValues}
              onChange={handleFieldChange}
            />
          </CardContent>
        </Card>
      )}

      {/* Configuration Summary */}
      {selectedIntegration && selectedAction && Object.keys(fieldValues).length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">
                  Action Configured
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Will perform <strong>{actions.find(a => a.id === selectedAction)?.name}</strong> in <strong>{selectedIntegration.name}</strong> with {Object.keys(fieldValues).length} field(s) configured
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

