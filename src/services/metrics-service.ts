import { prisma } from '../lib/prisma';

/**
 * Metrics Service
 * Provides analytics and metrics for workflows and executions
 */

export interface DashboardMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  executionsToday: number;
  successRate: number;
  averageExecutionTime: number;
  topIntegrations: Array<{
    integration: string;
    count: number;
  }>;
  recentExecutions: any[];
  failingWorkflows: any[];
}

/**
 * Get dashboard metrics for an organization
 */
export async function getDashboardMetrics(
  organizationId: string
): Promise<DashboardMetrics> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parallel queries for performance
  const [
    totalWorkflows,
    activeWorkflows,
    totalExecutions,
    executionsToday,
    recentExecutions,
    allExecutions,
  ] = await Promise.all([
    // Total workflows
    prisma.workflow.count({
      where: { organizationId },
    }),

    // Active workflows
    prisma.workflow.count({
      where: { organizationId, status: 'active' },
    }),

    // Total executions
    prisma.workflowExecution.count({
      where: { organizationId },
    }),

    // Executions today
    prisma.workflowExecution.count({
      where: {
        organizationId,
        startedAt: { gte: today },
      },
    }),

    // Recent executions
    prisma.workflowExecution.findMany({
      where: { organizationId },
      include: {
        workflow: {
          select: { name: true },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 10,
    }),

    // All executions for calculations
    prisma.workflowExecution.findMany({
      where: { organizationId },
      select: {
        status: true,
        duration: true,
        workflow: {
          select: {
            definition: true,
          },
        },
      },
    }),
  ]);

  // Calculate success rate
  const successfulExecutions = allExecutions.filter(
    e => e.status === 'success'
  ).length;
  const successRate =
    totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

  // Calculate average execution time
  const validDurations = allExecutions
    .filter(e => e.duration !== null)
    .map(e => e.duration!);
  const averageExecutionTime =
    validDurations.length > 0
      ? validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length
      : 0;

  // Top integrations
  const integrationCounts = new Map<string, number>();
  allExecutions.forEach(exec => {
    const definition = exec.workflow.definition as any;
    if (definition?.steps) {
      definition.steps.forEach((step: any) => {
        const count = integrationCounts.get(step.integration) || 0;
        integrationCounts.set(step.integration, count + 1);
      });
    }
  });

  const topIntegrations = Array.from(integrationCounts.entries())
    .map(([integration, count]) => ({ integration, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Failing workflows
  const workflowFailures = new Map<string, number>();
  allExecutions
    .filter(e => e.status === 'failed')
    .forEach(exec => {
      const count = workflowFailures.get(exec.workflow.definition as any) || 0;
      workflowFailures.set(exec.workflow.definition as any, count + 1);
    });

  const failingWorkflows = await prisma.workflow.findMany({
    where: {
      organizationId,
      id: {
        in: Array.from(workflowFailures.keys()).slice(0, 5),
      },
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });

  return {
    totalWorkflows,
    activeWorkflows,
    totalExecutions,
    executionsToday,
    successRate,
    averageExecutionTime,
    topIntegrations,
    recentExecutions,
    failingWorkflows,
  };
}

/**
 * Get workflow-specific metrics
 */
export async function getWorkflowMetrics(workflowId: string) {
  const [executions, lastExecution] = await Promise.all([
    prisma.workflowExecution.findMany({
      where: { workflowId },
      select: {
        status: true,
        duration: true,
        startedAt: true,
      },
    }),
    prisma.workflowExecution.findFirst({
      where: { workflowId },
      orderBy: { startedAt: 'desc' },
    }),
  ]);

  const total = executions.length;
  const successful = executions.filter(e => e.status === 'success').length;
  const failed = executions.filter(e => e.status === 'failed').length;
  const running = executions.filter(e => e.status === 'running').length;

  const durations = executions
    .filter(e => e.duration)
    .map(e => e.duration!);

  const avgDuration =
    durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

  // Group by day for chart
  const executionsByDay = new Map<string, { success: number; failed: number }>();
  executions.forEach(exec => {
    const day = exec.startedAt.toISOString().split('T')[0];
    const current = executionsByDay.get(day) || { success: 0, failed: 0 };
    if (exec.status === 'success') current.success++;
    if (exec.status === 'failed') current.failed++;
    executionsByDay.set(day, current);
  });

  return {
    total,
    successful,
    failed,
    running,
    successRate: total > 0 ? (successful / total) * 100 : 0,
    averageDuration: avgDuration,
    lastExecution,
    executionsByDay: Array.from(executionsByDay.entries()).map(([day, counts]) => ({
      day,
      ...counts,
    })),
  };
}

/**
 * Record usage metric
 */
export async function recordUsageMetric(
  organizationId: string,
  metricType: string,
  value: number,
  metadata?: {
    workflowId?: string;
    integrationId?: string;
  }
) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
  const periodEnd = new Date(periodStart);
  periodEnd.setHours(periodEnd.getHours() + 1);

  await prisma.usageMetric.create({
    data: {
      organizationId,
      metricType,
      value,
      workflowId: metadata?.workflowId,
      integrationId: metadata?.integrationId,
      periodStart,
      periodEnd,
    },
  });
}

