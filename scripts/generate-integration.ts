#!/usr/bin/env ts-node

/**
 * Integration Generator CLI
 * Quickly scaffold new integrations with all necessary files
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';

interface IntegrationConfig {
  name: string;
  slug: string;
  category: string;
  authType: 'oauth2' | 'api_key' | 'basic';
  description: string;
}

async function generateIntegration(config: IntegrationConfig) {
  const integrationPath = path.join(
    process.cwd(),
    'src/integrations/plugins',
    config.slug
  );

  console.log(`\n🔧 Generating ${config.name} integration...\n`);

  // Create directory structure
  await fs.ensureDir(integrationPath);
  await fs.ensureDir(path.join(integrationPath, 'actions'));
  await fs.ensureDir(path.join(integrationPath, 'triggers'));

  // Generate main integration file
  await generateIndexFile(integrationPath, config);

  // Generate example action
  await generateExampleAction(integrationPath, config);

  // Generate types file
  await generateTypesFile(integrationPath, config);

  // Generate README
  await generateReadme(integrationPath, config);

  // Update registry
  await updateRegistry(config);

  console.log(`✅ Integration generated successfully!\n`);
  console.log(`📁 Location: ${integrationPath}\n`);
  console.log(`📝 Next steps:`);
  console.log(`   1. Add OAuth credentials to .env`);
  console.log(`   2. Implement actions in ./actions/`);
  console.log(`   3. Test the integration`);
  console.log(`   4. Update the README with examples\n`);
}

async function generateIndexFile(basePath: string, config: IntegrationConfig) {
  const authConfig = config.authType === 'oauth2' 
    ? `auth: {
    type: 'oauth2',
    config: {
      authorizationUrl: 'https://api.${config.slug}.com/oauth/authorize',
      tokenUrl: 'https://api.${config.slug}.com/oauth/token',
      clientId: process.env.${config.slug.toUpperCase().replace(/-/g, '_')}_CLIENT_ID || '',
      clientSecret: process.env.${config.slug.toUpperCase().replace(/-/g, '_')}_CLIENT_SECRET || '',
      scopes: ['read', 'write'],
      redirectUri: \`\${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/${config.slug}\`,
    },
    async validate(credentials: ConnectionCredentials): Promise<boolean> {
      try {
        const response = await axios.get(
          'https://api.${config.slug}.com/user',
          {
            headers: {
              'Authorization': \`Bearer \${credentials.data.accessToken}\`,
            },
          }
        );
        return !!response.data.id;
      } catch {
        return false;
      }
    },
  },`
    : `auth: {
    type: 'api_key',
    config: {
      fields: [
        {
          key: 'apiKey',
          label: 'API Key',
          type: 'password',
          required: true,
        },
      ],
    },
    async validate(credentials: ConnectionCredentials): Promise<boolean> {
      try {
        const response = await axios.get(
          'https://api.${config.slug}.com/verify',
          {
            headers: {
              'Authorization': \`Bearer \${credentials.data.apiKey}\`,
            },
          }
        );
        return response.data.valid === true;
      } catch {
        return false;
      }
    },
  },`;

  const template = `import { z } from 'zod';
import { Integration, ActionResult, ConnectionCredentials, ExecutionContext } from '../../types';
import { BaseIntegration } from '../../base-integration';
import axios from 'axios';

/**
 * ${config.name} Integration
 * ${config.description}
 */

const metadata = BaseIntegration.prototype['createMetadata']({
  slug: '${config.slug}',
  name: '${config.name}',
  description: '${config.description}',
  category: '${config.category}',
  icon: '/integrations/${config.slug}.svg',
  version: '1.0.0',
  authType: '${config.authType}',
  website: 'https://${config.slug}.com',
  documentation: 'https://docs.${config.slug}.com',
});

// ============================================
// ACTIONS
// ============================================

// Import actions
import { exampleAction } from './actions/example-action';

// ============================================
// INTEGRATION DEFINITION
// ============================================

const ${config.slug.replace(/-/g, '')}Integration: Integration = {
  metadata,
  ${authConfig}
  actions: {
    example_action: exampleAction,
    // Add more actions here
  },
  triggers: {
    // Add triggers here
  },
};

export default ${config.slug.replace(/-/g, '')}Integration;
`;

  await fs.writeFile(path.join(basePath, 'index.ts'), template);
}

async function generateExampleAction(basePath: string, config: IntegrationConfig) {
  const template = `import { z } from 'zod';
import { ActionResult, ConnectionCredentials, ExecutionContext } from '../../../types';
import axios from 'axios';

