#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';

const program = new Command();

interface IntegrationConfig {
  name: string;
  slug: string;
  category: string;
  auth: string;
  color: string;
  website: string;
}

program
  .name('generate-integration')
  .description('Generate a new integration plugin with best practices')
  .version('1.0.0')
  .option('-n, --name <name>', 'Integration name (e.g., Notion)')
  .option('-c, --category <category>', 'Category (e.g., productivity)')
  .option('-a, --auth <type>', 'Auth type (oauth2, api_key, basic)')
  .action(async (options) => {
    console.log(chalk.cyan.bold('\n🚀 Integration Generator\n'));

    // Interactive prompts
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Integration name:',
        default: options.name,
        when: !options.name,
        validate: (input: string) => input.length > 0 || 'Name is required',
      },
      {
        type: 'list',
        name: 'category',
        message: 'Category:',
        choices: [
          { name: '💬 Communication', value: 'communication' },
          { name: '✅ Productivity', value: 'productivity' },
          { name: '👥 CRM', value: 'crm' },
          { name: '📈 Marketing', value: 'marketing' },
          { name: '⚙️  Developer Tools', value: 'developer-tools' },
          { name: '💰 Finance', value: 'finance' },
          { name: '👔 HR', value: 'hr' },
          { name: '📊 Database', value: 'database' },
        ],
        default: options.category,
        when: !options.category,
      },
      {
        type: 'list',
        name: 'auth',
        message: 'Authentication type:',
        choices: [
          { name: 'OAuth 2.0 (Recommended)', value: 'oauth2' },
          { name: 'API Key', value: 'api_key' },
          { name: 'Basic Auth', value: 'basic' },
          { name: 'Custom', value: 'custom' },
        ],
        default: options.auth,
        when: !options.auth,
      },
      {
        type: 'input',
        name: 'color',
        message: 'Brand color (hex):',
        default: '#000000',
        validate: (input: string) => /^#[0-9A-F]{6}$/i.test(input) || 'Must be a valid hex color',
      },
      {
        type: 'input',
        name: 'website',
        message: 'Official website:',
        validate: (input: string) => input.startsWith('http') || 'Must be a valid URL',
      },
    ]);

    const config: IntegrationConfig = {
      name: options.name || answers.name,
      slug: (options.name || answers.name).toLowerCase().replace(/\s+/g, '-'),
      category: options.category || answers.category,
      auth: options.auth || answers.auth,
      color: answers.color,
      website: answers.website,
    };

    await generateIntegration(config);
  });

