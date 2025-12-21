# Customer Integration Guide

<p align="center">
  <img src="rule-engine.png" alt="Integration Platform" width="200"/>
</p>

> Complete guide for integrating our B2B2C Integration Platform into your application

---

## 🎯 Overview

This platform allows you to offer integrations to your end users. Your users can:
- Connect their accounts (Slack, Notion, Google Sheets, etc.)
- Create workflows with field mapping
- Execute workflows from your application
- View execution logs

---

## 🚀 Quick Start

### 1. Get Your API Key

```bash
POST /api/v1/apps
{
  "name": "My Application",
  "description": "My awesome SaaS product"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "appId": "app_abc123",
    "apiKey": "app_xyz789...",
    "webhookUrl": "https://yourapp.com/webhooks"
  }
}
```

**⚠️ Important**: Save your API key securely. It will only be shown once!

---

## 📚 Core Concepts

### 1. **Integrations**
Available third-party services (Slack, Notion, etc.)

### 2. **Connections**
End user's authenticated connection to an integration

### 3. **Workflows**
Automation rules with field mapping

### 4. **Executions**
Workflow runs with input/output logs

---

## 🔌 API Endpoints

### List Available Integrations

```bash
GET /api/public/v1/integrations
Headers:
  X-API-Key: your-api-key

Query Parameters:
  - category: Filter by category (optional)
  - search: Search by name/description (optional)
```

Response:
```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "id": "int_123",
        "slug": "slack",
        "name": "Slack",
        "description": "Team communication platform",
        "category": "communication",
        "logo": "https://...",
        "authType": "oauth2",
        "connectedUsers": 42,
        "actions": [
          {
            "id": "send_message",
            "name": "Send Message",
            "description": "Send a message to a channel"
          }
        ]
      }
    ],
    "total": 10
  }
}
```

### Initiate Connection (OAuth)

```bash
POST /api/public/v1/connections/connect
Headers:
  X-API-Key: your-api-key
  Content-Type: application/json

Body:
{
  "integrationSlug": "slack",
  "endUserId": "user-123",
  "redirectUri": "https://yourapp.com/integrations/callback",
  "metadata": {
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "authUrl": "https://slack.com/oauth/authorize?...",
    "state": "random-state-token",
    "expiresAt": "2025-12-21T12:00:00Z"
  }
}
```

**Flow**:
1. Redirect user to `authUrl`
2. User authorizes
3. User is redirected to your `redirectUri` with `?success=true&connectionId=conn_123`

### List User Connections

```bash
GET /api/public/v1/connections/list?endUserId=user-123
Headers:
  X-API-Key: your-api-key
```

Response:
```json
{
  "success": true,
  "data": {
    "connections": [
      {
        "id": "conn_123",
        "integration": {
          "slug": "slack",
          "name": "Slack",
          "logo": "https://..."
        },
        "status": "active",
        "createdAt": "2025-12-21T10:00:00Z",
        "expiresAt": null
      }
    ],
    "total": 1
  }
}
```

### Disconnect Integration

```bash
POST /api/public/v1/connections/disconnect
Headers:
  X-API-Key: your-api-key
  Content-Type: application/json

Body:
{
  "connectionId": "conn_123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "connectionId": "conn_123",
    "integration": "slack",
    "status": "disconnected"
  }
}
```

### Create Workflow

```bash
POST /api/public/v1/workflows/create
Headers:
  X-API-Key: your-api-key
  Content-Type: application/json

Body:
{
  "name": "Send Slack notification on new user",
  "description": "Notify team when a user signs up",
  "integrationSlug": "slack",
  "action": "send_message",
  "fieldMapping": {
    "channel": "#general",
    "text": "New user: {{user.name}} ({{user.email}})"
  },
  "triggerType": "manual",
  "enabled": true
}
```

