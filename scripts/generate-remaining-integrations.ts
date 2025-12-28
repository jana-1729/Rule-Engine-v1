/**
 * Script to generate remaining integrations quickly
 * This creates HubSpot, Salesforce, Jira, GitHub, and Trello integrations
 */

import fs from 'fs-extra';
import path from 'path';

const integrations = [
  {
    name: 'HubSpot',
    slug: 'hubspot',
    category: 'crm',
    color: '#FF7A59',
    website: 'https://hubspot.com',
    docs: 'https://developers.hubspot.com/docs/api/overview',
    scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write', 'crm.objects.companies.read'],
    actions: [
      { id: 'create_contact', name: 'Create Contact', description: 'Create a new contact in HubSpot' },
      { id: 'update_contact', name: 'Update Contact', description: 'Update an existing contact' },
    ],
  },
  {
    name: 'Salesforce',
    slug: 'salesforce',
    category: 'crm',
    color: '#00A1E0',
    website: 'https://salesforce.com',
    docs: 'https://developer.salesforce.com/docs/apis',
    scopes: ['api', 'refresh_token', 'offline_access'],
    actions: [
      { id: 'create_lead', name: 'Create Lead', description: 'Create a new lead in Salesforce' },
      { id: 'update_opportunity', name: 'Update Opportunity', description: 'Update an opportunity' },
    ],
  },
  {
    name: 'Jira',
    slug: 'jira',
    category: 'developer-tools',
    color: '#0052CC',
    website: 'https://jira.atlassian.com',
    docs: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/',
    scopes: ['read:jira-work', 'write:jira-work', 'read:jira-user'],
    actions: [
      { id: 'create_issue', name: 'Create Issue', description: 'Create a new issue in Jira' },
      { id: 'update_issue', name: 'Update Issue', description: 'Update an existing issue' },
    ],
  },
  {
    name: 'GitHub',
    slug: 'github',
    category: 'developer-tools',
    color: '#181717',
    website: 'https://github.com',
    docs: 'https://docs.github.com/en/rest',
    scopes: ['repo', 'user', 'workflow'],
    actions: [
      { id: 'create_issue', name: 'Create Issue', description: 'Create a new issue in a repository' },
      { id: 'create_pr', name: 'Create Pull Request', description: 'Create a new pull request' },
    ],
  },
  {
    name: 'Trello',
    slug: 'trello',
    category: 'productivity',
    color: '#0079BF',
    website: 'https://trello.com',
    docs: 'https://developer.atlassian.com/cloud/trello/rest/',
    scopes: ['read', 'write'],
    actions: [
      { id: 'create_card', name: 'Create Card', description: 'Create a new card in Trello' },
      { id: 'update_card', name: 'Update Card', description: 'Update an existing card' },
    ],
  },
];

