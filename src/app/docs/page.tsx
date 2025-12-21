'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import Link from 'next/link';

export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">API Documentation</h1>
          <p className="text-blue-100 text-lg">
            Complete reference for the Integration Platform API
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="border-b bg-gray-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-6 text-sm">
            <Link href="/dashboard/docs/api" className="text-blue-600 hover:text-blue-800 font-medium">
              API Reference
            </Link>
            <Link href="/dashboard/docs/sdk" className="text-blue-600 hover:text-blue-800 font-medium">
              SDKs
            </Link>
            <Link href="/dashboard/docs/guides" className="text-blue-600 hover:text-blue-800 font-medium">
              Guides
            </Link>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to the API Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Our API allows you to programmatically manage integrations, workflows, and user connections.
                Choose from the options below to get started.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Link href="/dashboard/docs/api">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">📚</div>
                      <h3 className="font-semibold mb-2">API Reference</h3>
                      <p className="text-sm text-gray-600">
                        Complete endpoint documentation
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/dashboard/docs/sdk">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">💻</div>
                      <h3 className="font-semibold mb-2">SDK Documentation</h3>
                      <p className="text-sm text-gray-600">
                        Client libraries and examples
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/dashboard/docs/guides">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">🚀</div>
                      <h3 className="font-semibold mb-2">Integration Guides</h3>
                      <p className="text-sm text-gray-600">
                        Step-by-step tutorials
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3 text-gray-700">
                <li>
                  <strong>Create an App:</strong> Go to the{' '}
                  <Link href="/dashboard/apps" className="text-blue-600 hover:underline">
                    Apps
                  </Link>{' '}
                  section and create a new application to get your API key.
                </li>
                <li>
                  <strong>Authenticate:</strong> Include your API key in the{' '}
                  <code className="px-1 py-0.5 bg-gray-100 rounded">X-API-Key</code> header.
                </li>
                <li>
                  <strong>Make Requests:</strong> Use our REST API to manage integrations and workflows.
                </li>
              </ol>

              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm mt-4">
                <pre>
                  curl -X GET \<br />
                  {'  '}https://your-platform.com/api/public/v1/integrations \<br />
                  {'  '}-H "X-API-Key: YOUR_API_KEY"
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-gray-50 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p className="mb-2">
            Need help? Contact us at{' '}
            <a href="mailto:support@yourplatform.com" className="text-blue-600 hover:text-blue-800">
              support@yourplatform.com
            </a>
          </p>
          <p className="text-sm">
            © 2025 Integration Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