Response:
```json
{
  "success": true,
  "data": {
    "workflow": {
      "id": "wf_123",
      "name": "Send Slack notification on new user",
      "integration": {
        "slug": "slack",
        "name": "Slack"
      },
      "enabled": true,
      "createdAt": "2025-12-21T10:00:00Z"
    }
  }
}
```

### Execute Workflow

```bash
POST /api/public/v1/workflows/execute
Headers:
  X-API-Key: your-api-key
  Content-Type: application/json

Body:
{
  "workflowId": "wf_123",
  "endUserId": "user-123",
  "data": {
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "id": "user-123"
    }
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "executionId": "exec_123",
    "workflowId": "wf_123",
    "status": "running",
    "createdAt": "2025-12-21T10:00:00Z"
  }
}
```

### Get Execution Logs

```bash
GET /api/public/v1/executions/logs?endUserId=user-123&limit=20&offset=0
Headers:
  X-API-Key: your-api-key

Query Parameters:
  - endUserId: Filter by end user (required)
  - workflowId: Filter by workflow (optional)
  - status: Filter by status (optional)
  - limit: Number of results (default: 50)
  - offset: Pagination offset (default: 0)
```

Response:
```json
{
  "success": true,
  "data": {
    "executions": [
      {
        "id": "exec_123",
        "workflow": {
          "id": "wf_123",
          "name": "Send Slack notification"
        },
        "integration": {
          "slug": "slack",
          "name": "Slack"
        },
        "status": "success",
        "input": { "user": { "name": "John Doe" } },
        "output": { "ok": true, "ts": "1234567890.123456" },
        "logs": [
          {
            "timestamp": "2025-12-21T10:00:01Z",
            "level": "info",
            "message": "Executing action: send_message"
          }
        ],
        "createdAt": "2025-12-21T10:00:00Z",
        "completedAt": "2025-12-21T10:00:02Z"
      }
    ],
    "total": 1,
    "hasMore": false
  }
}
```

---

## 🎨 Embeddable UI Components

We provide React components you can embed in your application:

### 1. Integration Catalog

```tsx
import { IntegrationCatalog } from '@your-platform/react';

function IntegrationsPage() {
  return (
    <IntegrationCatalog
      apiKey="your-api-key"
      endUserId="user-123"
      onConnect={(integration) => {
        console.log('User connected:', integration.name);
      }}
    />
  );
}
```

### 2. Connection Manager

```tsx
import { ConnectionManager } from '@your-platform/react';

function SettingsPage() {
  return (
    <ConnectionManager
      apiKey="your-api-key"
      endUserId="user-123"
      onDisconnect={(connectionId) => {
        console.log('Disconnected:', connectionId);
      }}
    />
  );
}
```

### 3. Workflow Builder

```tsx
import { WorkflowBuilder } from '@your-platform/react';

function CreateWorkflowPage() {
  return (
    <WorkflowBuilder
      apiKey="your-api-key"
      integrationSlug="slack"
      onSave={(workflow) => {
        console.log('Workflow created:', workflow);
      }}
    />
  );
}
```

### 4. Execution Logs

```tsx
import { ExecutionLogs } from '@your-platform/react';

function LogsPage() {
  return (
    <ExecutionLogs
      apiKey="your-api-key"
      endUserId="user-123"
      workflowId="wf_123" // optional
    />
  );
}
```

---

## 💡 Field Mapping & Template Variables

When creating workflows, you can use template variables in field values:

```json
{
  "fieldMapping": {
    "channel": "#general",
    "text": "New order #{{order.id}} from {{user.name}} ({{user.email}}) - Total: ${{order.total}}"
  }
}
```

**Available Variables**:
- `{{user.name}}` - User's name
- `{{user.email}}` - User's email
- `{{user.id}}` - User's ID
- `{{order.id}}` - Order ID
- `{{order.total}}` - Order total
- Any custom data you pass in the `data` object

---

## 🔒 Security Best Practices

