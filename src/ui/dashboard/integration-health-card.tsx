'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { Activity, AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface IntegrationHealthData {
  integration: string;
  slug: string;
  executions24h: number;
  successRate: number;
  status: 'healthy' | 'degraded' | 'down';
  avgResponseTime?: number;
  errorCount?: number;
}

interface IntegrationHealthCardProps {
  data: IntegrationHealthData;
}

export function IntegrationHealthCard({ data }: IntegrationHealthCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'down':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'down':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{data.integration}</CardTitle>
        <div className="flex items-center gap-2">
          {getStatusIcon(data.status)}
          <Badge className={getStatusColor(data.status)}>
            {data.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Executions (24h)</p>
            <p className="text-2xl font-bold">{data.executions24h.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Success Rate</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{data.successRate.toFixed(1)}%</p>
              {data.successRate >= 95 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
          </div>
          {data.avgResponseTime && (
            <div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-lg font-semibold">{data.avgResponseTime}ms</p>
            </div>
          )}
          {data.errorCount !== undefined && (
            <div>
              <p className="text-sm text-gray-600">Errors (24h)</p>
              <p className="text-lg font-semibold text-red-600">{data.errorCount}</p>
            </div>
          )}
        </div>
        
        {/* Success Rate Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                data.successRate >= 95
                  ? 'bg-green-600'
                  : data.successRate >= 80
                  ? 'bg-yellow-600'
                  : 'bg-red-600'
              }`}
              style={{ width: `${data.successRate}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

