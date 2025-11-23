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

  // Fetch workflows (stored as JSON in database or separate table)
  // For now, we'll use a simple structure
  const workflows: any[] = []; // TODO: Add workflow table

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
                  <div>
                    <CardTitle>{workflow.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {workflow.description}
                    </p>
                  </div>
                  <Badge variant={workflow.enabled ? 'default' : 'secondary'}>
                    {workflow.enabled ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Last run: {workflow.lastRun ? new Date(workflow.lastRun).toLocaleString() : 'Never'}
                  </div>
                  <Link href={`/dashboard/workflows/${workflow.id}`}>
                    <Button variant="outline">Edit</Button>
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

