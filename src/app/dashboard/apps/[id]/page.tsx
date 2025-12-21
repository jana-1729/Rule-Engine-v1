"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { Badge } from '@/ui/components/badge';
import { 
  Copy, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle2,
  Activity,
  Key,
  Shield,
  Trash2
} from 'lucide-react';

interface App {
  id: string;
  appId: string;
  name: string;
  description: string | null;
  status: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    connections: number;
    executions: number;
    endUsers: number;
  };
}

export default function AppDetailPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params.id as string;

  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  useEffect(() => {
    // Check if this is a new app with API key in URL
    const urlParams = new URLSearchParams(window.location.search);
    const newApiKey = urlParams.get('apiKey');
    const isNew = urlParams.get('new');
    
    if (isNew && newApiKey) {
      setApiKey(decodeURIComponent(newApiKey));
      setShowApiKey(true);
      // Clean up URL
      window.history.replaceState({}, '', `/dashboard/apps/${appId}`);
    }
    
    fetchApp();
  }, [appId]);

  const fetchApp = async () => {
    try {
      const response = await fetch(`/api/dashboard/apps/${appId}`);
      if (response.ok) {
        const data = await response.json();
        setApp(data.app);
        // API key is only shown once after creation or regeneration
        if (data.apiKey) {
          setApiKey(data.apiKey);
          setShowApiKey(true);
        }
      } else {
        router.push('/dashboard/apps');
      }
    } catch (error) {
      console.error('Failed to fetch app:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateKey = async () => {
    setRegenerating(true);
    try {
      const response = await fetch(`/api/dashboard/apps/${appId}/regenerate`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setApiKey(data.apiKey);
        setShowApiKey(true);
        setShowRegenerateConfirm(false);
        // Refresh app data
        fetchApp();
      } else {
        alert('Failed to regenerate API key');
      }
    } catch (error) {
      console.error('Failed to regenerate key:', error);
      alert('An error occurred');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!app) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{app.name}</h1>
            <Badge variant={app.status === 'active' ? 'default' : 'secondary'}>
              {app.status}
            </Badge>
          </div>
          <p className="text-gray-600 mt-2">
            {app.description || 'No description provided'}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/apps')}>
          ← Back to Apps
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {app._count.endUsers}
                </div>
                <div className="text-sm text-gray-600">End Users</div>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {app._count.connections}
                </div>
                <div className="text-sm text-gray-600">Connections</div>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {app._count.executions}
                </div>
                <div className="text-sm text-gray-600">Executions</div>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* App ID */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            App ID
          </CardTitle>
          <CardDescription>
            Use this ID to identify your app in API requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-3 bg-gray-100 rounded-md font-mono text-sm">
              {app.appId}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(app.appId, 'App ID')}
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            API Key
          </CardTitle>
          <CardDescription>
            Keep this key secure. It provides full access to your app's resources.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKey ? (
            <>
              {/* Show full key (only after creation/regeneration) */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-yellow-900 mb-2">
                      Save this API key now!
                    </div>
                    <div className="text-sm text-yellow-800 mb-3">
                      This is the only time you'll see the full key. Store it securely.
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-4 py-3 bg-white border border-yellow-300 rounded-md font-mono text-sm break-all">
                        {showApiKey ? apiKey : '•'.repeat(50)}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(apiKey, 'API Key')}
                      >
                        {copied ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Show masked key for existing apps */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-blue-900 mb-2">
                      API Key is Hidden for Security
                    </div>
                    <div className="text-sm text-blue-800 mb-3">
                      For security reasons, we don't store the original API key. It was only shown once when you created this app.
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <code className="flex-1 px-4 py-3 bg-white border border-blue-300 rounded-md font-mono text-sm">
                        app_••••••••••••••••••••••••••••••••
                      </code>
                    </div>
                    <div className="text-sm text-blue-800">
                      <strong>Lost your API key?</strong> You can regenerate it below. This will invalidate the old key.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Regenerate Section */}
          <div className="pt-4 border-t">
            {!showRegenerateConfirm ? (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    Need to Copy Your API Key?
                  </div>
                  <div className="text-sm text-gray-600">
                    {apiKey ? (
                      'Your new API key is displayed above. Make sure to copy it now!'
                    ) : (
                      'Regenerate your API key to get a new one that you can copy. The old key will be invalidated.'
                    )}
                  </div>
                </div>
                {!apiKey && (
                  <Button
                    variant="outline"
                    onClick={() => setShowRegenerateConfirm(true)}
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate Key
                  </Button>
                )}
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-orange-900 mb-2">
                      Are you sure you want to regenerate the API key?
                    </div>
                    <div className="text-sm text-orange-800 mb-4">
                      This will immediately invalidate your current API key. All API requests
                      using the old key will fail. You'll need to update your integration
                      with the new key.
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRegenerateConfirm(false)}
                        disabled={regenerating}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleRegenerateKey}
                        disabled={regenerating}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {regenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Yes, Regenerate Key
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-600">Created</dt>
              <dd className="font-medium text-gray-900 mt-1">
                {new Date(app.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600">Last Updated</dt>
              <dd className="font-medium text-gray-900 mt-1">
                {new Date(app.updatedAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>
            {apiKey 
              ? 'Use these code examples with your API key above'
              : 'Use these code examples with your API key (regenerate above to copy it)'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!apiKey && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-700">
              💡 <strong>Tip:</strong> Regenerate your API key above to see it in these examples and copy it to your clipboard.
            </div>
          )}
          
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              Authentication Header
            </div>
            <div className="relative">
              <code className="block px-4 py-3 bg-gray-900 text-gray-100 rounded-md font-mono text-xs overflow-x-auto">
                Authorization: Bearer {apiKey || 'YOUR_API_KEY'}
              </code>
              {apiKey && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
                  onClick={() => copyToClipboard(`Authorization: Bearer ${apiKey}`, 'Header')}
                >
                  {copied ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              Example cURL Request
            </div>
            <div className="relative">
              <code className="block px-4 py-3 bg-gray-900 text-gray-100 rounded-md font-mono text-xs overflow-x-auto whitespace-pre">
{`curl -X GET https://your-domain.com/api/v1/integrations \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json"`}
              </code>
              {apiKey && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
                  onClick={() => copyToClipboard(`curl -X GET https://your-domain.com/api/v1/integrations -H "Authorization: Bearer ${apiKey}" -H "Content-Type: application/json"`, 'cURL')}
                >
                  {copied ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              JavaScript Example
            </div>
            <div className="relative">
              <code className="block px-4 py-3 bg-gray-900 text-gray-100 rounded-md font-mono text-xs overflow-x-auto whitespace-pre">
{`const response = await fetch('/api/v1/integrations', {
  headers: {
    'Authorization': 'Bearer ${apiKey || 'YOUR_API_KEY'}',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();`}
              </code>
              {apiKey && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
                  onClick={() => copyToClipboard(`const response = await fetch('/api/v1/integrations', {\n  headers: {\n    'Authorization': 'Bearer ${apiKey}',\n    'Content-Type': 'application/json'\n  }\n});\nconst data = await response.json();`, 'JavaScript')}
                >
                  {copied ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
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

