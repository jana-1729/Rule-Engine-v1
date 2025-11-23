# API Reference

Base URL: `https://your-domain.com/api`

All API endpoints require authentication via Bearer token (JWT from Supabase Auth).

## Authentication

```bash
Authorization: Bearer <your-jwt-token>
```

---

## Workflows

### Execute Workflow

Execute a workflow manually.

**Endpoint**: `POST /workflows/execute`

**Request**:
```json
{
  "workflowId": "wf_abc123",
  "triggerPayload": {
    "customData": "value"
  },
  "triggerSource": "manual",
  "priority": 1
}
```

**Response**:
```json
{
  "success": true,
  "jobId": "job_xyz789",
  "message": "Workflow queued for execution"
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid request
- `404`: Workflow not found
- `500`: Server error

---

### Get Workflow Executions

Get execution history for a workflow.

**Endpoint**: `GET /workflows/:id/executions`

**Query Parameters**:
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)
- `status`: Filter by status (success, failed, running, pending)

**Example**:
```bash
GET /workflows/wf_abc123/executions?limit=10&status=success
```

**Response**:
```json
{
  "executions": [
    {
      "id": "exec_123",
      "workflowId": "wf_abc123",
      "status": "success",
      "startedAt": "2024-01-01T10:00:00Z",
      "finishedAt": "2024-01-01T10:00:05Z",
      "duration": 5000,
      "inputPayload": { ... },
      "outputPayload": { ... },
      "stepLogs": [...]
    }
  ],
  "stats": {
    "total": 1000,
    "success": 950,
    "failed": 50,
    "averageDuration": 4500
  },
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 1000,
    "hasMore": true
  }
}
```

---

### Create Workflow

Create a new workflow.

**Endpoint**: `POST /workflows`

**Request**:
```json
{
  "name": "New Workflow",
  "description": "Description here",
  "status": "draft",
  "definition": {
    "version": "1.0.0",
    "trigger": {
      "integration": "google_sheets",
      "trigger": "new_row",
      "config": { ... },
      "connectionId": "conn_123"
    },
    "steps": [
      {
        "id": "step-1",
        "name": "Create Notion Page",
        "integration": "notion",
        "action": "create_page",
        "connectionId": "conn_456",
        "input": {
          "mappings": [...],
          "static": { ... }
        }
      }
    ]
  }
}
```

**Response**:
```json
{
  "id": "wf_abc123",
  "name": "New Workflow",
  "status": "draft",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

---

### Update Workflow

**Endpoint**: `PATCH /workflows/:id`

**Request**: Same as create, but partial updates allowed

---

### Delete Workflow

**Endpoint**: `DELETE /workflows/:id`

**Response**:
```json
{
  "success": true,
  "message": "Workflow deleted"
}
```

---

## Integrations

### List Integrations

Get all available integrations.

**Endpoint**: `GET /integrations`

**Query Parameters**:
- `organizationId`: Your organization ID (required)
- `category`: Filter by category (optional)

**Example**:
```bash
GET /integrations?organizationId=org_123&category=productivity
```

**Response**:
```json
{
  "integrations": [
    {
      "id": "google_sheets",
      "slug": "google_sheets",
      "name": "Google Sheets",
      "description": "Read and write data to Google Sheets",
      "category": "productivity",
      "icon": "/integrations/google-sheets.svg",
      "version": "1.0.0",
      "authType": "oauth2",
      "isConnected": true,
      "connectionCount": 2,
      "connections": [
        {
          "id": "conn_123",
          "name": "My Google Account",
          "status": "active",
          "lastUsedAt": "2024-01-01T10:00:00Z"
        }
      ],
      "actions": [
        {
          "id": "append_row",
          "name": "Append Row",
          "description": "Append a new row to a sheet"
        }
      ],
      "triggers": [
        {
          "id": "new_row",
          "name": "New Row Added",
          "description": "Triggers when a new row is added"
        }
      ]
    }
  ],
  "grouped": [
    {
      "category": "productivity",
      "integrations": [...]
    }
  ],
  "total": 50
}
```

---

## Connections

### Create Connection

Create an OAuth connection to an integration.

**Endpoint**: `POST /connections`

**Request**:
```json
{
  "integrationId": "google_sheets",
  "name": "My Google Sheets",
  "credentials": {
    "accessToken": "token",
    "refreshToken": "refresh_token",
    "expiresAt": "2024-12-31T23:59:59Z"
  },
  "scopes": [
    "https://www.googleapis.com/auth/spreadsheets"
  ]
}
```

**Response**:
```json
{
  "id": "conn_123",
  "integrationId": "google_sheets",
  "name": "My Google Sheets",
  "status": "active",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

---

### Validate Connection

Test if a connection is still valid.

**Endpoint**: `POST /connections/:id/validate`

**Response**:
```json
{
  "valid": true,
  "message": "Connection is active"
}
```

---

### Delete Connection

**Endpoint**: `DELETE /connections/:id`

---

## AI Features

### Generate Field Mapping

Use AI to generate field mappings between schemas.

**Endpoint**: `POST /ai/generate-mapping`

**Request**:
```json
{
  "sourceSchema": [
    {
      "name": "firstName",
      "type": "string",
      "description": "User's first name"
    },
    {
      "name": "lastName",
      "type": "string"
    },
    {
      "name": "email",
      "type": "email"
    }
  ],
  "targetSchema": [
    {
      "name": "fullName",
      "type": "string",
      "description": "Full name of the person"
    },
    {
      "name": "emailAddress",
      "type": "email"
    }
  ],
  "organizationId": "org_123",
  "context": "Mapping signup form data to CRM contacts"
}
```

**Response**:
```json
{
  "success": true,
  "mappings": [
    {
      "source": "$.firstName",
      "target": "$.fullName",
      "transform": {
        "type": "template",
        "config": {
          "template": "{{$.firstName}} {{$.lastName}}"
        }
      }
    },
    {
      "source": "$.email",
      "target": "$.emailAddress"
    }
  ],
  "confidence": 0.95,
  "explanation": "Combined first and last name for fullName field. Email field mapped directly."
}
```

---

### Generate Workflow

Generate a workflow from natural language description.

**Endpoint**: `POST /ai/generate-workflow`

**Request**:
```json
{
  "description": "When a new row is added to Google Sheets, create a Notion page with the data",
  "organizationId": "org_123"
}
```

**Response**:
```json
{
  "name": "Google Sheets to Notion",
  "description": "Automatically create Notion pages from new Google Sheets rows",
  "definition": {
    "version": "1.0.0",
    "trigger": { ... },
    "steps": [ ... ]
  }
}
```

---

## Metrics & Analytics

### Get Dashboard Metrics

**Endpoint**: `GET /metrics/dashboard?organizationId=org_123`

**Response**:
```json
{
  "totalWorkflows": 50,
  "activeWorkflows": 45,
  "totalExecutions": 10000,
  "executionsToday": 150,
  "successRate": 98.5,
  "averageExecutionTime": 4500,
  "topIntegrations": [
    { "integration": "google_sheets", "count": 5000 },
    { "integration": "notion", "count": 3000 }
  ],
  "recentExecutions": [...],
  "failingWorkflows": [...]
}
```

---

### Get Workflow Metrics

**Endpoint**: `GET /metrics/workflow/:id`

**Response**:
```json
{
  "total": 1000,
  "successful": 980,
  "failed": 20,
  "running": 0,
  "successRate": 98.0,
  "averageDuration": 4500,
  "lastExecution": {
    "id": "exec_123",
    "status": "success",
    "startedAt": "2024-01-01T10:00:00Z"
  },
  "executionsByDay": [
    { "day": "2024-01-01", "success": 50, "failed": 1 }
  ]
}
```

---

## Webhooks

### Setup Webhook

Create a webhook endpoint for external triggers.

**Endpoint**: `POST /webhooks`

**Request**:
```json
{
  "workflowId": "wf_abc123",
  "events": ["*"]
}
```

**Response**:
```json
{
  "id": "webhook_123",
  "url": "https://your-domain.com/webhook/abc123xyz",
  "secret": "whsec_abc123",
  "status": "active"
}
```

**Using the Webhook**:
```bash
curl -X POST https://your-domain.com/webhook/abc123xyz \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: <hmac-sha256-signature>" \
  -d '{ "data": "your payload" }'
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional context"
  }
}
```

**Common Error Codes**:
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Missing or invalid auth token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server-side error

---

## Rate Limits

- **Standard**: 100 requests per minute
- **Burst**: 1000 requests per hour
- **Workflow Executions**: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Pagination

All list endpoints support pagination:

**Query Parameters**:
- `limit`: Items per page (max: 100)
- `offset`: Skip N items
- `cursor`: Cursor-based pagination (preferred)

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1000,
    "hasMore": true,
    "nextCursor": "abc123"
  }
}
```

---

## Filtering & Sorting

**Filter Syntax**:
```
GET /workflows?status=active&createdAt[gte]=2024-01-01
```

**Sort Syntax**:
```
GET /workflows?sort=-createdAt,name
```
(- prefix for descending)

---

## Webhooks Events

Subscribe to these events:

- `workflow.created`
- `workflow.updated`
- `workflow.deleted`
- `workflow.executed`
- `workflow.failed`
- `connection.created`
- `connection.expired`

---

## SDKs

### Node.js

```bash
npm install @integration-platform/sdk
```

```typescript
import { IntegrationPlatform } from '@integration-platform/sdk';

const client = new IntegrationPlatform({
  apiKey: 'your-api-key',
  baseUrl: 'https://your-domain.com/api'
});

const result = await client.workflows.execute({
  workflowId: 'wf_abc123',
  payload: { test: true }
});
```

### Python (Coming Soon)

```bash
pip install integration-platform
```

---

## Examples

See `examples/` directory for:
- Workflow definitions
- API usage examples
- Integration examples
- Webhook handlers

---

**Questions?** See [README.md](../README.md) or contact support.

