'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { Badge } from '@/ui/components/badge';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Alert, AlertDescription } from '@/ui/components/alert';
import { Copy, Check, AlertCircle, CheckCircle2, ArrowLeft, Settings2 } from 'lucide-react';

export default function IntegrationSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  // Integration data
  const [integration, setIntegration] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  
  // Form state
  const [credentialMode, setCredentialMode] = useState('platform');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  
  // UI state
  const [testResult, setTestResult] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchData();
  }, [slug]);
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch integration details
      const integrationRes = await fetch(`/api/integrations?slug=${slug}`);
      if (integrationRes.ok) {
        const data = await integrationRes.json();
        const foundIntegration = data.integrations?.find((i: any) => i.slug === slug);
        if (foundIntegration) {
          setIntegration(foundIntegration);
          
          // Parse authConfig if it's a string
          if (typeof foundIntegration.authConfig === 'string') {
            try {
              foundIntegration.authConfig = JSON.parse(foundIntegration.authConfig);
            } catch (e) {
              console.error('Failed to parse authConfig:', e);
            }
          }
        }
      }
      
      // Fetch settings (if they exist)
      try {
        const settingsRes = await fetch(`/api/integrations/${slug}/settings`);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.settings) {
            setSettings(data.settings);
            setCredentialMode(data.settings.credentialMode || 'platform');
            setClientId(data.settings.customClientId || '');
            setSelectedScopes(data.settings.customScopes || []);
          }
        }
      } catch (err) {
        // Settings might not exist yet, that's okay
        console.log('No existing settings found');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load integration data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/integrations/${slug}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialMode,
          customClientId: credentialMode === 'custom' ? clientId : null,
          customClientSecret: credentialMode === 'custom' ? clientSecret : null,
          customScopes: credentialMode === 'custom' ? selectedScopes : [],
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTestResult({ success: true, message: 'Settings saved successfully!' });
        fetchData(); // Refresh
        setClientSecret(''); // Clear secret after saving
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };
  
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);
    
    try {
      const response = await fetch(`/api/integrations/${slug}/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialMode,
          customClientId: clientId,
          customClientSecret: clientSecret,
        }),
      });
      
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      console.error('Failed to test connection:', error);
      setTestResult({ success: false, error: 'Test failed' });
    } finally {
      setTesting(false);
    }
  };
  
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!integration) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Integration not found
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/connections/callback`;
  const defaultScopes = integration.authConfig?.scopes || [];
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {integration.logo && (
            <img 
              src={integration.logo} 
              alt={integration.name}
              className="w-12 h-12 rounded-lg object-contain"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{integration.name} Settings</h1>
            <p className="text-gray-600">Configure credentials and OAuth settings</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-2">
          <Settings2 className="h-3 w-3" />
          {integration.authType}
        </Badge>
      </div>
      
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Credential Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Credentials</CardTitle>
          <CardDescription>
            Choose how you want to authenticate with {integration.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platform Credentials Option */}
          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
              credentialMode === 'platform' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setCredentialMode('platform')}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                checked={credentialMode === 'platform'}
                onChange={() => setCredentialMode('platform')}
                className="mt-1"
              />
              <div className="flex-1">
                <Label className="text-base font-semibold cursor-pointer">
                  Use our credentials
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Quick start for testing. Your OAuth screen will show our platform name.
                  Best for development and testing.
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">✓ Quick Setup</Badge>
                  <Badge variant="secondary">✓ No Configuration</Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* Custom Credentials Option */}
          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
              credentialMode === 'custom' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setCredentialMode('custom')}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                checked={credentialMode === 'custom'}
                onChange={() => setCredentialMode('custom')}
                className="mt-1"
              />
              <div className="flex-1">
                <Label className="text-base font-semibold cursor-pointer">
                  Use your own credentials
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Production-ready with your branding. OAuth screen shows your app name.
                  Recommended for production deployments.
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">✓ Custom Branding</Badge>
                  <Badge variant="secondary">✓ Dedicated Rate Limits</Badge>
                  <Badge variant="secondary">✓ Production Ready</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Custom Credentials Form */}
      {credentialMode === 'custom' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Client Credentials</CardTitle>
              <CardDescription>
                Enter your OAuth application credentials from {integration.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client ID */}
              <div>
                <Label htmlFor="clientId">Client ID *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="clientId"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Enter your Client ID"
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(clientId, 'clientId')}
                    disabled={!clientId}
                  >
                    {copied === 'clientId' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {/* Client Secret */}
              <div>
                <Label htmlFor="clientSecret">Client Secret *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="clientSecret"
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder={settings?.customClientSecret ? '••••••••••••' : 'Enter your Client Secret'}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(clientSecret, 'clientSecret')}
                    disabled={!clientSecret}
                  >
                    {copied === 'clientSecret' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {settings?.customClientSecret && !clientSecret && (
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to keep existing secret
                  </p>
                )}
              </div>
              
              {/* Callback URL */}
              <div>
                <Label htmlFor="callbackUrl">Callback URL (Redirect URI)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="callbackUrl"
                    value={callbackUrl}
                    readOnly
                    className="bg-gray-50 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(callbackUrl, 'callbackUrl')}
                  >
                    {copied === 'callbackUrl' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use this URL when creating your OAuth app on {integration.name}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Scopes */}
          {defaultScopes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>OAuth Scopes</CardTitle>
                <CardDescription>
                  Select the permissions your app needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {defaultScopes.map((scope: string) => (
                    <div key={scope} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={scope}
                        checked={selectedScopes.includes(scope)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedScopes([...selectedScopes, scope]);
                          } else {
                            setSelectedScopes(selectedScopes.filter(s => s !== scope));
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={scope} className="font-mono text-sm cursor-pointer">
                        {scope}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedScopes.length === 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    ⚠️ No scopes selected. Default scopes will be used.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
              <CardDescription>
                How to create an OAuth app on {integration.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-blue-900 mb-2">📝 Quick Setup Guide:</p>
                <ol className="list-decimal list-inside space-y-2 text-blue-800">
                  <li>Go to {integration.name} Developer Portal</li>
                  <li>Create a new OAuth application</li>
                  <li>Copy the <strong>Callback URL</strong> above and paste it in your OAuth app settings</li>
                  <li>Copy your <strong>Client ID</strong> and <strong>Client Secret</strong></li>
                  <li>Paste them in the form above</li>
                  <li>Select the required scopes</li>
                  <li>Click <strong>Test Connection</strong> to verify</li>
                  <li>Click <strong>Save Settings</strong></li>
                </ol>
              </div>
              
              {integration.website && (
                <a 
                  href={integration.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  View {integration.name} Documentation →
                </a>
              )}
            </CardContent>
          </Card>
        </>
      )}
      
      {/* Test Result */}
      {testResult && (
        <Alert variant={testResult.success ? 'default' : 'destructive'}>
          {testResult.success ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {testResult.success 
              ? (testResult.message || 'Connection test successful!') 
              : `Test failed: ${testResult.error || 'Unknown error'}`}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Actions */}
      <div className="flex gap-2 justify-end border-t pt-4">
        {credentialMode === 'custom' && (
          <Button 
            onClick={handleTest} 
            disabled={testing || !clientId || (!clientSecret && !settings?.customClientSecret)} 
            variant="outline"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
        )}
        <Button 
          onClick={handleSave} 
          disabled={saving || (credentialMode === 'custom' && !clientId)}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
      
      {/* Status */}
      {settings && (
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-600">Current Mode:</span>
                <Badge className="ml-2" variant={settings.credentialMode === 'custom' ? 'default' : 'secondary'}>
                  {settings.credentialMode === 'custom' ? 'Custom Credentials' : 'Platform Credentials'}
                </Badge>
              </div>
              {settings.lastTestedAt && (
                <div className="text-gray-600">
                  Last tested: {new Date(settings.lastTestedAt).toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

