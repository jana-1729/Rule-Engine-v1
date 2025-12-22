import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { IntegrationHealthCard } from '@/ui/dashboard/integration-health-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Activity, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

async function getIntegrationHealth(accountId: string) {
  const integrations = await prisma.integration.findMany({
    where: {
      status: 'available', // Only show available integrations
    },
    include: {
      _count: {
        select: {
          executions: true,
        },
      },
    },
  });

  const healthData = await Promise.all(
    integrations.map(async (integration) => {
      const last24h = await prisma.execution.count({
        where: {
          integrationId: integration.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          app: {
            accountId,
          },
        },
      });

      const failures = await prisma.execution.count({
        where: {
          integrationId: integration.id,
          status: 'failure',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          app: {
            accountId,
          },
        },
      });

      const successRate = last24h > 0 ? ((last24h - failures) / last24h) * 100 : 100;
      const errorRate = last24h > 0 ? failures / last24h : 0;

      return {
        integration: integration.name,
        slug: integration.slug,
        executions24h: last24h,
        successRate,
        errorCount: failures,
        status: errorRate > 0.1 ? 'degraded' : errorRate > 0.3 ? 'down' : 'healthy',
      };
    })
  );

  return healthData;
}

async function getOverallStats(accountId: string) {
  const totalExecutions = await prisma.execution.count({
    where: {
      app: {
        accountId,
      },
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  const successfulExecutions = await prisma.execution.count({
    where: {
      app: {
        accountId,
      },
      status: 'success',
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  const failedExecutions = await prisma.execution.count({
    where: {
      app: {
        accountId,
      },
      status: 'failure',
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  const activeIntegrations = await prisma.integration.count({
    where: {
      status: 'available',
    },
  });

  return {
    totalExecutions,
    successfulExecutions,
    failedExecutions,
    activeIntegrations,
    overallSuccessRate:
      totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 100,
  };
}

export default async function IntegrationHealthPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const healthData = await getIntegrationHealth(session.accountId);
  const stats = await getOverallStats(session.accountId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integration Health</h1>
        <p className="text-gray-600 mt-2">
          Monitor the health and performance of your integrations
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExecutions.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.overallSuccessRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.successfulExecutions.toLocaleString()} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Executions</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.failedExecutions.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 mt-1">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
            <CheckCircle className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeIntegrations}</div>
            <p className="text-xs text-gray-600 mt-1">Currently enabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Health Cards */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Integration Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthData.map((data) => (
            <IntegrationHealthCard key={data.slug} data={data as any} />
          ))}
        </div>
      </div>

      {healthData.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No integration data available yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Execute some workflows to see health metrics
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

