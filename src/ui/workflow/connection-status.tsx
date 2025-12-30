"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/ui/components/button';
import { Card, CardContent } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { 
  CheckCircle2, 
  AlertCircle, 
  Link as LinkIcon,
  ExternalLink,
  RefreshCw,
  Loader2,
  Shield,
  Clock,
} from 'lucide-react';

/**
 * ConnectionStatus Component
 * 
 * Displays the connection status for an integration in the workflow builder
 * Handles OAuth flow initiation if not connected
 */

interface Connection {
  id: string;
  status: 'active' | 'expired' | 'error' | 'revoked';
  lastUsedAt?: string;
  lastError?: any;
  integration: {
    slug: string;
    name: string;
    logo?: string;
  };
}

interface ConnectionStatusProps {
  appId: string;
  endUserId: string;
  integrationSlug: string;
  integrationName: string;
  integrationLogo?: string;
  onConnectionChange?: (connected: boolean) => void;
}

export function ConnectionStatus({
  appId,
  endUserId,
  integrationSlug,
  integrationName,
  integrationLogo,
  onConnectionChange,
}: ConnectionStatusProps) {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, [appId, endUserId, integrationSlug]);

  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(connection?.status === 'active');
    }
  }, [connection, onConnectionChange]);

  const checkConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`[ConnectionStatus] Checking connection for ${integrationSlug}...`);
      
      const response = await fetch('/api/connections/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          endUserId,
          integrationId: integrationSlug, // API expects integrationId
        }),
      });

      const data = await response.json();

      if (data.success && data.hasConnection) {
        console.log(`[ConnectionStatus] ✅ Connected to ${integrationSlug}`);
        setConnection(data.connection);
      } else {
        console.log(`[ConnectionStatus] ❌ Not connected to ${integrationSlug}`);
        setConnection(null);
      }
    } catch (err: any) {
      console.error('[ConnectionStatus] Error checking connection:', err);
      setError('Failed to check connection status');
    } finally {
      setLoading(false);
    }
  };

  const initiateConnection = async () => {
    setConnecting(true);
    setError(null);

    try {
      console.log(`[ConnectionStatus] Initiating OAuth for ${integrationSlug}...`);
      
      const response = await fetch('/api/connections/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          endUserId,
          integrationId: integrationSlug,
          redirectUri: window.location.href, // Return to current page after OAuth
        }),
      });

      const data = await response.json();

      if (data.success && data.authorizationUrl) {
        console.log(`[ConnectionStatus] ✅ Redirecting to OAuth...`);
        // Redirect to OAuth provider
        window.location.href = data.authorizationUrl;
      } else {
        throw new Error(data.error?.message || 'Failed to initiate connection');
      }
    } catch (err: any) {
      console.error('[ConnectionStatus] Error initiating connection:', err);
      setError(err.message || 'Failed to connect integration');
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Checking connection status...
              </p>
              <p className="text-xs text-gray-500">
                Verifying your {integrationName} connection
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Connected state
  if (connection && connection.status === 'active') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {integrationLogo && (
                <img 
                  src={integrationLogo} 
                  alt={integrationName}
                  className="w-10 h-10 rounded-lg"
                />
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-semibold text-green-900">
                    Connected to {integrationName}
                  </p>
                  <Badge variant="default" className="bg-green-600 text-white">
                    Active
                  </Badge>
                </div>
                <p className="text-xs text-green-700">
                  Your {integrationName} account is connected and ready to use
                </p>
                {connection.lastUsedAt && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                    <Clock className="h-3 w-3" />
                    <span>
                      Last used: {new Date(connection.lastUsedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkConnection}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (connection && (connection.status === 'error' || connection.status === 'expired')) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {integrationLogo && (
                <img 
                  src={integrationLogo} 
                  alt={integrationName}
                  className="w-10 h-10 rounded-lg opacity-75"
                />
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-900">
                    Connection {connection.status === 'expired' ? 'Expired' : 'Error'}
                  </p>
                  <Badge variant="secondary" className="bg-amber-200 text-amber-900">
                    {connection.status}
                  </Badge>
                </div>
                <p className="text-xs text-amber-700 mb-3">
                  {connection.status === 'expired' 
                    ? 'Your connection has expired. Please reconnect to continue.'
                    : 'There was an error with your connection. Please reconnect.'}
                </p>
                {connection.lastError && (
                  <p className="text-xs text-amber-600 bg-amber-100 p-2 rounded mb-3">
                    {connection.lastError.message || 'Unknown error'}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={initiateConnection}
              disabled={connecting}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reconnect
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not connected state
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {integrationLogo && (
              <img 
                src={integrationLogo} 
                alt={integrationName}
                className="w-10 h-10 rounded-lg opacity-75"
              />
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <LinkIcon className="h-5 w-5 text-blue-600" />
                <p className="text-sm font-semibold text-blue-900">
                  Connect {integrationName}
                </p>
                <Badge variant="secondary" className="bg-blue-200 text-blue-900">
                  Required
                </Badge>
              </div>
              <p className="text-xs text-blue-700 mb-2">
                Connect your {integrationName} account to use this integration in workflows
              </p>
              <div className="flex items-start gap-2 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  Your credentials are encrypted and stored securely. We never see your password.
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={initiateConnection}
            disabled={connecting}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {connecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-1" />
                Connect
              </>
            )}
          </Button>
        </div>
        
        {error && (
          <div className="mt-3 flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * ConnectionStatusBadge Component
 * 
 * Compact badge version for displaying connection status inline
 */

interface ConnectionStatusBadgeProps {
  status: 'connected' | 'disconnected' | 'error' | 'expired';
  size?: 'sm' | 'md';
}

export function ConnectionStatusBadge({ status, size = 'sm' }: ConnectionStatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  
  const statusConfig = {
    connected: {
      icon: CheckCircle2,
      label: 'Connected',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    disconnected: {
      icon: LinkIcon,
      label: 'Not Connected',
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    error: {
      icon: AlertCircle,
      label: 'Error',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
    expired: {
      icon: Clock,
      label: 'Expired',
      className: 'bg-amber-100 text-amber-800 border-amber-200',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${sizeClasses} flex items-center gap-1 border`}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {config.label}
    </Badge>
  );
}

