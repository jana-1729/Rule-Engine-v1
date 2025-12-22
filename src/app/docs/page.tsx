'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import 'swagger-ui-react/swagger-ui.css';

export default function SwaggerDocsPage() {
  const swaggerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically import SwaggerUI to avoid SSR issues
    import('swagger-ui-react').then((SwaggerUIModule) => {
      // @ts-ignore - SwaggerUI types are complex
      const SwaggerUI = SwaggerUIModule.default || SwaggerUIModule;
      
      // Only render on client side
      if (typeof window !== 'undefined' && swaggerContainerRef.current) {
        const React = require('react');
        const ReactDOM = require('react-dom/client');
        const root = ReactDOM.createRoot(swaggerContainerRef.current);
        
        root.render(
          React.createElement(SwaggerUI, {
            url: "/api/swagger.json",
            docExpansion: "list",
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
            displayRequestDuration: true,
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
            tryItOutEnabled: true,
            persistAuthorization: true,
            deepLinking: true,
          })
        );
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 border-b sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">API Documentation</h1>
              <p className="text-blue-100 text-sm">
                Interactive API reference with live testing capabilities
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/docs/sdk"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
              >
                SDK Docs
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info Banner */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className="text-gray-700">
                <strong>Base URL:</strong> <code className="px-2 py-1 bg-white rounded text-xs">/api/public/v1</code>
              </span>
              <span className="text-gray-700">
                <strong>Auth:</strong> Bearer Token
              </span>
            </div>
            <Link
              href="/dashboard/apps"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Get API Key →
            </Link>
          </div>
        </div>
      </div>

      {/* Swagger UI Container */}
      <div className="swagger-ui-wrapper">
        <div ref={swaggerContainerRef} />
      </div>

      {/* Custom styles for Swagger UI integration */}
      <style jsx global>{`
        .swagger-ui-wrapper {
          background: white;
        }
        
        .swagger-ui .topbar {
          display: none;
        }
        
        .swagger-ui .information-container {
          margin: 30px auto;
          max-width: 1200px;
          padding: 0 20px;
        }
        
        .swagger-ui .scheme-container {
          background: #f8f9fa;
          padding: 20px;
          margin: 20px auto;
          max-width: 1200px;
          border-radius: 8px;
          box-shadow: none;
        }
        
        .swagger-ui .wrapper {
          padding: 0;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .swagger-ui .opblock-tag {
          border-bottom: 1px solid #e5e7eb;
          margin: 0 20px;
        }
        
        .swagger-ui .opblock {
          margin: 0 20px 20px 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        
        .swagger-ui .btn.authorize {
          background-color: #2563eb;
          border-color: #2563eb;
        }
        
        .swagger-ui .btn.authorize:hover {
          background-color: #1d4ed8;
          border-color: #1d4ed8;
        }
        
        .swagger-ui .btn.execute {
          background-color: #059669;
          border-color: #059669;
        }
        
        .swagger-ui .btn.execute:hover {
          background-color: #047857;
          border-color: #047857;
        }
        
        .swagger-ui .opblock.opblock-get .opblock-summary-method {
          background: #10b981;
        }
        
        .swagger-ui .opblock.opblock-post .opblock-summary-method {
          background: #3b82f6;
        }
        
        .swagger-ui .opblock.opblock-put .opblock-summary-method {
          background: #f59e0b;
        }
        
        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
          background: #ef4444;
        }
        
        .swagger-ui .opblock.opblock-patch .opblock-summary-method {
          background: #8b5cf6;
        }
        
        /* Filter input styling */
        .swagger-ui .filter-container input {
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 8px 12px;
        }
        
        /* Response highlighting */
        .swagger-ui .responses-inner h4,
        .swagger-ui .responses-inner h5 {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }
        
        /* Code blocks */
        .swagger-ui .highlight-code {
          background: #1f2937;
          border-radius: 6px;
        }
        
        .swagger-ui .highlight-code .microlight {
          color: #e5e7eb;
        }
        
        /* Model box */
        .swagger-ui .model-box {
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        
        /* Try it out button */
        .swagger-ui .try-out__btn {
          background: #6366f1;
          border-color: #6366f1;
          color: white;
        }
        
        .swagger-ui .try-out__btn:hover {
          background: #4f46e5;
          border-color: #4f46e5;
        }
        
        /* Parameters table */
        .swagger-ui table thead tr th {
          color: #374151;
          font-weight: 600;
          font-size: 13px;
        }
        
        /* Add padding to bottom for better spacing */
        .swagger-ui-wrapper {
          padding-bottom: 60px;
        }
      `}</style>
    </div>
  );
}
