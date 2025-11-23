# API Reference - Embedded Integration Platform

Base URL: `https://your-platform.com/api/v1`

All API endpoints require authentication via API key in the `X-API-Key` header.

---

## Authentication

```bash
X-API-Key: app_abc123xyz_...
```

Get your API key by signing up at `POST /api/v1/apps`

---

## Endpoints

### 1. Create Account & App

Create an account and get your API credentials.

**Endpoint**: `POST /api/v1/apps`

**Request**:
```json
{
  "accountEmail": "admin@company.com",
  "accountPassword": "SecurePassword123!",
  "accountName": "Company Name",
  "appName": "Your Product Name",
  "appDescription": "Optional description",
  "webhookUrl": "https://your-domain.com/webhooks/integrations",
  "allowedOrigins": ["https://your-domain.com"]
}
```

**Response**:
```json
{
  "success": true,
  "account": {
    "id": "acc_123",
    "email": "admin@company.com",
    "name": "Company Name"
  },
  "app": {
    "id": "app_456",
    "appId": "app_abc123xyz",
    "apiKey": "app_abc123xyz_4f8h3j2k9l1m5n6p7q8r9s0t",
    "webhookSecret": "whsec_...",
    "name": "Your Product Name"
  },
  "message": "Save your API key - it will not be shown again!"
}
```

**⚠️ Important**: Save the `apiKey` securely - it's only shown once!

---

### 2. List Integrations

Get available integrations to display to your users.

**Endpoint**: `GET /api/v1/integrations`

**Query Parameters**:
- `category` (optional) - Filter by category: `communication`, `productivity`, `crm`, etc.
- `search` (optional) - Search by name or description

**Request**:
```bash
GET /api/v1/integrations?category=communication
Headers: X-API-Key: app_abc123xyz_...
```

**Response**:
```json
{
  "integrations": [
    {
      "id": "int_slack",
      "slug": "slack",
      "name": "Slack",
      "description": "Team communication platform",
      "category": "communication",
      "logo": "https://...",
      "color": "#4A154B",
      "website": "https://slack.com",
      "authType": "oauth2",
      "requiresEndUserAuth": true,
      "requiresAppAuth": false,
      "enabled": true,
      "connectedUsers": 45,
      "actions": [
        {
          "id": "send_message",
          "name": "Send Message",
          "description": "Send a message to a channel"
        },
        {
          "id": "create_channel",
          "name": "Create Channel",
          "description": "Create a new channel"
        }
      ],
      "triggers": []
    }
  ],
  "total": 100
}
```

---

### 3. Initiate OAuth Connection

Start OAuth flow for an end user to connect an integration.

**Endpoint**: `POST /api/v1/connections/authorize`

