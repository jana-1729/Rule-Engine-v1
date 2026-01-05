/**
 * Embeddable Integration Catalog
 * For customers to display available integrations to their end users
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Badge } from '@/ui/components/badge';

interface Integration {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  logo: string;
  color: string;
  authType: string;
  connectedUsers: number;
  actions: any[];
}

interface IntegrationCatalogProps {
  apiKey: string;
  endUserId: string;
  onConnect: (integration: Integration) => void;
  baseUrl?: string;
  theme?: 'light' | 'dark';
}

export function IntegrationCatalog({
  apiKey,
  endUserId,
  onConnect,
  baseUrl = '/api/public/v1',
  theme = 'light',
}: IntegrationCatalogProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load integrations
      const integrationsRes = await fetch(`${baseUrl}/integrations`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });
      const integrationsData = await integrationsRes.json();

      // Load connections
      const connectionsRes = await fetch(
        `${baseUrl}/connections/list?endUserId=${endUserId}`,
        {
          headers: {
            'X-API-Key': apiKey,
          },
        }
      );
      const connectionsData = await connectionsRes.json();

      if (integrationsData.success) {
        setIntegrations(integrationsData.data.integrations);
      }

      if (connectionsData.success) {
        setConnections(connectionsData.data.connections);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isConnected = (integrationId: string) => {
    return connections.some(
      (conn) => conn.integrations.id === integrationId && conn.status === 'active'
    );
  };

  const handleConnect = async (integration: Integration) => {
    try {
      const response = await fetch(`${baseUrl}/connections/connect`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationSlug: integration.slug,
          endUserId,
          redirectUri: window.location.href,
        }),
      });

      const data = await response.json();

      if (data.success && data.data.authUrl) {
        // Redirect to OAuth URL
        window.location.href = data.data.authUrl;
      }

      onConnect(integration);
    } catch (error) {
      console.error('Error connecting:', error);
    }
  };

  const categories = [
    'all',
    ...Array.from(new Set(integrations.map((i) => i.category))),
  ];

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`integration-catalog ${theme}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Available Integrations
        </h2>
        <p className="text-gray-600">
          Connect your favorite apps and automate your workflow
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <Input
          type="search"
          placeholder="Search integrations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => {
          const connected = isConnected(integration.id);

          return (
            <Card
              key={integration.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {integration.logo ? (
                      <img
                        src={integration.logo}
                        alt={integration.name}
                        className="w-12 h-12 rounded-lg"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                        style={{ backgroundColor: integration.color || '#6B7280' }}
                      >
                        {integration.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {integration.name}
                      </CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {integration.category}
                      </Badge>
                    </div>
                  </div>
                  {connected && (
                    <Badge className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {integration.description}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>{integration.actions.length} actions</span>
                  <span>{integration.connectedUsers} users</span>
                </div>

                <Button
                  onClick={() => handleConnect(integration)}
                  disabled={connected}
                  className="w-full"
                  variant={connected ? 'outline' : 'default'}
                >
                  {connected ? 'Connected' : 'Connect'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No integrations found</p>
        </div>
      )}
    </div>
  );
}

