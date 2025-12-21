import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import Link from 'next/link';
import { WorkflowActions } from '@/ui/workflow/workflow-actions';

export default async function WorkflowDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch workflow details
  const workflow = await prisma.workflow.findUnique({
    where: { id: params.id },
    include: {
      app: {
        select: {
          id: true,
          name: true,
          appId: true,
          accountId: true,
        },
      },
      integration: {
        select: {
          id: true,
          slug: true,
          name: true,
          logo: true,
          category: true,
        },
      },
      executions: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          endUser: {
            select: {
              id: true,
              externalId: true,
            },
          },
        },
      },
    },
  });

  if (!workflow) {
    notFound();
  }

  // Check if workflow belongs to user's account
  if (workflow.app.accountId !== session.accountId) {
    notFound();
  }

  // Parse workflow definition
  const definition = workflow.definition ? 
    (typeof workflow.definition === 'string' ? 
      JSON.parse(workflow.definition) : workflow.definition) : 
    {};

  // Get steps from definition
  const steps = definition.steps || [];
  const trigger = definition.trigger || {};

  // Calculate success rate
  const successfulExecutions = workflow.executions.filter(e => e.status === 'success').length;
  const successRate = workflow.executions.length > 0 
    ? Math.round((successfulExecutions / workflow.executions.length) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden shadow-md">
            {workflow.integration.logo ? (
              <img 
                src={workflow.integration.logo} 
                alt={workflow.integration.name}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <span className="text-4xl">⚡</span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{workflow.name}</h1>
            <p className="text-gray-600 mt-1">{workflow.description || 'No description'}</p>
            <div className="flex items-center space-x-3 mt-2">
              <Badge variant={workflow.enabled ? 'default' : 'secondary'}>
                {workflow.enabled ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-sm text-gray-500">
                {workflow.integration.name}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/dashboard/workflows">
            <Button variant="outline">← Back</Button>
          </Link>
          <WorkflowActions workflowId={workflow.id} enabled={workflow.enabled} />
        </div>
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
              {workflow.executions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {successRate}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {steps.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflow.enabled ? (
                <span className="text-green-600">🟢 Active</span>
              ) : (
                <span className="text-gray-400">⚫ Inactive</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* App Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">App</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{workflow.app.name}</Badge>
              <span className="text-xs text-gray-500">ID: {workflow.app.appId}</span>
            </div>
          </div>

          {/* Integration Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Integration</h3>
            <div className="flex items-center space-x-3">
              {workflow.integration.logo && (
                <img 
                  src={workflow.integration.logo} 
                  alt={workflow.integration.name}
                  className="w-8 h-8 object-contain"
                />
              )}
              <div>
                <div className="font-medium">{workflow.integration.name}</div>
                <div className="text-xs text-gray-500 capitalize">{workflow.integration.category}</div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Workflow Steps</h3>
            <div className="space-y-3">
              {steps.map((step: any, index: number) => (
                <div 
                  key={step.id || index}
                  className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{step.name || step.action}</div>
                        <div className="text-sm text-gray-600">
                          Action: <code className="px-2 py-0.5 bg-white rounded text-xs">{step.action}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Field Mappings */}
                  {step.input?.mappings && step.input.mappings.length > 0 && (
                    <div className="mt-3 pl-11">
                      <div className="text-xs font-medium text-gray-600 mb-2">Field Mappings:</div>
                      <div className="space-y-1">
                        {step.input.mappings.map((mapping: any, idx: number) => (
                          <div key={idx} className="text-xs bg-white p-2 rounded border border-gray-200">
                            <span className="font-medium text-gray-700">{mapping.target}</span>
                            <span className="text-gray-400 mx-2">→</span>
                            <code className="text-blue-600">{mapping.source}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          {workflow.executions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg font-medium">No executions yet</p>
              <p className="text-sm mt-2">
                This workflow hasn't been executed yet. Use the API to trigger it.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {workflow.executions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant={
                          execution.status === 'success'
                            ? 'default'
                            : execution.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {execution.status}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {execution.endUser?.externalId || 'Unknown User'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(execution.createdAt).toLocaleString()}
                      {execution.completedAt && (
                        <span className="ml-2">
                          • Duration: {Math.round((new Date(execution.completedAt).getTime() - new Date(execution.createdAt).getTime()) / 1000)}s
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/dashboard/executions?id=${execution.id}`}>
                    <Button variant="ghost" size="sm">
                      View Details →
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Created</div>
              <div className="font-medium">{new Date(workflow.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-600">Last Updated</div>
              <div className="font-medium">{new Date(workflow.updatedAt).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-600">Workflow ID</div>
              <div className="font-mono text-xs">{workflow.id}</div>
            </div>
            <div>
              <div className="text-gray-600">Integration ID</div>
              <div className="font-mono text-xs">{workflow.integrationId}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

