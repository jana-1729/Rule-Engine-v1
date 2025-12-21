import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import Link from 'next/link';
import { BookOpen, Code, ExternalLink, Copy } from 'lucide-react';

export default function ApiDocsPage() {
  const endpoints = [
    {
      method: 'GET',
      path: '/api/public/v1/integrations',
      description: 'List all available integrations',
      auth: true,
    },
    {
      method: 'POST',
      path: '/api/public/v1/connections/connect',
      description: 'Initiate OAuth connection for an end-user',
      auth: true,
    },
    {
      method: 'GET',
      path: '/api/public/v1/connections/list',
      description: 'List connections for an end-user',
      auth: true,
    },
    {
      method: 'DELETE',
      path: '/api/public/v1/connections/disconnect',
      description: 'Disconnect an end-user connection',
      auth: true,
    },
    {
      method: 'POST',
      path: '/api/public/v1/workflows/execute',
      description: 'Execute a workflow for an end-user',
      auth: true,
    },
    {
      method: 'GET',
      path: '/api/public/v1/workflows/list',
      description: 'List available workflows',
      auth: true,
    },
    {
      method: 'GET',
      path: '/api/public/v1/executions/logs',
      description: 'Get execution logs',
      auth: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
        <p className="text-gray-600 mt-2">
          Complete reference for the Integration Platform API
        </p>
      </div>

      {/* Quick Start */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <CardTitle>Quick Start</CardTitle>
          </div>
          <CardDescription>Get started with the API in minutes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">1. Get your API Key</h3>
            <p className="text-sm text-gray-700">
              Create an app in the <Link href="/dashboard/apps" className="text-blue-600 hover:underline">Apps</Link> section to get your API key.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">2. Make your first request</h3>
            <div className="bg-gray-900 rounded-lg p-4 mt-2">
              <code className="text-sm text-green-400">
                curl https://your-domain.com/api/public/v1/integrations \<br />
                &nbsp;&nbsp;-H "x-api-key: YOUR_API_KEY"
              </code>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">3. Explore the endpoints</h3>
            <p className="text-sm text-gray-700">
              Browse the endpoints below to see what's available.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>How to authenticate your API requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            All API requests must include your API key in the <code className="px-2 py-0.5 bg-gray-100 rounded text-xs">x-api-key</code> header.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600 uppercase">Example</span>
            </div>
            <code className="text-sm text-gray-800">
              x-api-key: app_1234567890abcdef
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>All available public API endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={endpoint.method === 'GET' ? 'default' : endpoint.method === 'POST' ? 'default' : 'destructive'}
                      className={
                        endpoint.method === 'GET'
                          ? 'bg-green-100 text-green-700'
                          : endpoint.method === 'POST'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }
                    >
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono text-gray-900">{endpoint.path}</code>
                  </div>
                  {endpoint.auth && (
                    <Badge variant="outline" className="text-xs">
                      🔒 Auth Required
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{endpoint.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interactive API Explorer */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
              <Code className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Interactive API Explorer
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                Try out the API directly in your browser with our interactive Swagger documentation.
              </p>
              <Link href="/api/docs" target="_blank">
                <Button className="gap-2">
                  Open Swagger Docs
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limits</CardTitle>
          <CardDescription>API usage limits and best practices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">1,000</div>
              <div className="text-sm text-gray-600">Requests per hour</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">10,000</div>
              <div className="text-sm text-gray-600">Requests per day</div>
            </div>
          </div>
          <p className="text-sm text-gray-700">
            If you need higher limits, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

