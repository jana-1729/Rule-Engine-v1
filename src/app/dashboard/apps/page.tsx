import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import Link from 'next/link';

export default async function AppsPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Fetch apps for this account
  const apps = await prisma.apps.findMany({
    where: { accountId: session.accountId },
    include: {
      _count: {
        select: {
          end_user_connections: true,
          executions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Apps</h1>
          <p className="text-gray-600 mt-2">
            Manage your API applications and credentials
          </p>
        </div>
        <Link href="/dashboard/apps/new">
          <Button>+ Create App</Button>
        </Link>
      </div>

      {/* Apps List */}
      <div className="grid grid-cols-1 gap-6">
        {apps.map((app) => (
          <Card key={app.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{app.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    App ID: <code className="px-2 py-1 bg-gray-100 rounded text-xs">{app.appId}</code>
                  </p>
                </div>
                <Badge variant={app.status === 'active' ? 'default' : 'secondary'}>
                  {app.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {app._count.end_user_connections}
                  </div>
                  <div className="text-sm text-gray-600">Connections</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {app._count.executions}
                  </div>
                  <div className="text-sm text-gray-600">Executions</div>
                </div>
              </div>

              {/* API Key Preview */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700">API Key</div>
                    <Link href={`/dashboard/apps/${app.id}`}>
                      <Button variant="outline" size="sm">View & Manage</Button>
                    </Link>
                  </div>
                  <code className="block px-3 py-2 bg-gray-100 rounded text-xs font-mono text-gray-600">
                    app_••••••••••••••••••••••••••••••••
                  </code>
                  <div className="text-xs text-gray-500">
                    Click "View & Manage" to see full details and regenerate
                  </div>
                </div>
              </div>

              {/* Created */}
              <div className="text-xs text-gray-500">
                Created {new Date(app.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {apps.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No apps yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first app to get started with the API
              </p>
              <Link href="/dashboard/apps/new">
                <Button>Create Your First App</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