async function generateIntegration(config: typeof integrations[0]) {
  const basePath = path.join(process.cwd(), 'src/integrations/plugins', config.slug);
  
  await fs.ensureDir(basePath);
  await fs.ensureDir(path.join(basePath, 'actions'));
  await fs.ensureDir(path.join(basePath, 'triggers'));

  // Generate index.ts
  const indexContent = `import { Integration } from '../../types';
import { ${config.slug}Auth } from './auth';
import * as actions from './actions';
import * as triggers from './triggers';

/**
 * ${config.name} Integration
 * 
 * ${config.name} integration for the Rule Engine platform.
 * Provides actions and triggers for ${config.name} API.
 * 
 * @category ${config.category}
 * @version 1.0.0
 */
const ${config.slug}Integration: Integration = {
  metadata: {
    slug: '${config.slug}',
    name: '${config.name}',
    description: 'Connect with ${config.name} to automate your workflows',
    category: '${config.category}',
    version: '1.0.0',
    logo: '/assets/integrations/${config.slug}.png',
    color: '${config.color}',
    website: '${config.website}',
    documentation: '${config.docs}',
    requiresEndUserAuth: true,
  },

  auth: ${config.slug}Auth,

  actions: {
${config.actions.map(a => `    ${a.id}: actions.${toCamelCase(a.id)},`).join('\n')}
  },

  triggers: {
    // Triggers can be added later
  },
};

export default ${config.slug}Integration;
`;

  await fs.writeFile(path.join(basePath, 'index.ts'), indexContent);

  // Generate auth.ts
  const authContent = `import { IntegrationAuth } from '../../types';

export const ${config.slug}Auth: IntegrationAuth = {
  type: 'oauth2',
  oauth2: {
    authorizationUrl: '${getAuthUrl(config.slug)}',
    tokenUrl: '${getTokenUrl(config.slug)}',
    scopes: ${JSON.stringify(config.scopes, null, 6)},
    clientId: process.env.${config.slug.toUpperCase()}_CLIENT_ID!,
    clientSecret: process.env.${config.slug.toUpperCase()}_CLIENT_SECRET!,
    authorizationParams: {
      response_type: 'code',
    },
  },
};
`;

  await fs.writeFile(path.join(basePath, 'auth.ts'), authContent);

  // Generate types.ts
  const typesContent = `/**
 * ${config.name} API Types
 */

export interface ${config.name.replace(/\s+/g, '')}Config {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface ${config.name.replace(/\s+/g, '')}User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface ${config.name.replace(/\s+/g, '')}Response<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
`;

  await fs.writeFile(path.join(basePath, 'types.ts'), typesContent);

  // Generate actions
  for (const action of config.actions) {
    const actionContent = `import { IntegrationAction } from '../../../types';
import { z } from 'zod';

/**
 * ${action.name} Action for ${config.name}
 */
export const ${toCamelCase(action.id)}: IntegrationAction = {
  id: '${action.id}',
  name: '${action.name}',
  description: '${action.description}',
  
  inputSchema: z.object({
    data: z.record(z.any()).describe('Action input data'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
  }),

  async execute(input, context) {
    const { credentials, logger } = context;
    
    logger.info('Executing ${action.id}', { input });
    
    try {
      // TODO: Implement ${config.name} API call
      // This is a placeholder implementation
      
      return {
        success: true,
        data: {
          success: true,
          id: 'placeholder-id',
        },
      };
    } catch (error) {
      logger.error('Failed to execute ${action.id}', { error });
      
      return {
        success: false,
        error: {
          code: 'EXECUTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};
`;

    await fs.writeFile(
      path.join(basePath, 'actions', `${action.id}.ts`),
      actionContent
    );
  }

  // Generate actions index
  const actionsIndexContent = config.actions
    .map(a => `export { ${toCamelCase(a.id)} } from './${a.id}';`)
    .join('\n') + '\n';

  await fs.writeFile(path.join(basePath, 'actions', 'index.ts'), actionsIndexContent);

  // Generate triggers index
  await fs.writeFile(
    path.join(basePath, 'triggers', 'index.ts'),
    '// Triggers will be added in future updates\n'
  );

  console.log(`✓ Generated ${config.name} integration`);
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

function getAuthUrl(slug: string): string {
  const urls: Record<string, string> = {
    hubspot: 'https://app.hubspot.com/oauth/authorize',
    salesforce: 'https://login.salesforce.com/services/oauth2/authorize',
    jira: 'https://auth.atlassian.com/authorize',
    github: 'https://github.com/login/oauth/authorize',
    trello: 'https://trello.com/1/authorize',
  };
  return urls[slug] || `https://api.${slug}.com/oauth/authorize`;
}

function getTokenUrl(slug: string): string {
  const urls: Record<string, string> = {
    hubspot: 'https://api.hubapi.com/oauth/v1/token',
    salesforce: 'https://login.salesforce.com/services/oauth2/token',
    jira: 'https://auth.atlassian.com/oauth/token',
    github: 'https://github.com/login/oauth/access_token',
    trello: 'https://trello.com/1/OAuthGetAccessToken',
  };
  return urls[slug] || `https://api.${slug}.com/oauth/token`;
}

async function main() {
  console.log('🚀 Generating remaining integrations...\n');
  
  for (const integration of integrations) {
    await generateIntegration(integration);
  }
  
  console.log('\n✅ All integrations generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Update src/integrations/registry.ts to import these integrations');
  console.log('2. Implement the actual API calls in each action');
  console.log('3. Add OAuth credentials to .env');
}

main().catch(console.error);

