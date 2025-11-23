# 🚀 B2B2C Platform - Quick Start Guide

## What is This?

This is an **Embedded Integration Platform** (like Merge.dev or Prismatic) that allows **YOUR CUSTOMERS** to offer integrations to **THEIR USERS** without building each integration themselves.

### Real-World Example:

**Company X** (Your Customer) has a project management SaaS with 100+ users.

Instead of building Slack, Notion, Google Sheets integrations themselves, they:
1. Sign up with your platform
2. Get an `appId` and `apiKey`  
3. Call your API to offer integrations to their users
4. Their users connect their own Slack accounts
5. Company X calls your API (not Slack's) to send messages

**You handle**: OAuth flows, API calls, token storage, retries, logging
**Company X gets**: Simple API + dashboard to view logs

---

## Architecture

```
Your Platform (Rule-Engine)
  │
  ├── Account: Company X
  │     └── App: "X Product" (appId + apiKey)
  │           └── End Users: Company X's customers
  │                 └── Connections: Their Slack/Notion/etc
  │
  └── Account: Company Y
        └── App: "Y Platform" (appId + apiKey)
              └── End Users: ...
```

---

## Quick Setup (5 Minutes)

### 1. Install & Setup Database

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with database credentials

# Use the new schema
cp prisma/schema-v2.prisma prisma/schema.prisma

# Push to database
npm run db:generate
npm run db:push
```

### 2. Start Services

```bash
# Terminal 1: API Server
npm run dev

# Terminal 2: Background Worker
npm run worker:dev
```

### 3. Seed Integrations

```sql
-- Insert Slack integration
INSERT INTO integrations (id, slug, name, description, category, auth_type, auth_config, actions, status)
VALUES (
  'int_slack',
  'slack',
  'Slack',
  'Team communication platform',
  'communication',
  'oauth2',
  '{"authorizationUrl": "https://slack.com/oauth/v2/authorize", "tokenUrl": "https://slack.com/api/oauth.v2.access", "scopes": ["chat:write", "channels:read"]}'::json,
  '{"send_message": {"name": "Send Message", "description": "Send a message to a channel"}}'::json,
  'available'
);
```

---

## API Flow Example

### Step 1: Company X Signs Up

```bash
curl -X POST http://localhost:3000/api/v1/apps \
  -H "Content-Type: application/json" \
  -d '{
    "accountEmail": "admin@company-x.com",
    "accountPassword": "secure-password",
    "accountName": "Company X",
    "appName": "Company X Product",
    "webhookUrl": "https://company-x.com/webhooks/integrations"
  }'
```

**Response**:
```json
{
  "success": true,
  "app": {
    "appId": "app_abc123xyz",
    "apiKey": "app_abc123xyz_4f8h3j2k9l1m5n6p7q8r9s0t",
    "webhookSecret": "whsec_...",
    "name": "Company X Product"
  }
}
```

**⚠️ Save the `apiKey` - it's only shown once!**

### Step 2: Company X Lists Integrations

```bash
curl http://localhost:3000/api/v1/integrations \
  -H "X-API-Key: app_abc123xyz_4f8h3j2k9l1m5n6p7q8r9s0t"
```

**Response**:
```json
{
  "integrations": [
    {
      "slug": "slack",
      "name": "Slack",
      "authType": "oauth2",
      "connectedUsers": 0,
      "actions": [
        {"id": "send_message", "name": "Send Message"}
      ]
    }
  ]
}
```

### Step 3: End User Connects Slack

```bash
curl -X POST http://localhost:3000/api/v1/connections/authorize \
  -H "X-API-Key: app_abc123xyz_..." \
  -H "Content-Type: application/json" \
  -d '{
    "endUserId": "user-123-from-company-x",
    "integrationSlug": "slack",
    "redirectUri": "https://company-x.com/integrations/callback",
    "metadata": {
      "email": "john@example.com",
      "name": "John Doe"
    }
  }'
```

**Response**:
```json
{
  "authorizationUrl": "https://slack.com/oauth/v2/authorize?client_id=...&state=state_xyz",
  "state": "state_xyz"
}
```

**Flow**:
1. Company X redirects user to `authorizationUrl`
2. User authorizes Slack
3. Slack redirects to your callback
4. You exchange code for token, store it
5. You redirect back to Company X's `redirectUri`
6. Connection created! ✅

### Step 4: Company X Sends Slack Message

```bash
curl -X POST http://localhost:3000/api/v1/integrations/slack/actions/send_message \
  -H "X-API-Key: app_abc123xyz_..." \
  -H "Content-Type: application/json" \
  -d '{
    "endUserId": "user-123-from-company-x",
    "input": {
      "channel": "#general",
      "text": "Hello from Company X!"
    }
  }'
