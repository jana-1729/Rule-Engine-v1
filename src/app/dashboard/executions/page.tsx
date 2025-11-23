import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { ExecutionFilters } from '@/ui/dashboard/execution-filters';

export default async function ExecutionsPage({
  searchParams,
}: {
  searchParams: { status?: string; integration?: string; app?: string };
}) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Build filters
  const where: any = {
    accountId: session.accountId,
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

  // Fetch executions
  const [executions, integrations, apps] = await Promise.all([
    prisma.execution.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: 100,
      include: {
        integration: true,
        app: true,
        endUser: true,
      },
    }),
    prisma.integration.findMany({
      where: { status: 'active' },
      select: { id: true, name: true, slug: true },
    }),
    prisma.app.findMany({
      where: { accountId: session.accountId },
      select: { id: true, name: true, appId: true },
    }),
  ]);

  // Calculate stats
  const stats = {
    total: await prisma.execution.count({ where: { accountId: session.accountId } }),
    success: await prisma.execution.count({
      where: { accountId: session.accountId, status: 'success' },
    }),
    failure: await prisma.execution.count({
      where: { accountId: session.accountId, status: 'failure' },
    }),
    pending: await prisma.execution.count({
      where: { accountId: session.accountId, status: 'pending' },
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
        <CardHeader>
          <CardTitle>Execution Logs</CardTitle>
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
                        <span className="text-2xl">
                          {execution.integration?.slug === 'slack' ? '💬' : '🔌'}
                        </span>
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
                        {new Date(execution.startedAt).toLocaleString()}
                        {execution.completedAt && (
                          <span className="ml-2">
                            • Duration: {
                              Math.round(
                                (new Date(execution.completedAt).getTime() -
                                  new Date(execution.startedAt).getTime()) / 1000
                              )
                            }s
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {execution.retryCount > 0 && (
                        <span className="text-xs text-gray-500">
                          Retries: {execution.retryCount}
                        </span>
                      )}
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
                  {execution.errorMessage && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      <strong>Error:</strong> {execution.errorMessage}
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

