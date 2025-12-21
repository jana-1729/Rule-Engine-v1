# 📅 Week 1 Implementation Guide

> **Goal**: Build integration generator CLI and create 3 high-priority integrations  
> **Timeline**: 7 days  
> **Outcome**: 4 production integrations (Slack + 3 new)

---

## 🎯 Daily Breakdown

### Day 1: Integration Template Generator CLI

#### Morning: Setup CLI Infrastructure
```bash
# Create CLI tools directory
mkdir -p scripts/cli
cd scripts/cli

# Install CLI dependencies
npm install --save-dev commander inquirer chalk ora
```

#### Create: `scripts/cli/generate-integration.ts`
```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';

const program = new Command();

program
  .name('generate-integration')
  .description('Generate a new integration plugin')
  .option('-n, --name <name>', 'Integration name (e.g., Notion)')
  .option('-c, --category <category>', 'Category (e.g., productivity)')
  .option('-a, --auth <type>', 'Auth type (oauth2, api_key, basic)')
  .action(async (options) => {
    // Interactive prompts if options not provided
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Integration name:',
        default: options.name,
        when: !options.name,
      },
      {
        type: 'list',
        name: 'category',
        message: 'Category:',
        choices: [
          'communication',
          'productivity',
          'crm',
          'marketing',
          'developer-tools',
          'finance',
          'hr',
        ],
        default: options.category,
        when: !options.category,
      },
      {
        type: 'list',
        name: 'auth',
        message: 'Authentication type:',
        choices: ['oauth2', 'api_key', 'basic', 'custom'],
        default: options.auth,
        when: !options.auth,
      },
    ]);

    const config = {
      name: options.name || answers.name,
      slug: (options.name || answers.name).toLowerCase().replace(/\s+/g, '-'),
      category: options.category || answers.category,
      auth: options.auth || answers.auth,
    };

    await generateIntegration(config);
  });

async function generateIntegration(config: any) {
  const spinner = ora('Generating integration...').start();

  try {
    const integrationPath = path.join(
      process.cwd(),
      'src/integrations/plugins',
      config.slug
    );

    // Create directory structure
    await fs.ensureDir(integrationPath);
    await fs.ensureDir(path.join(integrationPath, 'actions'));
    await fs.ensureDir(path.join(integrationPath, 'triggers'));

    // Generate files
    await generateIndexFile(integrationPath, config);
    await generateTypesFile(integrationPath, config);
    await generateActionExample(integrationPath, config);
    await generateTriggerExample(integrationPath, config);
    await generateReadme(integrationPath, config);
    await generateTests(integrationPath, config);

    // Update registry
    await updateRegistry(config);

    spinner.succeed(chalk.green(`✓ Generated integration: ${config.name}`));
    
    console.log(chalk.cyan('\nNext steps:'));
    console.log(`  1. cd src/integrations/plugins/${config.slug}`);
    console.log(`  2. Implement actions in ./actions/`);
    console.log(`  3. Add OAuth credentials to .env`);
    console.log(`  4. Test with: npm run test:integration ${config.slug}`);
  } catch (error) {
    spinner.fail(chalk.red('Failed to generate integration'));
    console.error(error);
    process.exit(1);
  }
}

async function generateIndexFile(basePath: string, config: any) {
  const template = `import { Integration } from '../../types';
import { ${config.slug}Auth } from './auth';
import * as actions from './actions';
import * as triggers from './triggers';

const ${config.slug}Integration: Integration = {
  metadata: {
    slug: '${config.slug}',
    name: '${config.name}',
    description: '${config.name} integration',
    category: '${config.category}',
    version: '1.0.0',
    logo: '/logos/${config.slug}.svg',
    color: '#000000', // Update with brand color
    website: 'https://${config.slug}.com',
  },

  auth: ${config.slug}Auth,

  actions: {
    // TODO: Implement actions
    example_action: actions.exampleAction,
  },

  triggers: {
    // TODO: Implement triggers
    example_trigger: triggers.exampleTrigger,
  },
};

export default ${config.slug}Integration;
`;

  await fs.writeFile(path.join(basePath, 'index.ts'), template);
}

async function generateTypesFile(basePath: string, config: any) {
  const template = `// ${config.name} API Types