```

**Response**:
```json
{
  "success": true,
  "executionId": "exec_xyz789",
  "data": {
    "ok": true,
    "channel": "C123456",
    "ts": "1234567890.123456"
  },
  "duration": 234
}
```

### Step 5: Company X Views Logs

```bash
curl http://localhost:3000/api/v1/executions?limit=10 \
  -H "X-API-Key: app_abc123xyz_..."
```

**Response**:
```json
{
  "executions": [
    {
      "id": "exec_xyz789",
      "endUser": {
        "id": "user-123-from-company-x",
        "email": "john@example.com"
      },
      "integration": {"slug": "slack", "name": "Slack"},
      "action": "send_message",
      "status": "success",
      "duration": 234,
      "startedAt": "2024-01-01T10:00:00Z"
    }
  ],
  "stats": {
    "total": 100,
    "success": 98,
    "failed": 2
  }
}
```

---

## Company X's Integration Code

### Node.js/TypeScript Example

```typescript
// Company X's backend

import axios from 'axios';

const RULE_ENGINE_API_KEY = process.env.RULE_ENGINE_API_KEY!;
const BASE_URL = 'https://your-platform.com/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-API-Key': RULE_ENGINE_API_KEY,
  },
});

// List available integrations
export async function getIntegrations() {
  const { data } = await client.get('/integrations');
  return data.integrations;
}

// Start OAuth flow for user
export async function connectIntegration(
  userId: string,
  integration: string
) {
  const { data } = await client.post('/connections/authorize', {
    endUserId: userId,
    integrationSlug: integration,
    redirectUri: 'https://company-x.com/integrations/callback',
    metadata: {
      email: user.email,
      name: user.name,
    },
  });
  
  return data.authorizationUrl; // Redirect user here
}

// Send Slack message
export async function sendSlackMessage(
  userId: string,
  channel: string,
  text: string
) {
  const { data } = await client.post(
    '/integrations/slack/actions/send_message',
    {
      endUserId: userId,
      input: { channel, text },
    }
  );
  
  return data;
}

// Get execution logs
export async function getExecutions(filters = {}) {
  const { data } = await client.get('/executions', { params: filters });
  return data;
}
```

### React Component Example

```tsx
// Company X's frontend

import React, { useState, useEffect } from 'react';

export function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([]);
  
  useEffect(() => {
    fetch('/api/integrations') // Company X's API
      .then(res => res.json())
      .then(data => setIntegrations(data));
  }, []);

  const handleConnect = async (slug: string) => {
    // Get OAuth URL from your backend
    const response = await fetch('/api/integrations/connect', {
      method: 'POST',
      body: JSON.stringify({ integration: slug }),
    });
    
    const { authUrl } = await response.json();
    
    // Redirect to OAuth
    window.location.href = authUrl;
  };

  return (
    <div>
      <h1>Connect Integrations</h1>
      {integrations.map(integration => (
        <div key={integration.slug}>
          <img src={integration.logo} alt={integration.name} />
          <h3>{integration.name}</h3>
          <p>{integration.description}</p>
          <button onClick={() => handleConnect(integration.slug)}>
            Connect
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Adding New Integrations

### 1. Add Integration to Database

```sql
INSERT INTO integrations (id, slug, name, description, category, auth_type, auth_config, actions, status)
VALUES (
  'int_notion',
  'notion',
  'Notion',
  'All-in-one workspace',
  'productivity',
  'oauth2',
  '{"authorizationUrl": "https://api.notion.com/v1/oauth/authorize", "tokenUrl": "https://api.notion.com/v1/oauth/token", "scopes": []}'::json,
  '{"create_page": {"name": "Create Page", "description": "Create a new page"}}'::json,
  'available'
);
```

### 2. Implement Integration Plugin

```typescript
// src/integrations/plugins/notion/index.ts

import { Integration } from '@/integrations/types';
import { z } from 'zod';

const notionIntegration: Integration = {
  metadata: {
    id: 'int_notion',
    slug: 'notion',
    name: 'Notion',
    description: 'All-in-one workspace',
    category: 'productivity',
    icon: '/integrations/notion.svg',
    version: '1.0.0',
    authType: 'oauth2',
  },
  auth: {
    type: 'oauth2',
    config: {
      authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
      tokenUrl: 'https://api.notion.com/v1/oauth/token',
      clientId: process.env.NOTION_CLIENT_ID!,
      clientSecret: process.env.NOTION_CLIENT_SECRET!,
      scopes: [],
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/connections/callback`,
    },
  },
  actions: {
    create_page: {
      id: 'create_page',
      name: 'Create Page',
      description: 'Create a new page in Notion',
      inputSchema: z.object({
        parent: z.object({
          database_id: z.string(),
        }),
        properties: z.record(z.any()),
      }),
      outputSchema: z.object({
        id: z.string(),
        url: z.string(),
      }),
      async execute(input, credentials, context) {
        const response = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credentials.data.accessToken}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        });

        const data = await response.json();

        return {
          success: response.ok,
          data: { id: data.id, url: data.url },
        };
      },
    },
  },
  triggers: {},
};