async function generateIntegration(config: IntegrationConfig) {
  const spinner = ora('Generating integration...').start();

  try {
    const integrationPath = path.join(
      process.cwd(),
      'src/integrations/plugins',
      config.slug
    );

    // Create directory structure
    spinner.text = 'Creating directory structure...';
    await fs.ensureDir(integrationPath);
    await fs.ensureDir(path.join(integrationPath, 'actions'));
    await fs.ensureDir(path.join(integrationPath, 'triggers'));

    // Generate files
    spinner.text = 'Generating index file...';
    await generateIndexFile(integrationPath, config);
    
    spinner.text = 'Generating types file...';
    await generateTypesFile(integrationPath, config);
    
    spinner.text = 'Generating auth configuration...';
    await generateAuthFile(integrationPath, config);
    
    spinner.text = 'Generating example action...';
    await generateActionExample(integrationPath, config);
    
    spinner.text = 'Generating example trigger...';
    await generateTriggerExample(integrationPath, config);
    
    spinner.text = 'Generating README...';
    await generateReadme(integrationPath, config);
    
    spinner.text = 'Generating tests...';
    await generateTests(integrationPath, config);

    // Update registry
    spinner.text = 'Updating registry...';
    await updateRegistry(config);

    spinner.succeed(chalk.green(`✓ Generated integration: ${config.name}`));
    
    console.log(chalk.cyan('\n📝 Next steps:'));
    console.log(chalk.gray(`  1. cd src/integrations/plugins/${config.slug}`));
    console.log(chalk.gray(`  2. Implement actions in ./actions/`));
    console.log(chalk.gray(`  3. Add OAuth credentials to .env`));
    console.log(chalk.gray(`  4. Test with: npm run test`));
    console.log(chalk.cyan('\n📚 Files created:'));
    console.log(chalk.gray(`  - index.ts (main integration file)`));
    console.log(chalk.gray(`  - types.ts (TypeScript types)`));
    console.log(chalk.gray(`  - auth.ts (authentication config)`));
    console.log(chalk.gray(`  - actions/example-action.ts`));
    console.log(chalk.gray(`  - triggers/example-trigger.ts`));
    console.log(chalk.gray(`  - README.md`));
    console.log(chalk.gray(`  - index.test.ts\n`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to generate integration'));
    console.error(error);
    process.exit(1);
  }
}

async function generateIndexFile(basePath: string, config: IntegrationConfig) {
  const pascalCase = config.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  
  const template = `import { Integration } from '../../types';
import { ${config.slug.replace(/-/g, '')}Auth } from './auth';
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
const ${config.slug.replace(/-/g, '')}Integration: Integration = {
  metadata: {
    slug: '${config.slug}',
    name: '${config.name}',
    description: 'Connect with ${config.name} to automate your workflows',
    category: '${config.category}',
    version: '1.0.0',
    logo: '/assets/integrations/${config.slug}.png',
    color: '${config.color}',
    website: '${config.website}',
    documentation: '${config.website}/docs',
    requiresEndUserAuth: ${config.auth === 'oauth2'},
  },

  auth: ${config.slug.replace(/-/g, '')}Auth,

  actions: {
    // TODO: Implement your actions here
    // Example: send_message, create_item, update_record, etc.
    example_action: actions.exampleAction,
  },

  triggers: {
    // TODO: Implement your triggers here
    // Example: new_message, item_created, record_updated, etc.
    example_trigger: triggers.exampleTrigger,
  },
};

export default ${config.slug.replace(/-/g, '')}Integration;
`;

  await fs.writeFile(path.join(basePath, 'index.ts'), template);
}

async function generateTypesFile(basePath: string, config: IntegrationConfig) {
  const template = `/**
 * ${config.name} API Types
 * 
 * Type definitions for ${config.name} API responses and requests.
 */

export interface ${config.name.replace(/\s+/g, '')}Config {
  ${config.auth === 'oauth2' ? `
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  ` : config.auth === 'api_key' ? `
  apiKey: string;
  ` : `
  username: string;
  password: string;
  `}
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

// Add more types as needed for your integration
`;

  await fs.writeFile(path.join(basePath, 'types.ts'), template);
}

async function generateAuthFile(basePath: string, config: IntegrationConfig) {
  const authTemplates = {
    oauth2: `import { IntegrationAuth } from '../../types';

export const ${config.slug.replace(/-/g, '')}Auth: IntegrationAuth = {
  type: 'oauth2',
  oauth2: {
    authorizationUrl: 'https://api.${config.slug}.com/oauth/authorize',
    tokenUrl: 'https://api.${config.slug}.com/oauth/token',
    scopes: [
      // Add required scopes here
      'read',
      'write',
    ],
    clientId: process.env.${config.slug.toUpperCase().replace(/-/g, '_')}_CLIENT_ID!,
    clientSecret: process.env.${config.slug.toUpperCase().replace(/-/g, '_')}_CLIENT_SECRET!,
    authorizationParams: {
      // Add any additional authorization parameters
    },
  },
};
`,
    api_key: `import { IntegrationAuth } from '../../types';

export const ${config.slug.replace(/-/g, '')}Auth: IntegrationAuth = {
  type: 'api_key',
  apiKey: {
    header: 'Authorization',
    prefix: 'Bearer',
    envVar: '${config.slug.toUpperCase().replace(/-/g, '_')}_API_KEY',
  },
};
`,
    basic: `import { IntegrationAuth } from '../../types';

export const ${config.slug.replace(/-/g, '')}Auth: IntegrationAuth = {
  type: 'basic',
  basic: {
    usernameEnvVar: '${config.slug.toUpperCase().replace(/-/g, '_')}_USERNAME',
    passwordEnvVar: '${config.slug.toUpperCase().replace(/-/g, '_')}_PASSWORD',
  },
};
`,
    custom: `import { IntegrationAuth } from '../../types';

export const ${config.slug.replace(/-/g, '')}Auth: IntegrationAuth = {
  type: 'custom',
  custom: {
    // Implement your custom authentication logic
    async authenticate(credentials: any) {
      // Return authenticated credentials
      return credentials;
    },
  },
};
`,
  };

  const template = authTemplates[config.auth as keyof typeof authTemplates] || authTemplates.oauth2;
  await fs.writeFile(path.join(basePath, 'auth.ts'), template);
}

async function generateActionExample(basePath: string, config: IntegrationConfig) {
  const template = `import { IntegrationAction } from '../../../types';
import { z } from 'zod';

/**
 * Example Action for ${config.name}
 * 
 * This is a template action. Replace with your actual implementation.
 */
export const exampleAction: IntegrationAction = {
  id: 'example_action',
  name: 'Example Action',
  description: 'An example action for ${config.name}. Replace with your actual action.',
  
  inputSchema: z.object({
    message: z.string().describe('Message to send'),
    target: z.string().optional().describe('Target identifier (optional)'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    timestamp: z.string().optional(),
  }),

  async execute(input, context) {
    const { credentials, logger } = context;
    
    logger.info('Executing example action', { input });
    
    try {
      // TODO: Implement your action logic here
      // Example: Call ${config.name} API
      ${config.auth === 'oauth2' ? `
      const response = await fetch('https://api.${config.slug}.com/v1/action', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${credentials.accessToken}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(\`${config.name} API error: \${response.statusText}\`);
      }

      const data = await response.json();
      ` : `
      // Implement your API call here
      const data = { id: 'example-id', timestamp: new Date().toISOString() };
      `}
      
      logger.info('Action executed successfully', { data });
      
      return {
        success: true,
        data: {
          success: true,
          id: data.id,
          timestamp: data.timestamp || new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Action execution failed', { error });
      
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
    path.join(basePath, 'actions', 'example-action.ts'),
    template
  );
  
  // Also create index.ts for actions
  await fs.writeFile(
    path.join(basePath, 'actions', 'index.ts'),
    `export { exampleAction } from './example-action';\n// Export more actions here\n`
  );
}

async function generateTriggerExample(basePath: string, config: IntegrationConfig) {
  const template = `import { IntegrationTrigger } from '../../../types';
import { z } from 'zod';

/**
 * Example Trigger for ${config.name}
 * 
 * This is a template trigger. Replace with your actual implementation.
 */
export const exampleTrigger: IntegrationTrigger = {
  id: 'example_trigger',
  name: 'Example Trigger',
  description: 'Triggers when something happens in ${config.name}. Replace with your actual trigger.',
  
  outputSchema: z.object({
    id: z.string(),
    timestamp: z.string(),
    data: z.any(),
  }),

  async subscribe(config, context) {
    const { credentials, logger, webhookUrl } = context;
    
    logger.info('Subscribing to trigger', { config, webhookUrl });
    
    try {
      // TODO: Setup webhook or polling
      // For webhook-based triggers:
      ${config.auth === 'oauth2' ? `
      const response = await fetch('https://api.${config.slug}.com/v1/webhooks', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${credentials.accessToken}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          events: ['example.event'],
        }),
      });

      if (!response.ok) {
        throw new Error(\`Failed to subscribe: \${response.statusText}\`);
      }

      const data = await response.json();
      
      return {
        success: true,
        webhookId: data.id,
        webhookUrl,
      };
      ` : `
      // Implement your subscription logic here
      return {
        success: true,
        webhookUrl,
      };
      `}
    } catch (error) {
      logger.error('Failed to subscribe', { error });
      
      return {
        success: false,
        error: {
          code: 'SUBSCRIPTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },

  async unsubscribe(config, context) {
    const { credentials, logger } = context;
    
    logger.info('Unsubscribing from trigger', { config });
    
    try {
      // TODO: Cleanup webhook or polling
      ${config.auth === 'oauth2' ? `
      if (config.webhookId) {
        await fetch(\`https://api.${config.slug}.com/v1/webhooks/\${config.webhookId}\`, {
          method: 'DELETE',
          headers: {
            'Authorization': \`Bearer \${credentials.accessToken}\`,
          },
        });
      }
      ` : `
      // Implement your cleanup logic here
      `}
      
      return {
        success: true,
      };
    } catch (error) {
      logger.error('Failed to unsubscribe', { error });
      
      return {
        success: false,
        error: {
          code: 'UNSUBSCRIPTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};
`;

  await fs.writeFile(
    path.join(basePath, 'triggers', 'example-trigger.ts'),
    template
  );
  
  // Also create index.ts for triggers
  await fs.writeFile(
    path.join(basePath, 'triggers', 'index.ts'),
    `export { exampleTrigger } from './example-trigger';\n// Export more triggers here\n`
  );
}

async function generateReadme(basePath: string, config: IntegrationConfig) {
  const envVars = config.auth === 'oauth2' 
    ? `${config.slug.toUpperCase().replace(/-/g, '_')}_CLIENT_ID=your_client_id
${config.slug.toUpperCase().replace(/-/g, '_')}_CLIENT_SECRET=your_client_secret
${config.slug.toUpperCase().replace(/-/g, '_')}_REDIRECT_URI=https://your-domain.com/api/v1/connections/callback`
    : config.auth === 'api_key'
    ? `${config.slug.toUpperCase().replace(/-/g, '_')}_API_KEY=your_api_key`
    : `${config.slug.toUpperCase().replace(/-/g, '_')}_USERNAME=your_username
${config.slug.toUpperCase().replace(/-/g, '_')}_PASSWORD=your_password`;

  const template = `# ${config.name} Integration

## Overview

Integration with ${config.name} API for the Rule Engine platform.

- **Category**: ${config.category}
- **Auth Type**: ${config.auth}
- **Version**: 1.0.0
- **Website**: ${config.website}

## Features

- ✅ ${config.auth === 'oauth2' ? 'OAuth 2.0 authentication' : config.auth === 'api_key' ? 'API Key authentication' : 'Basic authentication'}
- ✅ Comprehensive error handling
- ✅ Automatic token refresh (OAuth only)
- ✅ Rate limiting support
- ✅ Webhook support
- ✅ Full TypeScript support

## Setup

### 1. Get API Credentials

1. Go to ${config.website}/developers
2. Create a new app/integration
3. ${config.auth === 'oauth2' ? 'Copy Client ID and Client Secret' : config.auth === 'api_key' ? 'Generate and copy API Key' : 'Get your credentials'}

### 2. Configure Environment Variables

Add to your \`.env\` file:

\`\`\`bash
${envVars}
\`\`\`

### 3. Test the Integration

\`\`\`bash
npm run test
\`\`\`

## Available Actions

### \`example_action\`

Example action for ${config.name}.

**Input:**
\`\`\`json
{
  "message": "Hello World",
  "target": "optional-target-id"
}
\`\`\`

**Output:**
\`\`\`json
{
  "success": true,
  "id": "action_123",
  "timestamp": "2025-12-22T10:00:00Z"
}
\`\`\`

## Available Triggers

### \`example_trigger\`

Triggers when something happens in ${config.name}.

**Output:**
\`\`\`json
{
  "id": "event_123",
  "timestamp": "2025-12-22T10:00:00Z",
  "data": {}
}
\`\`\`

## Development

### Adding New Actions

1. Create a new file in \`actions/\` directory
2. Implement the \`IntegrationAction\` interface
3. Export from \`actions/index.ts\`
4. Add to the integration's \`actions\` object

### Adding New Triggers

1. Create a new file in \`triggers/\` directory
2. Implement the \`IntegrationTrigger\` interface
3. Export from \`triggers/index.ts\`
4. Add to the integration's \`triggers\` object

## Testing

\`\`\`bash
# Run all tests
npm run test

# Run integration-specific tests
npm run test -- ${config.slug}

# Run with coverage
npm run test:coverage
\`\`\`

## API Documentation

- [${config.name} API Docs](${config.website}/docs)
- [${config.name} Developer Portal](${config.website}/developers)

## Support

For issues related to this integration:
1. Check the ${config.name} API documentation
2. Review error logs in the dashboard
3. Contact support@yourplatform.com

## License

MIT
`;

  await fs.writeFile(path.join(basePath, 'README.md'), template);
}

async function generateTests(basePath: string, config: IntegrationConfig) {
  const template = `import { describe, it, expect } from '@jest/globals';
import ${config.slug.replace(/-/g, '')}Integration from './index';

describe('${config.name} Integration', () => {
  it('should have correct metadata', () => {
    expect(${config.slug.replace(/-/g, '')}Integration.metadata.slug).toBe('${config.slug}');
    expect(${config.slug.replace(/-/g, '')}Integration.metadata.name).toBe('${config.name}');
    expect(${config.slug.replace(/-/g, '')}Integration.metadata.category).toBe('${config.category}');
    expect(${config.slug.replace(/-/g, '')}Integration.metadata.version).toBe('1.0.0');
  });

  it('should have auth configuration', () => {
    expect(${config.slug.replace(/-/g, '')}Integration.auth).toBeDefined();
    expect(${config.slug.replace(/-/g, '')}Integration.auth.type).toBe('${config.auth}');
  });

  it('should have actions defined', () => {
    expect(${config.slug.replace(/-/g, '')}Integration.actions).toBeDefined();
    expect(Object.keys(${config.slug.replace(/-/g, '')}Integration.actions).length).toBeGreaterThan(0);
  });

  it('should have triggers defined', () => {
    expect(${config.slug.replace(/-/g, '')}Integration.triggers).toBeDefined();
    expect(Object.keys(${config.slug.replace(/-/g, '')}Integration.triggers).length).toBeGreaterThan(0);
  });

  it('should have example_action', () => {
    const action = ${config.slug.replace(/-/g, '')}Integration.actions.example_action;
    expect(action).toBeDefined();
    expect(action.id).toBe('example_action');
    expect(action.inputSchema).toBeDefined();
    expect(action.outputSchema).toBeDefined();
    expect(action.execute).toBeDefined();
  });

  it('should have example_trigger', () => {
    const trigger = ${config.slug.replace(/-/g, '')}Integration.triggers.example_trigger;
    expect(trigger).toBeDefined();
    expect(trigger.id).toBe('example_trigger');
    expect(trigger.outputSchema).toBeDefined();
    expect(trigger.subscribe).toBeDefined();
    expect(trigger.unsubscribe).toBeDefined();
  });

  // TODO: Add more tests for your specific actions and triggers
});
`;

  await fs.writeFile(path.join(basePath, 'index.test.ts'), template);
}

async function updateRegistry(config: IntegrationConfig) {
  const registryPath = path.join(
    process.cwd(),
    'src/integrations/registry.ts'
  );
  
  let content = await fs.readFile(registryPath, 'utf-8');
  
  // Add import to the array
  const importLine = `    import('./plugins/${config.slug}'),`;
  
  // Find the integrationModules array and add the import
  if (!content.includes(importLine)) {
    content = content.replace(
      /const integrationModules = \[([\s\S]*?)\];/,
      (match, imports) => {
        return `const integrationModules = [${imports}${importLine}\n  ];`;
      }
    );
    
    await fs.writeFile(registryPath, content);
  }
}

program.parse();

