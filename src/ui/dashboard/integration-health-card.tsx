'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';

interface IntegrationHealthProps {
  integration: {
    name: string;
    slug: string;
    status: 'healthy' | 'degraded' | 'down';
    executions24h: number;
    successRate: number;
    avgResponseTime: number;
    lastError?: {
      message: string;
      timestamp: string;
    };
  };
}

export function IntegrationHealthCard({ integration }: IntegrationHealthProps) {
  const statusColors = {
    healthy: 'bg-green-100 text-green-800 border-green-200',
    degraded: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    down: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusIcons = {
    healthy: '✓',
    degraded: '⚠',
    down: '✕',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{integration.name}</CardTitle>
          <Badge className={statusColors[integration.status]}>
            {statusIcons[integration.status]} {integration.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-500 text-xs mb-1">24h Executions</div>
            <div className="font-semibold text-lg">{integration.executions24h.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs mb-1">Success Rate</div>
            <div className={`font-semibold text-lg ${
              integration.successRate >= 95 ? 'text-green-600' :
              integration.successRate >= 80 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {integration.successRate.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-xs mb-1">Avg Response</div>
            <div className="font-semibold text-lg">{integration.avgResponseTime}ms</div>
          </div>
        </div>

        {integration.lastError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-xs text-red-600 font-medium mb-1">Last Error</div>
            <div className="text-xs text-red-700">{integration.lastError.message}</div>
            <div className="text-xs text-red-500 mt-1">
              {new Date(integration.lastError.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            View Details →
          </button>
          <button className="text-xs text-gray-600 hover:text-gray-800 font-medium">
            Test Connection
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