### 1. API Key Security
- Store API keys in environment variables
- Never commit keys to version control
- Rotate keys regularly (every 90 days)
- Use different keys for dev/staging/production

### 2. Webhook Verification
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const digest = hmac.digest('hex');
  return digest === signature;
}

app.post('/webhooks', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  
  if (!verifyWebhook(req.body, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(403).send('Invalid signature');
  }
  
  // Process webhook
  console.log('Event:', req.body.event);
  res.status(200).send('OK');
});
```

### 3. Rate Limiting
- Default: 100 requests/minute per API key
- Configurable in dashboard
- Returns `429 Too Many Requests` when exceeded

---

## 📊 Webhooks

Subscribe to events in your application:

### Available Events
- `connection.created` - User connected an integration
- `connection.revoked` - User disconnected an integration
- `workflow.created` - Workflow was created
- `execution.started` - Workflow execution started
- `execution.completed` - Workflow execution completed
- `execution.failed` - Workflow execution failed

### Webhook Payload
```json
{
  "event": "execution.completed",
  "timestamp": "2025-12-21T10:00:00Z",
  "data": {
    "executionId": "exec_123",
    "workflowId": "wf_123",
    "endUserId": "user-123",
    "status": "success",
    "duration": 1234
  }
}
```

---

## 🧪 Testing

### Test Mode
Use test API keys for development:
```bash
X-API-Key: test_abc123...
```

### Mock Integrations
We provide mock integrations for testing without real OAuth:
- `test-slack`
- `test-notion`
- `test-google-sheets`

---

## 📈 Monitoring & Analytics

### Dashboard Metrics
- Total executions
- Success/failure rates
- Average execution time
- Active connections
- Popular integrations

### API Response Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640095200
```

---

## 🆘 Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "INTEGRATION_NOT_FOUND",
    "message": "Integration 'invalid-slug' not found",
    "details": {}
  }
}
```

### Common Error Codes
- `MISSING_API_KEY` - API key not provided
- `INVALID_API_KEY` - API key is invalid or expired
- `INTEGRATION_NOT_FOUND` - Integration doesn't exist
- `CONNECTION_NOT_FOUND` - Connection doesn't exist
- `WORKFLOW_NOT_FOUND` - Workflow doesn't exist
- `VALIDATION_ERROR` - Invalid request data
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## 📞 Support

- **Documentation**: https://docs.yourplatform.com
- **API Status**: https://status.yourplatform.com
- **Email**: support@yourplatform.com
- **Slack Community**: https://community.yourplatform.com

---

## 🎓 Examples

### Complete Integration Flow

```javascript
// 1. List integrations
const integrations = await fetch('/api/public/v1/integrations', {
  headers: { 'X-API-Key': API_KEY }
});

// 2. Connect user to Slack
const connectResponse = await fetch('/api/public/v1/connections/connect', {
  method: 'POST',
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    integrationSlug: 'slack',
    endUserId: 'user-123',
    redirectUri: 'https://myapp.com/callback'
  })
});

const { authUrl } = await connectResponse.json();
window.location.href = authUrl; // Redirect to OAuth

// 3. After OAuth callback, create workflow
const workflow = await fetch('/api/public/v1/workflows/create', {
  method: 'POST',
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Notify on new order',
    integrationSlug: 'slack',
    action: 'send_message',
    fieldMapping: {
      channel: '#orders',
      text: 'New order from {{user.name}}: ${{order.total}}'
    }
  })
});

// 4. Execute workflow
const execution = await fetch('/api/public/v1/workflows/execute', {
  method: 'POST',
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    workflowId: workflow.id,
    endUserId: 'user-123',
    data: {
      user: { name: 'John Doe' },
      order: { total: 99.99 }
    }
  })
});

// 5. Check execution logs
const logs = await fetch('/api/public/v1/executions/logs?endUserId=user-123', {
  headers: { 'X-API-Key': API_KEY }
});
```

---

**Happy Integrating! 🚀**

