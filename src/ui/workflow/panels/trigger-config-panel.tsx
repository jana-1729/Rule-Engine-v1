'use client';

import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/components/card';
import { Label } from '@/ui/components/label';
import { Input } from '@/ui/components/input';
import { Button } from '@/ui/components/button';
import { Badge } from '@/ui/components/badge';
import { Search, CheckCircle2, AlertCircle, Link as LinkIcon } from 'lucide-react';

interface TriggerConfigPanelProps {
  node: Node;
  onUpdate: (data: any) => void;
}

export function TriggerConfigPanel({ node, onUpdate }: TriggerConfigPanelProps) {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
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
    }
    if (nodeData.event) {
      setSelectedEvent(nodeData.event);
    }
    
    // Check for OAuth success in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      const connectedIntegrationId = urlParams.get('integration');
      if (connectedIntegrationId && nodeData.integration?.id === connectedIntegrationId) {
        // Refresh connection status
        checkConnection(nodeData.integration);
      }
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

  const handleIntegrationSelect = async (integration: any) => {
    setSelectedIntegration(integration);
    
    // Fetch available events/triggers for this integration
    // For now, we'll use mock events
    const mockEvents = [
      'New Issue Created',
      'Issue Updated',
      'Issue Closed',
      'New Pull Request',
      'Pull Request Merged',
    ];
    setEvents(mockEvents);
    
    // Check connection status
    checkConnection(integration);
    
    // Update node
    onUpdate({
      integration: {
        id: integration.id,
        slug: integration.slug,
        name: integration.name,
        logo: integration.logo,
      },
      event: selectedEvent,
      configured: false,
      connected: false,
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
          integrationId: integration.slug, // Use slug, not database ID
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

  const handleEventSelect = (event: string) => {
    setSelectedEvent(event);
    
    // Update node with complete configuration
    onUpdate({
      integration: selectedIntegration,
      event,
      configured: true,
      connected: isConnected,
      label: `${selectedIntegration.name}: ${event}`,
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
          integrationId: selectedIntegration.slug, // Use slug, not database ID
          redirectUri: window.location.href,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Redirect to OAuth
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
            Choose which service will trigger this workflow
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
                  className={`p-3 border-2 rounded-lg hover:border-blue-300 transition text-left ${
                    selectedIntegration?.id === integration.id
                      ? 'border-blue-500 bg-blue-50'
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
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
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

      {/* Step 2: Select Event */}
      {selectedIntegration && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Select Trigger Event</CardTitle>
            <CardDescription>
              Choose what event will start this workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No events available for this integration
              </div>
            ) : (
              events.map((event) => (
                <button
                  key={event}
                  onClick={() => handleEventSelect(event)}
                  className={`w-full p-3 border-2 rounded-lg hover:border-blue-300 transition text-left ${
                    selectedEvent === event
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <p className="font-medium text-sm">{event}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Triggers when a new {event.toLowerCase()} occurs
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Filters (Optional) */}
      {selectedIntegration && selectedEvent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Add Filters (Optional)</CardTitle>
            <CardDescription>
              Only trigger when certain conditions are met
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full">
              + Add Filter
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Configuration Summary */}
      {selectedIntegration && selectedEvent && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">
                  Trigger Configured
                </p>
                <p className="text-sm text-green-700 mt-1">
                  This workflow will run when <strong>{selectedEvent}</strong> occurs in <strong>{selectedIntegration.name}</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