export const exampleAction = {
  id: 'example_action',
  name: 'Example Action',
  description: 'An example action for ${config.name}',
  
  inputSchema: z.object({
    message: z.string().describe('Message to send'),
    target: z.string().optional().describe('Target identifier'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    message: z.string().optional(),
  }),

  async execute(
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      context.logger.info('Executing example action for ${config.name}', { input });

      const accessToken = credentials.data.accessToken || credentials.data.apiKey;

      // TODO: Implement actual API call
      const response = await axios.post(
        'https://api.${config.slug}.com/action',
        {
          message: input.message,
          target: input.target,
        },
        {
          headers: {
            'Authorization': \`Bearer \${accessToken}\`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        data: {
          success: true,
          id: response.data.id,
          message: response.data.message,
        },
      };
    } catch (error: any) {
      context.logger.error('Failed to execute ${config.name} action', error);
      
      return {
        success: false,
        error: {
          code: error.response?.data?.code || 'UNKNOWN',
          message: error.response?.data?.message || error.message,
          details: error.response?.data,
        },
      };
    }
  },
};
`;

  await fs.writeFile(
    path.join(basePath, 'actions', 'example-action.ts'),
    template
  );
}

async function generateTypesFile(basePath: string, config: IntegrationConfig) {
  const template = `/**
 * ${config.name} API Types
 */

export interface ${config.name.replace(/\s+/g, '')}Config {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface ${config.name.replace(/\s+/g, '')}User {
  id: string;
  email: string;
  name: string;
}

export interface ${config.name.replace(/\s+/g, '')}Response {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}

// Add more types as needed
`;

  await fs.writeFile(path.join(basePath, 'types.ts'), template);
}

async function generateReadme(basePath: string, config: IntegrationConfig) {
  const template = `# ${config.name} Integration

## Overview
${config.description}

## Authentication
**Type**: ${config.authType}

## Setup

### 1. Get API Credentials
1. Go to ${config.name} developer portal
2. Create a new app
3. Copy the credentials

### 2. Configure Environment Variables
\`\`\`bash
${config.authType === 'oauth2' ? `
${config.slug.toUpperCase().replace(/-/g, '_')}_CLIENT_ID=your_client_id
${config.slug.toUpperCase().replace(/-/g, '_')}_CLIENT_SECRET=your_client_secret
` : `
${config.slug.toUpperCase().replace(/-/g, '_')}_API_KEY=your_api_key
`}
\`\`\`

## Available Actions

### \`example_action\`
Example action description.

**Input:**
\`\`\`json
{
  "message": "Hello World",
  "target": "optional-target"
}
\`\`\`

**Output:**
\`\`\`json
{
  "success": true,
  "id": "msg_123",
  "message": "Action completed"
}
\`\`\`

## Usage Example

\`\`\`typescript
const result = await client.integrations.execute({
  integration: '${config.slug}',
  action: 'example_action',
  endUserId: 'user-123',
  input: {
    message: 'Hello from ${config.name}!',
  },
});
\`\`\`

## Testing

\`\`\`bash
npm run test:integration ${config.slug}
\`\`\`

## API Documentation
- [${config.name} API Docs](https://docs.${config.slug}.com)
- [Developer Portal](https://developers.${config.slug}.com)

## Support
For issues specific to this integration, please check:
- ${config.name} API status
- OAuth configuration
- API rate limits

## TODO
- [ ] Implement additional actions
- [ ] Add trigger support
- [ ] Add comprehensive tests
- [ ] Update documentation with real examples
`;

  await fs.writeFile(path.join(basePath, 'README.md'), template);
}

async function updateRegistry(config: IntegrationConfig) {
  const registryPath = path.join(
    process.cwd(),
    'src/integrations/registry.ts'
  );
  
  let content = await fs.readFile(registryPath, 'utf-8');
  
  // Add import to the integration modules array
  const importLine = `    import('./plugins/${config.slug}'),`;
  
  if (!content.includes(importLine)) {
    content = content.replace(
      'const integrationModules = [',
      `const integrationModules = [\n${importLine}`
    );
    
    await fs.writeFile(registryPath, content);
    console.log(`✅ Updated registry with ${config.name}`);
  }
}

// CLI Interface
async function main() {
  console.log('\n🚀 Integration Generator\n');

  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npm run generate:integration -- --name="Integration Name" [options]\n');
    console.log('Options:');
    console.log('  --name         Integration name (required)');
    console.log('  --category     Category (default: productivity)');
    console.log('  --auth         Auth type: oauth2, api_key, basic (default: oauth2)');
    console.log('  --description  Description (optional)\n');
    console.log('Example:');
    console.log('  npm run generate:integration -- --name="HubSpot" --category="crm" --auth="oauth2"\n');
    process.exit(1);
  }

  // Parse arguments
  const config: Partial<IntegrationConfig> = {};
  
  args.forEach(arg => {
    const [key, value] = arg.split('=');
    const cleanKey = key.replace('--', '');
    const cleanValue = value?.replace(/['"]/g, '');
    
    if (cleanKey === 'name') config.name = cleanValue;
    if (cleanKey === 'category') config.category = cleanValue;
    if (cleanKey === 'auth') config.authType = cleanValue as any;
    if (cleanKey === 'description') config.description = cleanValue;
  });

  // Set defaults
  if (!config.name) {
    console.error('❌ Error: --name is required\n');
    process.exit(1);
  }

  config.slug = config.name.toLowerCase().replace(/\s+/g, '-');
  config.category = config.category || 'productivity';
  config.authType = config.authType || 'oauth2';
  config.description = config.description || `Integration with ${config.name}`;

  await generateIntegration(config as IntegrationConfig);
}

main().catch(console.error);

