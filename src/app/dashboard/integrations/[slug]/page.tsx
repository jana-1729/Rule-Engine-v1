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
  });

  if (!integration) {
    notFound();
  }

  // Parse actions and triggers from JSON
  const actions = integration.actions ? 
    (typeof integration.actions === 'string' ? JSON.parse(integration.actions) : integration.actions) : 
    {};
  const triggers = integration.triggers ? 
    (typeof integration.triggers === 'string' ? JSON.parse(integration.triggers) : integration.triggers) : 
    {};

  // Convert actions object to array
  const actionsArray = Object.entries(actions).map(([key, value]: [string, any]) => ({
    id: value.id || key,
    name: value.name || key,
    description: value.description || '',
    slug: key,
  }));

  // Convert triggers object to array
  const triggersArray = Object.entries(triggers).map(([key, value]: [string, any]) => ({
    id: value.id || key,
    name: value.name || key,
    description: value.description || '',
    slug: key,
  }));

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
    orderBy: { createdAt: 'desc' },
  });

  // Fetch recent executions
  const executions = await prisma.execution.findMany({
    where: {
      integrationId: integration.id,
      app: {
        accountId: session.accountId,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      app: true,
      endUser: true,
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden shadow-md">
            {integration.logo ? (
              <img 
                src={integration.logo} 
                alt={integration.name}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <span className="text-4xl">🔌</span>
            )}
          </div>
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
              {actionsArray.length}
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
              {triggersArray.length}
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
            {actionsArray.map((action) => (
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
            {actionsArray.length === 0 && (
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
                    Connected {new Date(conn.createdAt).toLocaleDateString()}
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
                      {execution.app.name} • {new Date(execution.createdAt).toLocaleString()}
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

