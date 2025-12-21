import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import Link from 'next/link';
import { Badge } from '@/ui/components/badge';

export default async function WorkflowsPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Fetch workflows from database
  const workflows = await prisma.workflow.findMany({
    where: {
      app: {
        accountId: session.accountId,
      },
    },
    include: {
      integration: true,
      app: true,
      _count: {
        select: {
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
          <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600 mt-2">
            Build and manage your automation workflows
          </p>
        </div>
        <Link href="/dashboard/workflows/new">
          <Button>+ Create Workflow</Button>
        </Link>
      </div>

      {workflows.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No workflows yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first workflow to automate your integrations
              </p>
              <Link href="/dashboard/workflows/new">
                <Button>Create Your First Workflow</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle>{workflow.name}</CardTitle>
                      <Badge variant={workflow.enabled ? 'default' : 'secondary'}>
                        {workflow.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {workflow.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        {workflow.integration.logo && (
                          <img 
                            src={workflow.integration.logo} 
                            alt={workflow.integration.name}
                            className="w-4 h-4 object-contain"
                          />
                        )}
                        <span className="text-xs text-gray-500">
                          Integration: <span className="font-medium text-gray-700">{workflow.integration.name}</span>
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        App: <span className="font-medium text-gray-700">{workflow.app.name}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-sm">
                      <span className="text-gray-600">Executions:</span>{' '}
                      <span className="font-semibold text-gray-900">{workflow._count.executions}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Created: {new Date(workflow.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Link href={`/dashboard/workflows/${workflow.id}`}>
                    <Button variant="outline">View & Edit</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

