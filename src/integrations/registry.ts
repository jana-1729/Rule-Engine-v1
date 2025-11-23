import { Integration, IntegrationRegistry, IntegrationAction, IntegrationTrigger } from './types';

/**
 * Central registry for all integrations
 * Enables dynamic loading and discovery of integrations
 */
class IntegrationRegistryImpl implements IntegrationRegistry {
  private integrations: Map<string, Integration> = new Map();

  register(integration: Integration): void {
    const { slug } = integration.metadata;
    
    if (this.integrations.has(slug)) {
      console.warn(`Integration ${slug} is already registered. Overwriting...`);
    }
    
    this.integrations.set(slug, integration);
    console.log(`✓ Registered integration: ${slug} v${integration.metadata.version}`);
  }

  get(slug: string): Integration | undefined {
    return this.integrations.get(slug);
  }

  list(): Integration[] {
    return Array.from(this.integrations.values());
  }

  getAction(integrationSlug: string, actionId: string): IntegrationAction | undefined {
    const integration = this.get(integrationSlug);
    return integration?.actions[actionId];
  }

  getTrigger(integrationSlug: string, triggerId: string): IntegrationTrigger | undefined {
    const integration = this.get(integrationSlug);
    return integration?.triggers[triggerId];
  }

  getByCategory(category: string): Integration[] {
    return this.list().filter(i => i.metadata.category === category);
  }

  search(query: string): Integration[] {
    const lowerQuery = query.toLowerCase();
    return this.list().filter(i => 
      i.metadata.name.toLowerCase().includes(lowerQuery) ||
      i.metadata.description.toLowerCase().includes(lowerQuery) ||
      i.metadata.slug.toLowerCase().includes(lowerQuery)
    );
  }

  validateIntegration(integration: Integration): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!integration.metadata.slug) {
      errors.push('Integration must have a slug');
    }

    if (!integration.metadata.name) {
      errors.push('Integration must have a name');
    }

    if (!integration.metadata.version) {
      errors.push('Integration must have a version');
    }

    if (!integration.auth) {
      errors.push('Integration must define auth configuration');
    }

    if (!integration.actions || Object.keys(integration.actions).length === 0) {
      errors.push('Integration must define at least one action');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Singleton instance
export const integrationRegistry = new IntegrationRegistryImpl();

// Auto-discovery: Import all integrations
export async function loadIntegrations() {
  console.log('🔌 Loading integrations...');
  
  // Dynamic imports for all integrations
  // In production, this would scan the integrations directory
  const integrationModules = [
    import('./plugins/google-sheets'),
    import('./plugins/notion'),
    import('./plugins/slack'),
    // Add more as they're created
  ];

  const results = await Promise.allSettled(integrationModules);
  
  let successCount = 0;
  let failCount = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.default) {
      const integration = result.value.default;
      const validation = integrationRegistry.validateIntegration(integration);
      
      if (validation.valid) {
        integrationRegistry.register(integration);
        successCount++;
      } else {
        console.error(`Invalid integration at index ${index}:`, validation.errors);
        failCount++;
      }
    } else {
      failCount++;
    }
  });

  console.log(`✓ Loaded ${successCount} integrations (${failCount} failed)`);
  
  return integrationRegistry;
}

