# Adding New Integrations

## Overview

The platform is designed to make adding new integrations simple and scalable. Currently, we have **Slack** as our reference implementation. You can easily add more integrations following the same pattern.

## Integration Plugin Structure

Each integration is a self-contained plugin in:
```
src/integrations/plugins/[integration-name]/
└── index.ts
```

## How to Add a New Integration

### Step 1: Create Plugin File

Create a new folder and file:
```bash
mkdir -p src/integrations/plugins/notion
touch src/integrations/plugins/notion/index.ts
```

### Step 2: Define Integration

Use this template (example for Notion):

```typescript
import { Integration } from '@/integrations/types';

const notionIntegration: Integration = {
  metadata: {
    id: 'notion',
    name: 'Notion',
    description: 'Workspace for notes, docs, and collaboration',
    version: '1.0.0',
    category: 'productivity',
    logoUrl: 'https://notion.so/logo.png',
  },

  auth: {
    type: 'oauth2',
    config: {
      authUrl: 'https://api.notion.com/v1/oauth/authorize',
      tokenUrl: 'https://api.notion.com/v1/oauth/token',
      scopes: ['read_content', 'write_content'],
    },
  },

  actions: {
    create_page: {
      name: 'Create Page',
      description: 'Create a new page in Notion',
      input: {
        type: 'object',
        properties: {
          parent_id: { type: 'string', description: 'Parent page or database ID' },
          title: { type: 'string', description: 'Page title' },
          content: { type: 'string', description: 'Page content' },
        },
        required: ['parent_id', 'title'],
      },
      output: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          url: { type: 'string' },
        },
      },
      handler: async (input, context) => {
        // Implementation
        const response = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${context.credentials.access_token}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
          body: JSON.stringify({
            parent: { page_id: input.parent_id },
            properties: {
              title: [{ text: { content: input.title } }],
            },
            children: [
              {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                  rich_text: [{ text: { content: input.content } }],
                },
              },
            ],
          }),
        });

        const data = await response.json();

        return {
          id: data.id,
          url: data.url,
        };
      },
    },
  },

  triggers: {
    // Define triggers if needed
  },
};

export default notionIntegration;
```

### Step 3: Add OAuth Credentials to .env

```env
NOTION_CLIENT_ID="your-notion-client-id"
NOTION_CLIENT_SECRET="your-notion-client-secret"
NOTION_REDIRECT_URI="http://localhost:3000/api/v1/connections/callback"
```

### Step 4: Seed Database

Add the integration to your database:

```sql
-- Insert integration
INSERT INTO integrations (id, name, slug, description, version, status, category)
VALUES (
  gen_random_uuid(),
  'Notion',
  'notion',
  'Workspace for notes, docs, and collaboration',
  '1.0.0',
  'active',
  'productivity'
);

-- Get the integration ID
SELECT id FROM integrations WHERE slug = 'notion';

-- Insert auth method (replace <integration_id>)
INSERT INTO integration_auth_methods (id, integration_id, type, config)
VALUES (
  gen_random_uuid(),
  '<integration_id>',
  'oauth2',
  '{
    "authUrl": "https://api.notion.com/v1/oauth/authorize",
    "tokenUrl": "https://api.notion.com/v1/oauth/token",
    "scopes": ["read_content", "write_content"]
  }'
);

-- Insert action
INSERT INTO integration_actions (id, integration_id, name, slug, description, status)
VALUES (
  gen_random_uuid(),
  '<integration_id>',
  'Create Page',
  'create_page',
  'Create a new page in Notion',
  'active'
);
```

### Step 5: Auto-Discovery

The integration registry will automatically discover your new integration:

```typescript
// src/integrations/registry.ts automatically loads all plugins
```

### Step 6: Test

1. Restart the server
2. Visit dashboard → Integrations
3. You'll see Notion listed
4. Test OAuth flow
5. Execute actions via API

---

## Integration Categories

When adding integrations, use these categories:

- `communication` - Slack, Teams, Discord
- `productivity` - Notion, Google Workspace, Airtable
- `crm` - HubSpot, Salesforce, Pipedrive
- `development` - GitHub, GitLab, Jira
- `marketing` - Mailchimp, HubSpot, SendGrid
- `analytics` - Google Analytics, Mixpanel
- `payments` - Stripe, PayPal
- `storage` - Dropbox, Google Drive, AWS S3

---

## Authentication Types

### OAuth 2.0 (Most Common)

```typescript
auth: {
  type: 'oauth2',
  config: {
    authUrl: 'https://...',
    tokenUrl: 'https://...',
    scopes: ['scope1', 'scope2'],
  },
}
```

### API Key

```typescript
auth: {
  type: 'api_key',
  config: {
    header: 'Authorization',
    prefix: 'Bearer',
  },
}
```

### Basic Auth

```typescript
auth: {
  type: 'basic',
  config: {
    usernameField: 'username',
    passwordField: 'password',
  },
}
```

---

## Action Handler Context

Every action handler receives:

```typescript
handler: async (input, context) => {
  // context.credentials - OAuth tokens or API keys
  // context.endUserId - End user identifier
  // context.appId - App making the request
  // context.accountId - Account owner
  // context.logger - Structured logger
}
```

---

## Best Practices

### 1. Error Handling

```typescript
handler: async (input, context) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    context.logger.error('Action failed', { error, input });
    throw error;
  }
}
```

### 2. Token Refresh

OAuth tokens are automatically refreshed by the platform. Just use:

```typescript
const token = context.credentials.access_token;
```

### 3. Rate Limiting

Respect API rate limits:

```typescript
// Add delays for high-volume operations
await new Promise(resolve => setTimeout(resolve, 1000));
```

### 4. Validation

Use Zod for input validation:

```typescript
import { z } from 'zod';

const inputSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().optional(),
});

// Validate in handler
const validated = inputSchema.parse(input);
```

### 5. Logging

Log important events:

```typescript
context.logger.info('Creating page', { title: input.title });
context.logger.error('Failed to create page', { error });
```

---

## Testing New Integrations

### 1. Unit Test the Handler

```typescript
// test in isolation
const mockContext = {
  credentials: { access_token: 'test' },
  endUserId: 'user_123',
  logger: console,
};

const result = await action.handler(input, mockContext);
```

### 2. Test OAuth Flow

```bash
curl -X POST http://localhost:3000/api/v1/connections/authorize \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "endUserId": "test_user",
    "integrationSlug": "notion"
  }'
```

### 3. Test Action Execution

```bash
curl -X POST http://localhost:3000/api/v1/integrations/notion/actions/create_page \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "endUserId": "test_user",
    "input": {
      "parent_id": "abc123",
      "title": "Test Page"
    }
  }'
```

### 4. Check Logs

View execution in dashboard → Executions

---

## Roadmap for Common Integrations

### Phase 1 (MVP) - ✅ Complete
- [x] Slack

### Phase 2 (High Demand)
- [ ] Notion
- [ ] Google Sheets
- [ ] HubSpot

### Phase 3 (Popular)
- [ ] Microsoft Teams
- [ ] Salesforce
- [ ] GitHub
- [ ] Jira

### Phase 4 (Extended)
- [ ] Discord
- [ ] Linear
- [ ] Airtable
- [ ] Stripe
- [ ] Mailchimp

---

## Need Help?

- Check existing Slack integration as reference: `src/integrations/plugins/slack/`
- Review integration types: `src/integrations/types.ts`
- Test with minimal action first, then add more
- Use dashboard to monitor executions

**Adding integrations is designed to be easy!** Most integrations can be added in 30-60 minutes following this pattern.

