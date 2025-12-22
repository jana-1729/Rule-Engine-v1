'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SwaggerUIPage() {
  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load swagger spec
    fetch('/api/swagger.json')
      .then((res) => res.json())
      .then((data) => {
        setSpec(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load API spec:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">API Documentation</h1>
              <p className="text-blue-100 text-lg">
                Interactive API reference with live testing
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              Dashboard →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="border-b bg-gray-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-6 text-sm">
            <a href="#authentication" className="text-blue-600 hover:text-blue-800 font-medium">
              Authentication
            </a>
            <a href="#endpoints" className="text-blue-600 hover:text-blue-800 font-medium">
              Endpoints
            </a>
            <Link href="/dashboard/docs/sdk" className="text-blue-600 hover:text-blue-800 font-medium">
              SDKs
            </Link>
            <Link href="/dashboard/docs/guides" className="text-blue-600 hover:text-blue-800 font-medium">
              Guides
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading API documentation...</p>
            </div>
          </div>
        ) : spec ? (
          <div className="space-y-8">
            {/* API Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{spec.info?.title || 'API'}</h2>
              <p className="text-gray-600 mb-4">{spec.info?.description || 'API Documentation'}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                  Version {spec.info?.version || '1.0.0'}
                </span>
                <span className="text-gray-600">Base URL: {spec.servers?.[0]?.url || '/api'}</span>
              </div>
            </div>

            {/* Authentication */}
            <div id="authentication" className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Authentication</h3>
              <p className="text-gray-600 mb-4">
                All API requests require authentication using an API key in the Authorization header:
              </p>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm">
                <pre>Authorization: Bearer YOUR_API_KEY</pre>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Get your API key from the <Link href="/dashboard/apps" className="text-blue-600 hover:underline">Apps</Link> section in your dashboard.
              </p>
            </div>

            {/* Endpoints */}
            <div id="endpoints" className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">API Endpoints</h3>
              
              {spec.paths && Object.entries(spec.paths).map(([path, methods]: [string, any]) => (
                <div key={path} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {Object.entries(methods).map(([method, details]: [string, any]) => {
                    if (method.startsWith('x-')) return null;
                    
                    const methodColors: Record<string, string> = {
                      get: 'bg-green-100 text-green-700',
                      post: 'bg-blue-100 text-blue-700',
                      put: 'bg-orange-100 text-orange-700',
                      delete: 'bg-red-100 text-red-700',
                      patch: 'bg-purple-100 text-purple-700',
                    };

                    return (
                      <div key={method} className="p-6 border-b last:border-b-0">
                        <div className="flex items-start gap-4 mb-4">
                          <span className={`px-3 py-1 rounded font-mono text-xs font-bold uppercase ${methodColors[method] || 'bg-gray-100 text-gray-700'}`}>
                            {method}
                          </span>
                          <div className="flex-1">
                            <code className="text-gray-900 font-mono text-sm">{path}</code>
                            <p className="text-gray-600 mt-2">{details.summary || details.description || 'No description'}</p>
                          </div>
                        </div>

                        {details.parameters && details.parameters.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-sm text-gray-900 mb-2">Parameters:</h4>
                            <div className="space-y-2">
                              {details.parameters.map((param: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 text-sm">
                                  <code className="px-2 py-1 bg-gray-100 rounded text-xs">{param.name}</code>
                                  <span className="text-gray-600">{param.description || 'No description'}</span>
                                  {param.required && <span className="text-red-600 text-xs">*required</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {details.responses && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-sm text-gray-900 mb-2">Responses:</h4>
                            <div className="space-y-2">
                              {Object.entries(details.responses).map(([code, response]: [string, any]) => (
                                <div key={code} className="flex items-start gap-2 text-sm">
                                  <span className={`px-2 py-1 rounded text-xs font-mono ${code.startsWith('2') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {code}
                                  </span>
                                  <span className="text-gray-600">{response.description || 'No description'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-600 mb-4">Failed to load API documentation</p>
            <Link href="/dashboard/docs/api" className="text-blue-600 hover:underline">
              View alternative documentation →
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-gray-50 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p className="mb-2">
            Need help? Check out our{' '}
            <Link href="/dashboard/docs/guides" className="text-blue-600 hover:text-blue-800">
              guides
            </Link>{' '}
            or{' '}
            <Link href="/dashboard/docs/sdk" className="text-blue-600 hover:text-blue-800">
              SDK documentation
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