**Request**:
```json
{
  "endUserId": "user-123-from-your-system",
  "integrationSlug": "slack",
  "redirectUri": "https://your-domain.com/integrations/callback",
  "metadata": {
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Response** (OAuth2):
```json
{
  "authorizationUrl": "https://slack.com/oauth/authorize?client_id=...&state=state_xyz",
  "state": "state_xyz",
  "expiresAt": "2024-01-01T10:10:00Z"
}
```

**Response** (API Key):
```json
{
  "authType": "api_key",
  "state": "state_xyz",
  "instructions": "Please provide your API key",
  "fields": [
    {
      "name": "apiKey",
      "label": "API Key",
      "type": "password",
      "required": true
    }
  ]
}
```

**OAuth Flow**:
1. You call this endpoint
2. Redirect your user to `authorizationUrl`
3. User authorizes the integration
4. Integration provider redirects to our callback
5. We handle token exchange and storage
6. We redirect back to your `redirectUri` with `?success=true&connectionId=conn_123`

---

### 4. OAuth Callback (Handled Automatically)

**Endpoint**: `GET /api/v1/connections/callback`

This endpoint is called by OAuth providers (Slack, Notion, etc.) after user authorization. You don't call this directly.

**After successful connection**, we redirect back to your `redirectUri`:
```
https://your-domain.com/integrations/callback?success=true&connectionId=conn_123&integration=slack
```

---

### 5. Execute Integration Action

Execute an action for a specific end user.

**Endpoint**: `POST /api/v1/integrations/:slug/actions/:action`

**Examples**:
- `POST /api/v1/integrations/slack/actions/send_message`
- `POST /api/v1/integrations/notion/actions/create_page`
- `POST /api/v1/integrations/google_sheets/actions/append_row`

**Request**:
```json
{
  "endUserId": "user-123-from-your-system",
  "input": {
    "channel": "#general",
    "text": "Hello from our platform!"
  }
}
```

**Response** (Success):
```json
{
  "success": true,
  "executionId": "exec_xyz789",
  "data": {
    "ok": true,
    "channel": "C123456",
    "ts": "1234567890.123456",
    "message": {
      "text": "Hello from our platform!",
      "user": "U123456"
    }
  },
  "duration": 234
}
```

**Response** (Error):
```json
{
  "success": false,
  "executionId": "exec_xyz789",
  "error": {
    "code": "channel_not_found",
    "message": "Channel not found",
    "details": {}
  },
  "duration": 123
}
```

**Common Actions by Integration**:

**Slack**:
- `send_message` - Send a message to a channel
- `create_channel` - Create a new channel
- `get_user` - Get user information

**Notion**:
- `create_page` - Create a new page
- `update_page` - Update an existing page
- `query_database` - Query a database

**Google Sheets**:
- `append_row` - Append a row to a sheet
- `read_rows` - Read rows from a sheet
- `update_row` - Update a specific row

---

### 6. Get Executions (Logs)

View execution logs for debugging and monitoring.

**Endpoint**: `GET /api/v1/executions`

**Query Parameters**:
- `endUserId` (optional) - Filter by specific end user
- `integrationSlug` (optional) - Filter by integration
- `status` (optional) - Filter by status: `success`, `failed`, `pending`
- `action` (optional) - Filter by action name
- `startDate` (optional) - Filter from date (ISO 8601)
- `endDate` (optional) - Filter to date (ISO 8601)
- `limit` (optional) - Results per page (default: 50, max: 100)
- `offset` (optional) - Pagination offset

**Request**:
```bash
GET /api/v1/executions?limit=10&status=failed&integrationSlug=slack
Headers: X-API-Key: app_abc123xyz_...
```

**Response**:
```json
{
  "executions": [
    {
      "id": "exec_123",
      "requestId": "exec_123",
      "endUser": {
        "id": "user-123-from-your-system",
        "email": "user@example.com",
        "name": "John Doe"
      },
      "integration": {
        "slug": "slack",
        "name": "Slack",
        "logo": "https://..."
      },
      "action": "send_message",
      "status": "success",
      "input": {
        "channel": "#general",
        "text": "Hello!"
      },
      "output": {
        "ok": true,
        "channel": "C123456"
      },
      "error": null,
      "startedAt": "2024-01-01T10:00:00Z",
      "finishedAt": "2024-01-01T10:00:01Z",
      "duration": 234,
      "retryCount": 0
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 1000,
    "hasMore": true
  },
  "stats": {
    "total": 1000,
    "success": 980,
    "failed": 20,
    "pending": 0
  }
}
```

---

## Webhooks

You can receive webhooks when events occur. Configure your webhook URL when creating your app.

**Webhook Events**:

### connection.created
```json
{
  "event": "connection.created",
  "timestamp": "2024-01-01T10:00:00Z",
  "data": {
    "connectionId": "conn_123",
    "endUserId": "user-123-from-your-system",
    "integration": "slack",
    "status": "active"
  }
}
```

### connection.expired
```json
{
  "event": "connection.expired",
  "timestamp": "2024-01-01T10:00:00Z",
  "data": {
    "connectionId": "conn_123",
    "endUserId": "user-123-from-your-system",
    "integration": "slack"
  }
}
```

### execution.success
```json
{
  "event": "execution.success",
  "timestamp": "2024-01-01T10:00:00Z",
  "data": {
    "executionId": "exec_123",
    "endUserId": "user-123-from-your-system",
    "integration": "slack",
    "action": "send_message",
    "status": "success",
    "duration": 234
  }
}
```

### execution.failed
```json
{
  "event": "execution.failed",
  "timestamp": "2024-01-01T10:00:00Z",
  "data": {
    "executionId": "exec_123",
    "endUserId": "user-123-from-your-system",
    "integration": "slack",
    "action": "send_message",
    "status": "failed",
    "duration": 123,
    "error": {
      "code": "channel_not_found",
      "message": "Channel not found"
    }
  }
}
```

**Webhook Headers**:
```
Content-Type: application/json
X-Webhook-Secret: whsec_your_secret
```

**Verifying Webhooks**:
```typescript
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHash('sha256')
    .update(payload + secret)
    .digest('hex');
  
  return signature === expectedSignature;
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `401` | Invalid or missing API key |
| `403` | Integration not enabled for your app |
| `404` | Resource not found (integration, end user, connection) |
| `400` | Bad request (invalid input) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

**Error Response Format**:
```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional context"
  }
}
```

---

## Rate Limits

Default limits per app:
- **100 requests per minute**
- **10,000 executions per day**

Exceeded rate limits return `429` status with:
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

Headers on all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## SDK (Coming Soon)

```typescript
import { RuleEngine } from '@your-platform/sdk';

const client = new RuleEngine({ apiKey: 'app_abc123xyz_...' });

// List integrations
const integrations = await client.integrations.list();

// Start OAuth
const { authorizationUrl } = await client.connections.authorize({
  endUserId: 'user-123',
  integrationSlug: 'slack',
  redirectUri: 'https://your-domain.com/callback',
});

// Execute action
const result = await client.integrations.slack.sendMessage(
  'user-123',
  {
    channel: '#general',
    text: 'Hello!'
  }
);

// Get logs
const executions = await client.executions.list({
  limit: 10,
  status: 'failed',
});
```

---

## Example Integration

### Node.js/Express

```typescript
import express from 'express';
import axios from 'axios';

const app = express();
const API_KEY = process.env.RULE_ENGINE_API_KEY;
const BASE_URL = 'https://your-platform.com/api/v1';

// List integrations
app.get('/integrations', async (req, res) => {
  const response = await axios.get(`${BASE_URL}/integrations`, {
    headers: { 'X-API-Key': API_KEY },
  });
  res.json(response.data);
});

// Connect integration
app.post('/users/:userId/connect/:integration', async (req, res) => {
  const { userId, integration } = req.params;
  
  const response = await axios.post(
    `${BASE_URL}/connections/authorize`,
    {
      endUserId: userId,
      integrationSlug: integration,
      redirectUri: 'https://your-domain.com/integrations/callback',
      metadata: {
        email: req.user.email,
        name: req.user.name,
      },
    },
    {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
  
  res.json(response.data);
});

// Send Slack message
app.post('/users/:userId/slack/message', async (req, res) => {
  const { userId } = req.params;
  const { channel, text } = req.body;
  
  const response = await axios.post(
    `${BASE_URL}/integrations/slack/actions/send_message`,
    {
      endUserId: userId,
      input: { channel, text },
    },
    {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
  
  res.json(response.data);
});

// Webhook endpoint
app.post('/webhooks/integrations', (req, res) => {
  const signature = req.headers['x-webhook-secret'];
  
  // Verify signature
  // Handle event
  
  console.log('Received webhook:', req.body);
  res.sendStatus(200);
});

app.listen(3000);
```

---

## Testing

Use the provided test script:

```bash
chmod +x test-api-flow.sh
./test-api-flow.sh
```

Or test manually with curl:

```bash
# 1. Create app
curl -X POST http://localhost:3000/api/v1/apps \
  -H "Content-Type: application/json" \
  -d '{"accountEmail":"test@example.com","accountPassword":"Test123!","accountName":"Test Co","appName":"Test App"}'

# 2. List integrations
curl http://localhost:3000/api/v1/integrations \
  -H "X-API-Key: YOUR_API_KEY"

# 3. Execute action
curl -X POST http://localhost:3000/api/v1/integrations/slack/actions/send_message \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"endUserId":"test-user","input":{"channel":"#general","text":"Hello!"}}'
```

---

**Need help?** See [QUICKSTART.md](../QUICKSTART.md) or contact support@your-platform.com

