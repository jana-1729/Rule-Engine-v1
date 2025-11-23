"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';

interface IntegrationCardProps {
  integration: any;
  connections: number;
}

const integrationIcons: Record<string, string> = {
  slack: '💬',
  notion: '📝',
  'google-sheets': '📊',
  hubspot: '🎯',
  salesforce: '☁️',
  default: '🔌',
};

export function IntegrationCard({ integration, connections }: IntegrationCardProps) {
  const icon = integrationIcons[integration.slug] || integrationIcons.default;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-2xl">{icon}</span>
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{integration.name}</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                v{integration.version}
              </p>
            </div>
          </div>
          <Badge 
            variant={integration.status === 'active' ? 'default' : 'secondary'}
            className="capitalize"
          >
            {integration.status}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-4 min-h-[2.5rem]">
          {integration.description || 'No description available'}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{integration.actions?.length || 0}</div>
            <div className="text-xs text-gray-600 mt-1">Actions</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{integration.triggers?.length || 0}</div>
            <div className="text-xs text-gray-600 mt-1">Triggers</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {connections} connection{connections !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <Link href={`/dashboard/integrations/${integration.slug}`}>
          <Button className="w-full group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600">
            Configure
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