export interface ${config.name}Config {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface ${config.name}User {
  id: string;
  email: string;
  name: string;
}

// Add more types as needed
`;

  await fs.writeFile(path.join(basePath, 'types.ts'), template);
}

async function generateActionExample(basePath: string, config: any) {
  const template = `import { IntegrationAction } from '../../../types';
import { z } from 'zod';

export const exampleAction: IntegrationAction = {
  id: 'example_action',
  name: 'Example Action',
  description: 'An example action for ${config.name}',
  
  inputSchema: z.object({
    message: z.string().describe('Message to send'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
  }),

  async execute(input, context) {
    const { credentials } = context;
    
    // TODO: Implement action logic
    // Example: Call ${config.name} API
    
    return {
      success: true,
      data: {
        success: true,
        id: 'example-id',
      },
    };
  },
};
`;

  await fs.writeFile(
    path.join(basePath, 'actions', 'example-action.ts'),
    template
  );
}

async function generateTriggerExample(basePath: string, config: any) {
  const template = `import { IntegrationTrigger } from '../../../types';
import { z } from 'zod';

export const exampleTrigger: IntegrationTrigger = {
  id: 'example_trigger',
  name: 'Example Trigger',
  description: 'Triggers when something happens in ${config.name}',
  
  outputSchema: z.object({
    id: z.string(),
    timestamp: z.string(),
  }),

  async subscribe(config, context) {
    // TODO: Setup webhook or polling
    return {
      success: true,
      webhookUrl: context.webhookUrl,
    };
  },

  async unsubscribe(config, context) {
    // TODO: Cleanup webhook or polling
    return {
      success: true,
    };
  },
};
`;

  await fs.writeFile(
    path.join(basePath, 'triggers', 'example-trigger.ts'),
    template
  );
}

async function generateReadme(basePath: string, config: any) {
  const template = `# ${config.name} Integration

## Overview
Integration with ${config.name} API.

## Authentication
Type: ${config.auth}

## Setup

### 1. Get API Credentials
1. Go to ${config.name} developer portal
2. Create a new app
3. Copy Client ID and Client Secret

### 2. Configure Environment
\`\`\`bash
${config.auth === 'oauth2' ? `
${config.slug.toUpperCase()}_CLIENT_ID=your_client_id
${config.slug.toUpperCase()}_CLIENT_SECRET=your_client_secret
${config.slug.toUpperCase()}_REDIRECT_URI=https://your-domain.com/api/v1/connections/callback
` : `
${config.slug.toUpperCase()}_API_KEY=your_api_key
`}
\`\`\`

## Available Actions

### \`example_action\`
Description of action.

**Input:**
\`\`\`json
{
  "message": "Hello World"
}
\`\`\`

**Output:**
\`\`\`json
{
  "success": true,
  "id": "msg_123"
}
\`\`\`

## Available Triggers

### \`example_trigger\`
Triggers when something happens.

## Testing

\`\`\`bash
npm run test:integration ${config.slug}
\`\`\`

## API Documentation
- [${config.name} API Docs](https://${config.slug}.com/docs)
`;

  await fs.writeFile(path.join(basePath, 'README.md'), template);
}

async function generateTests(basePath: string, config: any) {
  const template = `import { describe, it, expect } from 'vitest';
import ${config.slug}Integration from './index';

describe('${config.name} Integration', () => {
  it('should have correct metadata', () => {
    expect(${config.slug}Integration.metadata.slug).toBe('${config.slug}');
    expect(${config.slug}Integration.metadata.name).toBe('${config.name}');
  });

  it('should have actions defined', () => {
    expect(${config.slug}Integration.actions).toBeDefined();
    expect(Object.keys(${config.slug}Integration.actions).length).toBeGreaterThan(0);
  });

  // TODO: Add more tests
});
`;

  await fs.writeFile(path.join(basePath, 'index.test.ts'), template);
}

async function updateRegistry(config: any) {
  const registryPath = path.join(
    process.cwd(),
    'src/integrations/registry.ts'
  );
  
  let content = await fs.readFile(registryPath, 'utf-8');
  
  // Add import
  const importLine = `    import('./plugins/${config.slug}'),`;
  content = content.replace(
    'const integrationModules = [',
    `const integrationModules = [\n${importLine}`
  );
  
  await fs.writeFile(registryPath, content);
}

program.parse();
`;

  await fs.writeFile(
    path.join(process.cwd(), 'scripts/cli/generate-integration.ts'),
    template
  );
}

#### Update package.json
```json
{
  "scripts": {
    "generate:integration": "tsx scripts/cli/generate-integration.ts"
  }
}
```

#### Test the generator
```bash
npm run generate:integration -- --name="Test Integration" --category="productivity" --auth="oauth2"
```

---

### Day 2: Notion Integration

#### Setup Notion OAuth App
1. Go to https://www.notion.so/my-integrations
2. Create new integration
3. Get Client ID, Client Secret, and OAuth URLs

#### Generate Notion Integration
```bash
npm run generate:integration -- --name="Notion" --category="productivity" --auth="oauth2"
```

#### Implement Core Actions

**File**: `src/integrations/plugins/notion/actions/create-page.ts`
```typescript
import { IntegrationAction } from '../../../types';
import { z } from 'zod';

export const createPage: IntegrationAction = {
  id: 'create_page',
  name: 'Create Page',
  description: 'Create a new page in Notion',
  
  inputSchema: z.object({
    parent: z.object({
      database_id: z.string().optional(),
      page_id: z.string().optional(),
    }),
    properties: z.record(z.any()),
    children: z.array(z.any()).optional(),
  }),

  outputSchema: z.object({
    id: z.string(),
    url: z.string(),
    created_time: z.string(),
  }),

  async execute(input, context) {
    const { credentials } = context;
    
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        id: data.id,
        url: data.url,
        created_time: data.created_time,
      },
    };
  },
};
```

**File**: `src/integrations/plugins/notion/actions/query-database.ts`
```typescript
import { IntegrationAction } from '../../../types';
import { z } from 'zod';

