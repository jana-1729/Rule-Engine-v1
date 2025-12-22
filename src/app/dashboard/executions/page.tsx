import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { ExecutionFilters } from '@/ui/dashboard/execution-filters';
import { ExportButton } from '@/ui/dashboard/export-button';
import { Suspense } from 'react';

export default async function ExecutionsPage({
  searchParams,
}: {
  searchParams: { 
    status?: string; 
    integration?: string; 
    app?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  };
}) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Build filters
  const where: any = {
    app: {
      accountId: session.accountId,
    },
  };

  if (searchParams.status && searchParams.status !== 'all') {
    where.status = searchParams.status;
  }

  if (searchParams.integration) {
    where.integrationId = searchParams.integration;
  }

  if (searchParams.app) {
    where.appId = searchParams.app;
  }

  // Date range filter
  if (searchParams.dateFrom || searchParams.dateTo) {
    where.createdAt = {};
    if (searchParams.dateFrom) {
      where.createdAt.gte = new Date(searchParams.dateFrom);
    }
    if (searchParams.dateTo) {
      const dateTo = new Date(searchParams.dateTo);
      dateTo.setHours(23, 59, 59, 999); // End of day
      where.createdAt.lte = dateTo;
    }
  }

  // Search filter (search in action, requestId, or endUser externalId)
  if (searchParams.search) {
    where.OR = [
      { action: { contains: searchParams.search, mode: 'insensitive' } },
      { requestId: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  // Fetch executions
  const [executions, integrations, apps] = await Promise.all([
    prisma.execution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        integration: true,
        app: true,
        endUser: true,
      },
    }),
    prisma.integration.findMany({
      where: { status: 'available' },
      select: { id: true, name: true, slug: true },
    }),
    prisma.app.findMany({
      where: { accountId: session.accountId },
      select: { id: true, name: true, appId: true },
    }),
  ]);

  // Calculate stats
  const accountWhere = { app: { accountId: session.accountId } };
  const stats = {
    total: await prisma.execution.count({ where: accountWhere }),
    success: await prisma.execution.count({
      where: { ...accountWhere, status: 'success' },
    }),
    failure: await prisma.execution.count({
      where: { ...accountWhere, status: 'failure' },
    }),
    pending: await prisma.execution.count({
      where: { ...accountWhere, status: 'pending' },
    }),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Executions</h1>
        <p className="text-gray-600 mt-2">
          Monitor all API executions and logs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.total.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Successful
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.success.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.failure.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.pending.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <ExecutionFilters integrations={integrations} apps={apps} />

      {/* Executions List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Execution Logs</CardTitle>
          <ExportButton executions={executions} />
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No executions found</p>
              <p className="text-sm mt-2">
                Executions will appear here once you start using the API
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {executions.map((execution: any) => (
                <div
                  key={execution.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    // Open execution details modal
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {execution.integration?.logo ? (
                            <img 
                              src={execution.integration.logo} 
                              alt={execution.integration.name}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <span className="text-xl">🔌</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {execution.integration?.name || 'Unknown'} • {execution.action}
                          </div>
                          <div className="text-sm text-gray-600">
                            App: {execution.app?.name} • User: {execution.endUser?.externalId || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(execution.createdAt).toLocaleString()}
                        {execution.completedAt && (
                          <span className="ml-2">
                            • Duration: {
                              Math.round(
                                (new Date(execution.completedAt).getTime() -
                                  new Date(execution.createdAt).getTime()) / 1000
                              )
                            }s
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant={
                          execution.status === 'success'
                            ? 'default'
                            : execution.status === 'failure'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {execution.status}
                      </Badge>
                    </div>
                  </div>
                  {execution.error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      <strong>Error:</strong> {typeof execution.error === 'object' ? (execution.error as any).message || JSON.stringify(execution.error) : execution.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

