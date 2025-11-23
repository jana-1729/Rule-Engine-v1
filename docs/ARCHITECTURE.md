# B2B2C Embedded Integration Platform Architecture

## Overview

This platform is a **B2B2C embedded integration service** where:
- **You** (Rule-Engine) provide the infrastructure
- **Your Customers** (Companies like "Company X") integrate your APIs into their product
- **Their End Users** (Company X's customers) connect their own Slack, Notion, etc.

## Business Model

```
Rule-Engine Platform
  │
  ├── Account: Company X (SaaS company)
  │     ├── App: "X Product" 
  │     │     ├── API Credentials: appId + apiKey
  │     │     └── End Users: 100+ customers of Company X
  │     │           ├── End User 1
  │     │           │     └── Connections: Slack, Notion
  │     │           └── End User 2
  │     │                 └── Connections: Google Sheets
  │     └── App: "X Mobile App"
  │           └── End Users: ...
  │
  └── Account: Company Y
        └── App: "Y Platform"
              └── End Users: ...
```

## Data Hierarchy

### Level 1: Account (Your Customer)
- The company that signs up for your service
- Email/password login for dashboard access
- Billing and subscription management
- Can have multiple apps

### Level 2: App (Their Product)
- Each account can create multiple apps (web, mobile, etc.)
- Each app gets unique `appId` and `apiKey`
- API credentials used to authenticate API calls
- Webhook URL for event notifications

### Level 3: End User (Their Customer)
- Company X's users (identified by external ID from Company X)
- Can connect multiple integrations
- Each end user's connections are isolated

### Level 4: Connection (End User's OAuth Token)
- Each end user can connect to Slack, Notion, etc.
- OAuth tokens stored encrypted
- Connection status tracked

### Level 5: Execution (API Call Log)
- Every action execution is logged
- Tracks which app, end user, and integration was used
- Success/failure status, duration, error details

## How It Works

### Step 1: Company X Signs Up

**Endpoint**: `POST /api/v1/apps`

```bash
curl -X POST https://your-platform.com/api/v1/apps \
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
  },
  "message": "Save your API key - it will not be shown again!"
}
```

Company X stores these credentials securely.

### Step 2: Company X Lists Available Integrations

**Endpoint**: `GET /api/v1/integrations`

```bash
curl https://your-platform.com/api/v1/integrations \
  -H "X-API-Key: app_abc123xyz_4f8h3j2k9l1m5n6p7q8r9s0t"
```

**Response**:
```json
{
  "integrations": [
    {
      "slug": "slack",
      "name": "Slack",
      "description": "Team communication",
      "logo": "https://...",
      "authType": "oauth2",
      "enabled": true,
      "connectedUsers": 45,
      "actions": [
        {
          "id": "send_message",
          "name": "Send Message",
          "description": "Send a message to a channel"
        }
      ]
    },
    {
      "slug": "notion",
      "name": "Notion",
      ...
    }
  ]
}
```

Company X displays these on their settings page.

### Step 3: End User Connects Slack

When End User clicks "Connect Slack" in Company X's app:

**Step 3a**: Company X initiates OAuth flow

```bash
curl -X POST https://your-platform.com/api/v1/connections/authorize \
  -H "X-API-Key: app_abc123xyz_..." \
  -H "Content-Type: application/json" \
  -d '{
    "endUserId": "user-789-from-company-x",
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
  "authorizationUrl": "https://slack.com/oauth/authorize?client_id=...&state=state_xyz",
  "state": "state_xyz",
  "expiresAt": "2024-01-01T10:10:00Z"
}
```

**Step 3b**: Company X redirects end user to `authorizationUrl`

**Step 3c**: User authorizes Slack

**Step 3d**: Slack redirects to:
```
https://your-platform.com/api/v1/connections/callback?code=xxx&state=state_xyz
```

**Step 3e**: Your platform:
- Exchanges code for access token
- Encrypts and stores token
- Creates connection record
- Sends webhook to Company X
- Redirects to Company X's `redirectUri`:

```
https://company-x.com/integrations/callback?success=true&connectionId=conn_123&integration=slack
```

**Step 3f**: Company X shows "Slack Connected!" ✅

### Step 4: Company X Sends Slack Message (Using Your API)

When Company X wants to send a Slack message for their user:

```bash
curl -X POST https://your-platform.com/api/v1/integrations/slack/actions/send_message \
  -H "X-API-Key: app_abc123xyz_..." \
  -H "Content-Type: application/json" \
  -d '{
    "endUserId": "user-789-from-company-x",
    "input": {
      "channel": "#general",
      "text": "Hello from Company X!"
    }
  }'
```

**Your platform**:
1. Verifies API key → gets App
2. Finds End User by external ID
3. Gets End User's Slack connection
4. Decrypts access token
5. Calls Slack API with user's token
6. Logs execution
7. Sends webhook to Company X

**Response**:
```json
{
  "success": true,
  "executionId": "exec_xyz789",
  "data": {
    "ok": true,
    "channel": "C123456",
    "ts": "1234567890.123456",
    "message": { ... }
  },
  "duration": 234
}
```

### Step 5: Company X Views Logs

```bash
curl https://your-platform.com/api/v1/executions?limit=10&status=success \
  -H "X-API-Key: app_abc123xyz_..."
```

**Response**:
```json
{
  "executions": [
    {
      "id": "exec_xyz789",
      "requestId": "exec_xyz789",
      "endUser": {
        "id": "user-789-from-company-x",
        "email": "john@example.com",
        "name": "John Doe"
      },
      "integration": {
        "slug": "slack",
        "name": "Slack",
        "logo": "https://..."
      },
      "action": "send_message",
      "status": "success",
      "input": { "channel": "#general", "text": "..." },
      "output": { "ok": true, ... },
      "startedAt": "2024-01-01T10:00:00Z",
      "finishedAt": "2024-01-01T10:00:01Z",
      "duration": 234
    }
  ],
  "stats": {
    "total": 1000,
    "success": 980,
    "failed": 20
  }
}
```

## Key Differences from Original Architecture

| Aspect | Original (Zapier Clone) | New (B2B2C Embedded) |
|--------|------------------------|----------------------|
| **Users** | Direct end users | Your B2B customers |
| **Authentication** | User login | API key per app |
| **OAuth** | Platform's OAuth credentials | End users' OAuth tokens |
| **API** | Internal only | Public API for customers |
| **Billing** | Per user | Per account/app |
| **Logs** | Per user | Per app (all their users) |
| **Branding** | Your brand | White-label capable |

## Database Schema Key Changes

### New Tables
- `accounts` - Your customers (Company X, Y, Z)
- `account_users` - Team members at each company
- `apps` - Each customer's products
- `app_integrations` - Which integrations each app enabled
- `end_users` - Company X's customers
- `end_user_connections` - End users' OAuth tokens
- `executions` - Every API call logged
- `oauth_states` - Secure OAuth flow tracking
- `api_key_versions` - Key rotation support
- `webhook_events` - Events sent to customers

### Key Relationships
```sql
Account (Company X)
  → App (X Product)
      → End User (X's customer)
          → End User Connection (Slack OAuth)
              → Execution (API call log)
```

## API Authentication

### Two Types of Auth

**1. Account Dashboard Auth** (Email/Password)
- For Company X admin to login to your dashboard
- Manage apps, view analytics, billing
- Uses session cookies

**2. API Key Auth** (appId + apiKey)
- For Company X's backend to call your APIs
- Included in `X-API-Key` header
- Never expires (but can be rotated)

## Webhooks to Company X

You send webhooks to Company X when events occur:

**Events**:
- `connection.created` - End user connected integration
- `connection.expired` - OAuth token expired
- `execution.success` - Action executed successfully
- `execution.failed` - Action failed

**Webhook Payload**:
```json
{
  "event": "execution.success",
  "timestamp": "2024-01-01T10:00:00Z",
  "data": {
    "executionId": "exec_xyz",
    "endUserId": "user-789-from-company-x",
    "integration": "slack",
    "action": "send_message",
    "status": "success",
    "duration": 234
  }
}
```

**Headers**:
```
Content-Type: application/json
X-Webhook-Secret: whsec_abc123...
```

## Billing Model

Company X pays based on:
- **Number of end users**
- **Number of API calls/executions**
- **Number of active connections**

Track usage with `usage_metrics` table.

## Multi-Integration Support

### OAuth2 Integrations (Slack, Notion, Google)
1. End user clicks "Connect" in Company X's app
2. Company X calls your `/authorize` endpoint
3. You return OAuth URL
4. User authorizes
5. You handle callback, store token
6. Company X can now use your API

### API Key Integrations (OpenAI, SendGrid)
1. End user provides their API key in Company X's app
2. Company X calls your API to save connection
3. You encrypt and store API key
4. Company X can now use your API

### No-Auth Integrations (HTTP webhooks)
1. No connection needed
2. Company X just calls your API
3. You execute the action

## Scalability

### Horizontal Scaling
- API servers: Load balanced
- Workers: Process executions from queue
- Database: Read replicas for analytics

### Performance
- Cache integration metadata (Redis)
- Batch log writes
- Async webhook delivery
- Connection pooling

### Limits
- Rate limit per app (default: 100 req/min)
- Execution timeout (default: 30s)
- Monthly execution limits per plan

## Security

### API Key Security
- API keys hashed before storage (SHA-256)
- Prefix stored for identification
- Can rotate keys
- Track last used timestamp

### OAuth Token Security
- Access tokens encrypted at rest (AES-256-GCM)
- Refresh tokens encrypted separately
- Automatic token refresh before expiry
- Revoke tokens on connection deletion

### Webhook Security
- Signature verification (HMAC-SHA256)
- Retry with exponential backoff
- Dead letter queue for failed webhooks

## Company X's Integration

### Their Backend Code

```typescript
// Company X's Node.js backend

const RULE_ENGINE_API_KEY = process.env.RULE_ENGINE_API_KEY;
const BASE_URL = 'https://your-platform.com/api/v1';

// List integrations to show in settings
async function getAvailableIntegrations() {
  const response = await fetch(`${BASE_URL}/integrations`, {
    headers: {
      'X-API-Key': RULE_ENGINE_API_KEY,
    },
  });
  return response.json();
}

// Start OAuth flow for user
async function connectIntegration(userId: string, integration: string) {
  const response = await fetch(`${BASE_URL}/connections/authorize`, {
    method: 'POST',
    headers: {
      'X-API-Key': RULE_ENGINE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      endUserId: userId,
      integrationSlug: integration,
      redirectUri: 'https://company-x.com/integrations/callback',
      metadata: {
        email: user.email,
        name: user.name,
      },
    }),
  });
  
  const { authorizationUrl } = await response.json();
  return authorizationUrl; // Redirect user here
}

// Send Slack message
async function sendSlackMessage(userId: string, channel: string, text: string) {
  const response = await fetch(
    `${BASE_URL}/integrations/slack/actions/send_message`,
    {
      method: 'POST',
      headers: {
        'X-API-Key': RULE_ENGINE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endUserId: userId,
        input: { channel, text },
      }),
    }
  );
  
  return response.json();
}

// Get execution logs
async function getExecutions(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${BASE_URL}/executions?${params}`, {
    headers: {
      'X-API-Key': RULE_ENGINE_API_KEY,
    },
  });
  return response.json();
}
```

## Dashboard for Company X

Company X logs into your dashboard at `https://your-platform.com/dashboard` to:
- View all executions across all their end users
- See success/failure rates
- Monitor which integrations are most used
- Manage API keys
- Configure webhooks
- View billing and usage

---

**This architecture allows Company X to offer Slack/Notion/etc integrations to their users WITHOUT building each integration themselves!**

