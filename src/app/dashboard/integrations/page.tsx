import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { IntegrationCard } from '@/ui/dashboard/integration-card';

export default async function IntegrationsPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Fetch all integrations (actions and triggers are JSON fields, not relations)
  const integrations = await prisma.integration.findMany({
    where: { status: 'available' },
    orderBy: { name: 'asc' },
  });

  // Get account's apps to check enabled integrations
  const apps = await prisma.app.findMany({
    where: { accountId: session.accountId },
    include: {
      connections: {
        include: {
          integration: true,
        },
      },
    },
  });

  // Group connections by integration
  const connectionsByIntegration = new Map<string, number>();
  apps.forEach((app) => {
    app.connections.forEach((conn) => {
      const count = connectionsByIntegration.get(conn.integrationId) || 0;
      connectionsByIntegration.set(conn.integrationId, count + 1);
    });
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-2">
            Connect and manage your integration endpoints
          </p>
        </div>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            connections={connectionsByIntegration.get(integration.id) || 0}
          />
        ))}
      </div>

      {integrations.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No integrations available yet.</p>
          <p className="text-sm mt-2">
            Integrations will appear here once they are configured.
          </p>
        </div>
      )}
    </div>
  );
}