export const queryDatabase: IntegrationAction = {
  id: 'query_database',
  name: 'Query Database',
  description: 'Query a Notion database',
  
  inputSchema: z.object({
    database_id: z.string(),
    filter: z.any().optional(),
    sorts: z.array(z.any()).optional(),
    page_size: z.number().max(100).optional(),
  }),

  outputSchema: z.object({
    results: z.array(z.any()),
    has_more: z.boolean(),
    next_cursor: z.string().nullable(),
  }),

  async execute(input, context) {
    const { credentials } = context;
    
    const response = await fetch(
      `https://api.notion.com/v1/databases/${input.database_id}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          filter: input.filter,
          sorts: input.sorts,
          page_size: input.page_size || 100,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        results: data.results,
        has_more: data.has_more,
        next_cursor: data.next_cursor,
      },
    };
  },
};
```

#### Add OAuth Configuration
**File**: `src/integrations/plugins/notion/auth.ts`
```typescript
import { IntegrationAuth } from '../../types';

export const notionAuth: IntegrationAuth = {
  type: 'oauth2',
  oauth2: {
    authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    scopes: [],
    clientId: process.env.NOTION_CLIENT_ID!,
    clientSecret: process.env.NOTION_CLIENT_SECRET!,
  },
};
```

---

### Day 3: Google Sheets Integration

#### Setup Google Cloud Project
1. Go to https://console.cloud.google.com
2. Create new project
3. Enable Google Sheets API
4. Create OAuth 2.0 credentials

#### Generate Integration
```bash
npm run generate:integration -- --name="Google Sheets" --category="productivity" --auth="oauth2"
```

#### Implement Actions

**File**: `src/integrations/plugins/google-sheets/actions/append-row.ts`
```typescript
import { IntegrationAction } from '../../../types';
import { z } from 'zod';

export const appendRow: IntegrationAction = {
  id: 'append_row',
  name: 'Append Row',
  description: 'Append a row to a Google Sheet',
  
  inputSchema: z.object({
    spreadsheetId: z.string(),
    range: z.string(),
    values: z.array(z.array(z.any())),
  }),

  outputSchema: z.object({
    spreadsheetId: z.string(),
    updatedRange: z.string(),
    updatedRows: z.number(),
  }),

  async execute(input, context) {
    const { credentials } = context;
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${input.spreadsheetId}/values/${input.range}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: input.values,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        spreadsheetId: data.spreadsheetId,
        updatedRange: data.updates.updatedRange,
        updatedRows: data.updates.updatedRows,
      },
    };
  },
};
```

**File**: `src/integrations/plugins/google-sheets/actions/read-range.ts`
```typescript
import { IntegrationAction } from '../../../types';
import { z } from 'zod';

export const readRange: IntegrationAction = {
  id: 'read_range',
  name: 'Read Range',
  description: 'Read data from a range in Google Sheets',
  
  inputSchema: z.object({
    spreadsheetId: z.string(),
    range: z.string(),
  }),

  outputSchema: z.object({
    range: z.string(),
    values: z.array(z.array(z.any())),
  }),

  async execute(input, context) {
    const { credentials } = context;
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${input.spreadsheetId}/values/${input.range}`,
      {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        range: data.range,
        values: data.values || [],
      },
    };
  },
};
```

---

### Day 4: Gmail Integration

#### Use same Google Cloud Project
- Gmail API is part of Google Workspace
- Add Gmail API scope to OAuth

#### Generate Integration
```bash
npm run generate:integration -- --name="Gmail" --category="communication" --auth="oauth2"
```

#### Implement Actions

**File**: `src/integrations/plugins/gmail/actions/send-email.ts`
```typescript
import { IntegrationAction } from '../../../types';
import { z } from 'zod';

