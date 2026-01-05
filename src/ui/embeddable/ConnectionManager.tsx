/**
 * Embeddable Connection Manager
 * For end users to manage their connected integrations
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { Badge } from '@/ui/components/badge';

interface Connection {
  id: string;
  integration: {
    id: string;
    slug: string;
    name: string;
    logo: string;
    category: string;
  };
  status: string;
  scope: string;
  createdAt: string;
  expiresAt: string | null;
}

interface ConnectionManagerProps {
  apiKey: string;
  endUserId: string;
  baseUrl?: string;
  onDisconnect?: (connectionId: string) => void;
}

export function ConnectionManager({
  apiKey,
  endUserId,
  baseUrl = '/api/public/v1',
  onDisconnect,
}: ConnectionManagerProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${baseUrl}/connections/list?endUserId=${endUserId}`,
        {
          headers: {
            'X-API-Key': apiKey,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setConnections(data.data.connections);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) {
      return;
    }

    try {
      setDisconnecting(connectionId);

      const response = await fetch(`${baseUrl}/connections/disconnect`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionId }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove from list
        setConnections((prev) =>
          prev.filter((conn) => conn.id !== connectionId)
        );
        onDisconnect?.(connectionId);
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    } finally {
      setDisconnecting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Connections Yet
          </h3>
          <p className="text-gray-600">
            Connect your first integration to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          My Connections
        </h2>
        <p className="text-gray-600">
          Manage your connected integrations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {connections.map((connection) => (
          <Card key={connection.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {connection.integrations.logo ? (
                    <img
                      src={connection.integrations.logo}
                      alt={connection.integrations.name}
                      className="w-12 h-12 rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                      {connection.integrations.name.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">
                        {connection.integrations.name}
                      </h3>
                      <Badge className={getStatusColor(connection.status)}>
                        {connection.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        Connected {formatDate(connection.createdAt)}
                      </span>
                      {connection.expiresAt && (
                        <span>
                          Expires {formatDate(connection.expiresAt)}
                        </span>
                      )}
                    </div>

                    {connection.scope && (
                      <div className="mt-2 text-xs text-gray-500">
                        Permissions: {connection.scope}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(connection.id)}
                    disabled={disconnecting === connection.id}
                  >
                    {disconnecting === connection.id ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        Disconnecting...
                      </div>
                    ) : (
                      'Disconnect'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

