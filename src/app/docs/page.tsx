'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function APIDocsPage() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch('/api/docs')
      .then((res) => res.json())
      .then((data) => setSpec(data))
      .catch((err) => console.error('Failed to load API spec:', err));
  }, []);

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
            <a href="#getting-started" className="text-blue-600 hover:text-blue-800 font-medium">
              Getting Started
            </a>
            <a href="#authentication" className="text-blue-600 hover:text-blue-800 font-medium">
              Authentication
            </a>
            <a href="#endpoints" className="text-blue-600 hover:text-blue-800 font-medium">
              API Endpoints
            </a>
            <a href="/docs/sdk" className="text-blue-600 hover:text-blue-800 font-medium">
              SDKs
            </a>
            <a href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
              Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="container mx-auto px-4 py-8">
        {spec ? (
          <SwaggerUI 
            spec={spec} 
            docExpansion="list"
            defaultModelsExpandDepth={1}
            displayRequestDuration={true}
          />
        ) : (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading API documentation...</p>
            </div>
          </div>
        )}
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

