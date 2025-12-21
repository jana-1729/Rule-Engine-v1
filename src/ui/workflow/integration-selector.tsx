"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { Check } from 'lucide-react';

interface Integration {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  logo?: string;
}

interface IntegrationSelectorProps {
  integrations: Integration[];
  selectedIntegration: string;
  onSelect: (slug: string) => void;
  error?: string;
}

const categoryColors: Record<string, string> = {
  communication: 'bg-blue-100 text-blue-800',
  productivity: 'bg-purple-100 text-purple-800',
  database: 'bg-green-100 text-green-800',
  crm: 'bg-orange-100 text-orange-800',
  analytics: 'bg-pink-100 text-pink-800',
  marketing: 'bg-yellow-100 text-yellow-800',
};

export function IntegrationSelector({
  integrations,
  selectedIntegration,
  onSelect,
  error,
}: IntegrationSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Integration *</CardTitle>
        <CardDescription>
          Choose which integration this workflow will use
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((integration) => {
            const isSelected = selectedIntegration === integration.slug;
            
            return (
              <button
                key={integration.id}
                onClick={() => onSelect(integration.slug)}
                className={`relative p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {(integration.logo || integration.icon) ? (
                      <img 
                        src={integration.logo || integration.icon} 
                        alt={integration.name}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-2xl">🔌</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 mb-1">
                      {integration.name}
                    </div>
                    <div className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {integration.description}
                    </div>
                    <Badge 
                      variant="secondary"
                      className={categoryColors[integration.category] || 'bg-gray-100 text-gray-800'}
                    >
                      {integration.category}
                    </Badge>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        {integrations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No integrations available. Please contact support.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

