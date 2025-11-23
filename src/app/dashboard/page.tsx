import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Fetch stats
  const [apps, executions, integrations, recentExecutions] = await Promise.all([
    prisma.app.count({ where: { accountId: session.accountId } }),
    prisma.execution.count({ where: { accountId: session.accountId } }),
    prisma.app.findMany({
      where: { accountId: session.accountId },
      include: {
        _count: {
          select: { endUserConnections: true },
        },
      },
    }),
    prisma.execution.findMany({
      where: { accountId: session.accountId },
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: {
        integration: true,
        app: true,
      },
    }),
  ]);

  const totalConnections = integrations.reduce(
    (sum, app) => sum + app._count.endUserConnections,
    0
  );

  const successRate = executions > 0
    ? await prisma.execution
        .count({
          where: {
            accountId: session.accountId,
            status: 'success',
          },
        })
        .then((count) => Math.round((count / executions) * 100))
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of your integration platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Apps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{apps}</div>
            <p className="text-xs text-gray-500 mt-1">Active applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {executions.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total API calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Connected Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalConnections}</div>
            <p className="text-xs text-gray-500 mt-1">End user connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{successRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Execution success</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentExecutions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No executions yet. Start by connecting an integration!
            </div>
          ) : (
            <div className="space-y-3">
              {recentExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {execution.integration?.slug === 'slack' ? '💬' : '🔌'}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {execution.integration?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {execution.action} • {execution.app?.name}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      {new Date(execution.startedAt).toLocaleString()}
                    </div>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