export const sendEmail: IntegrationAction = {
  id: 'send_email',
  name: 'Send Email',
  description: 'Send an email via Gmail',
  
  inputSchema: z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string(),
    cc: z.string().email().optional(),
    bcc: z.string().email().optional(),
  }),

  outputSchema: z.object({
    id: z.string(),
    threadId: z.string(),
  }),

  async execute(input, context) {
    const { credentials } = context;
    
    // Create email in RFC 2822 format
    const email = [
      `To: ${input.to}`,
      input.cc ? `Cc: ${input.cc}` : '',
      input.bcc ? `Bcc: ${input.bcc}` : '',
      `Subject: ${input.subject}`,
      '',
      input.body,
    ].filter(Boolean).join('\n');

    // Base64url encode
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedEmail,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        id: data.id,
        threadId: data.threadId,
      },
    };
  },
};
```

---

### Day 5: Testing & Documentation

#### Create Integration Tests
**File**: `src/integrations/__tests__/integration.test.ts`
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { integrationRegistry, loadIntegrations } from '../registry';

describe('Integration Registry', () => {
  beforeAll(async () => {
    await loadIntegrations();
  });

  it('should load all integrations', () => {
    const integrations = integrationRegistry.list();
    expect(integrations.length).toBeGreaterThanOrEqual(4); // Slack + 3 new
  });

  it('should have Notion integration', () => {
    const notion = integrationRegistry.get('notion');
    expect(notion).toBeDefined();
    expect(notion?.metadata.name).toBe('Notion');
  });

  it('should have Google Sheets integration', () => {
    const sheets = integrationRegistry.get('google-sheets');
    expect(sheets).toBeDefined();
    expect(sheets?.actions.append_row).toBeDefined();
  });

  it('should have Gmail integration', () => {
    const gmail = integrationRegistry.get('gmail');
    expect(gmail).toBeDefined();
    expect(gmail?.actions.send_email).toBeDefined();
  });
});
```

#### Update Documentation
**File**: `docs/INTEGRATIONS.md`
```markdown
# Available Integrations

## Communication

### Slack
- Send messages
- Create channels
- Manage users

### Gmail
- Send emails
- Read emails
- Create drafts

## Productivity

### Notion
- Create pages
- Query databases
- Update pages

### Google Sheets
- Append rows
- Read ranges
- Update cells
```

---

### Day 6-7: Dashboard Updates & Polish

#### Add Integration Health Dashboard
**File**: `src/app/dashboard/integrations/health/page.tsx`
```typescript
export default async function IntegrationHealthPage() {
  const integrations = await prisma.integration.findMany({
    include: {
      _count: {
        select: {
          executions: true,
        },
      },
    },
  });

  const healthData = await Promise.all(
    integrations.map(async (integration) => {
      const last24h = await prisma.execution.count({
        where: {
          integrationId: integration.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      const failures = await prisma.execution.count({
        where: {
          integrationId: integration.id,
          status: 'failure',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      return {
        integration: integration.name,
        slug: integration.slug,
        executions24h: last24h,
        successRate: last24h > 0 ? ((last24h - failures) / last24h) * 100 : 100,
        status: failures / last24h > 0.1 ? 'degraded' : 'healthy',
      };
    })
  );

  return (
    <div>
      <h1>Integration Health</h1>
      <div className="grid gap-4">
        {healthData.map((data) => (
          <IntegrationHealthCard key={data.slug} data={data} />
        ))}
      </div>
    </div>
  );
}
```

---

## ✅ Week 1 Checklist

### Day 1
- [ ] Create CLI generator script
- [ ] Test generator with example integration
- [ ] Update package.json scripts

### Day 2
- [ ] Setup Notion OAuth app
- [ ] Generate Notion integration
- [ ] Implement create_page action
- [ ] Implement query_database action
- [ ] Test Notion integration

### Day 3
- [ ] Setup Google Cloud project
- [ ] Enable Sheets API
- [ ] Generate Google Sheets integration
- [ ] Implement append_row action
- [ ] Implement read_range action
- [ ] Test Sheets integration

### Day 4
- [ ] Enable Gmail API
- [ ] Generate Gmail integration
- [ ] Implement send_email action
- [ ] Implement read_email action
- [ ] Test Gmail integration

### Day 5
- [ ] Write integration tests
- [ ] Update documentation
- [ ] Test all 4 integrations end-to-end
- [ ] Fix any bugs

### Day 6-7
- [ ] Add integration health dashboard
- [ ] Polish UI/UX
- [ ] Add integration logos
- [ ] Update API documentation
- [ ] Prepare for Week 2

---

## 🎯 Success Criteria

By end of Week 1, you should have:
- ✅ CLI tool to generate integrations in 5 minutes
- ✅ 4 production-ready integrations (Slack, Notion, Sheets, Gmail)
- ✅ Integration health monitoring
- ✅ Comprehensive tests
- ✅ Updated documentation

---

## 🚀 Next Week Preview

**Week 2**: Build 7 more integrations
- HubSpot (CRM)
- Microsoft Teams (Communication)
- Discord (Communication)
- Trello (Productivity)
- Jira (Dev Tools)
- GitHub (Dev Tools)
- Airtable (Database)

**Target**: 11 total integrations by end of Week 2!