export default notionIntegration;
```

### 3. Register in Registry

```typescript
// src/integrations/registry.ts

const integrationModules = [
  import('./plugins/google-sheets'),
  import('./plugins/notion'), // Add this
  import('./plugins/slack'),
];
```

---

## Dashboard for Company X

Build a dashboard at `/dashboard` where Company X can:

- ✅ View all executions across all their end users
- ✅ Filter by end user, integration, status, date
- ✅ See success/failure rates
- ✅ Monitor API usage
- ✅ Manage API keys
- ✅ Configure webhooks
- ✅ View billing

---

## Webhooks to Company X

When events occur, you send webhooks to Company X's `webhookUrl`:

### Event: Connection Created

```json
{
  "event": "connection.created",
  "timestamp": "2024-01-01T10:00:00Z",
  "data": {
    "connectionId": "conn_123",
    "endUserId": "user-123-from-company-x",
    "integration": "slack",
    "status": "active"
  }
}
```

### Event: Execution Failed

```json
{
  "event": "execution.failed",
  "timestamp": "2024-01-01T10:00:00Z",
  "data": {
    "executionId": "exec_xyz",
    "endUserId": "user-123-from-company-x",
    "integration": "slack",
    "action": "send_message",
    "error": {
      "code": "channel_not_found",
      "message": "Channel not found"
    }
  }
}
```

---

## Testing Locally

### 1. ngrok for OAuth Callbacks

OAuth providers need to redirect to a public URL. Use ngrok:

```bash
ngrok http 3000
```

Update `.env`:
```bash
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

### 2. Test OAuth Flow

1. Sign up Company X
2. Get API key
3. Call `/connections/authorize`
4. Open `authorizationUrl` in browser
5. Authorize
6. Check database for connection

### 3. Test API Call

```bash
curl -X POST http://localhost:3000/api/v1/integrations/slack/actions/send_message \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "endUserId": "test-user",
    "input": {"channel": "#test", "text": "Hello!"}
  }'
```

---

## Production Deployment

### 1. Environment Variables

```bash
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
ENCRYPTION_KEY=your-32-character-key
NEXT_PUBLIC_APP_URL=https://your-domain.com

# For each integration
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
NOTION_CLIENT_ID=...
NOTION_CLIENT_SECRET=...
```

### 2. Deploy

```bash
# Deploy to Vercel
vercel deploy --prod

# Deploy worker separately (Railway/Render)
# See docs/DEPLOYMENT.md
```

### 3. Configure OAuth Redirect URIs

In each integration's OAuth app settings, add:
```
https://your-domain.com/api/v1/connections/callback
```

---

## Pricing Model

Charge Company X based on:
- **Number of end users**: $0.50/user/month
- **Number of executions**: $0.001/execution
- **Number of integrations**: $10/integration/month
- **Support tier**: Basic/Pro/Enterprise

Track in `usage_metrics` table.

---

## Next Steps

1. ✅ Setup database and seed integrations
2. ✅ Test API flow end-to-end
3. 🔨 Build dashboard for Company X
4. 🔨 Add more integrations (Notion, Google Sheets, etc.)
5. 🔨 Implement webhook retry logic
6. 🔨 Add rate limiting
7. 🔨 Setup monitoring (Sentry, LogTail)
8. 🔨 Create SDK for Company X (npm package)
9. 🔨 Write integration guides
10. 🔨 Launch! 🚀

---

**You now have a B2B2C embedded integration platform!**

See `docs/B2B2C_ARCHITECTURE.md` for complete architecture details.

