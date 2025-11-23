import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import Link from 'next/link';

export default async function IntegrationDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch integration details
  const integration = await prisma.integration.findUnique({
    where: { slug: params.slug },
    include: {
      authMethods: true,
      actions: {
        where: { status: 'active' },
        include: { schemas: true },
      },
      triggers: {
        where: { status: 'active' },
      },
    },
  });

  if (!integration) {
    notFound();
  }

  // Fetch connections for this integration across all apps
  const connections = await prisma.endUserConnection.findMany({
    where: {
      integrationId: integration.id,
      app: {
        accountId: session.accountId,
      },
    },
    include: {
      app: true,
      endUser: true,
    },
    orderBy: { connectedAt: 'desc' },
  });

  // Fetch recent executions
  const executions = await prisma.execution.findMany({
    where: {
      integrationId: integration.id,
      accountId: session.accountId,
    },
    orderBy: { startedAt: 'desc' },
    take: 10,
    include: {
      app: true,
    },
  });

  const integrationIcons: Record<string, string> = {
    slack: '💬',
    notion: '📝',
    'google-sheets': '📊',
    default: '🔌',
  };

  const icon = integrationIcons[integration.slug] || integrationIcons.default;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-6xl">{icon}</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{integration.name}</h1>
            <p className="text-gray-600 mt-1">{integration.description}</p>
            <div className="flex items-center space-x-3 mt-2">
              <Badge variant="default">v{integration.version}</Badge>
              <Badge variant={integration.status === 'active' ? 'default' : 'secondary'}>
                {integration.status}
              </Badge>
            </div>
          </div>
        </div>
        <Link href="/dashboard/integrations">
          <Button variant="outline">← Back</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{connections.length}</div>
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
              {executions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {integration.actions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Triggers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {integration.triggers.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Available Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {integration.actions.map((action) => (
              <div
                key={action.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{action.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline">action.{action.slug}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {integration.actions.length === 0 && (
              <p className="text-center py-8 text-gray-500">No actions available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connections */}
      <Card>
        <CardHeader>
          <CardTitle>Active Connections</CardTitle>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No connections yet. Use the API to connect end users.
            </p>
          ) : (
            <div className="space-y-3">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {conn.endUser?.externalId || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-600">
                      App: {conn.app.name}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Connected {new Date(conn.connectedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No executions yet</p>
          ) : (
            <div className="space-y-3">
              {executions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">{execution.action}</div>
                    <div className="text-sm text-gray-600">
                      {execution.app.name} • {new Date(execution.startedAt).toLocaleString()}
                    </div>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

