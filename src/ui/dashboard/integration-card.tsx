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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-4xl">{icon}</span>
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                v{integration.version}
              </p>
            </div>
          </div>
          <Badge variant={integration.status === 'active' ? 'default' : 'secondary'}>
            {integration.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 line-clamp-2">
          {integration.description || 'No description available'}
        </p>

        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-500">Actions:</span>{' '}
            <span className="font-medium">{integration.actions?.length || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Triggers:</span>{' '}
            <span className="font-medium">{integration.triggers?.length || 0}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">
              {connections} connection{connections !== 1 ? 's' : ''}
            </span>
          </div>
          <Link href={`/dashboard/integrations/${integration.slug}`}>
            <Button className="w-full">
              Configure
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

