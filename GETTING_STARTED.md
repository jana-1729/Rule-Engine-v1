# 🚀 Getting Started with Integration Platform

Welcome! This guide will help you understand and start using your new integration platform.

---

## 📖 Table of Contents

1. [What is this?](#what-is-this)
2. [Quick Setup (5 minutes)](#quick-setup)
3. [Project Overview](#project-overview)
4. [Your First Workflow](#your-first-workflow)
5. [Next Steps](#next-steps)

---

## What is this?

This is a **complete, production-ready integration platform** (like Zapier or Workato) that you can:

- ✅ Deploy to production today
- ✅ Scale to millions of users
- ✅ Customize completely
- ✅ Add unlimited integrations
- ✅ Self-host or use cloud

**What's included?**
- Full workflow automation engine
- 3 example integrations (Google Sheets, Notion, Slack)
- AI-powered field mapping (GPT-4)
- Queue-based job processing
- Real-time execution logs
- REST API
- React UI components
- Complete documentation

---

## Quick Setup

### Prerequisites
```bash
Node.js 18+  ✓
PostgreSQL   ✓  (or Supabase account)
Redis        ✓  (or Upstash account)
OpenAI Key   ✓  (for AI features)
```

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your credentials

# 3. Setup database
npm run db:generate
npm run db:push

# 4. Start development
npm run dev          # Terminal 1: Next.js
npm run worker:dev   # Terminal 2: Worker

# 5. Open browser
open http://localhost:3000
```

**Done!** You now have a running integration platform. 🎉

---

## Project Overview

### How It Works

```
┌─────────────┐
│    User     │  Creates workflow via UI or API
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│     Workflow Definition         │  JSON DSL
│  (trigger + steps + mappings)   │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│       Job Queue (Redis)         │  Queues execution
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│    Background Worker(s)         │  Processes jobs
│  - Fetches credentials          │
│  - Applies mappings             │
│  - Executes actions             │
│  - Logs everything              │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│   External APIs                 │  Google, Notion, Slack, etc.
│   (Google Sheets, Notion, etc)  │
└─────────────────────────────────┘
```

### Key Components

**1. Integration Plugins** (`src/integrations/`)
- Each integration is a standalone module
- Defines actions (e.g., "Create Row", "Send Message")
- Defines triggers (e.g., "New Row Added")
- Self-contained and versioned

**2. Workflow Engine** (`src/workflows/`)
- Executes workflows step-by-step
- Applies field mappings and transformations
- Handles errors and retries
- Logs everything

**3. Queue System** (`src/services/queue-service.ts`)
- Redis-based job queue
- Priority support
- Automatic retries
- Dead letter queue for failed jobs

**4. API** (`src/app/api/`)
- RESTful endpoints
- Execute workflows
- Get execution logs
- Manage integrations
- AI features

**5. UI Components** (`src/ui/`)
- Pre-built React components
- Integration cards
- Execution log viewers
- Workflow stats
- Built with shadcn/ui

---

## Your First Workflow

### Example: Google Sheets → Slack

Let's create a workflow that sends a Slack message when a new row is added to Google Sheets.

#### Step 1: Create Workflow

Create `my-workflow.json`:

```json
{
  "name": "Sheet to Slack",
  "description": "Notify Slack on new row",
  "version": "1.0.0",
  "trigger": {
    "integration": "google_sheets",
    "trigger": "new_row",
    "config": {
      "spreadsheetId": "YOUR_SHEET_ID",
      "sheetName": "Sheet1"
    },
    "connectionId": "YOUR_GOOGLE_CONNECTION_ID"
  },
  "steps": [
    {
      "id": "step-1",
      "name": "Send Slack Message",
      "integration": "slack",
      "action": "send_message",
      "connectionId": "YOUR_SLACK_CONNECTION_ID",
      "input": {
        "mappings": [
          {
            "source": "$.row[0]",
            "target": "$.text",
            "transform": {
              "type": "template",
              "config": {
                "template": "New row added: {{$.row[0]}}"
              }
            }
          }
        ],
        "static": {
          "channel": "#notifications"
        }
      }
    }
  ]
}
```

#### Step 2: Execute via API

```bash
# Execute workflow
curl -X POST http://localhost:3000/api/workflows/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "your-workflow-id",
    "triggerPayload": {
      "row": ["New Customer", "john@example.com", "Active"]
    }
  }'
```

#### Step 3: View Logs

```bash
# Get execution logs
curl http://localhost:3000/api/workflows/wf_123/executions
```

---

## Understanding the Codebase

### Adding a New Integration

1. Create `src/integrations/plugins/my-integration/index.ts`:

```typescript
import { Integration } from '@/integrations/types';
import { z } from 'zod';

const myIntegration: Integration = {
  metadata: {
    id: 'my_integration',
    slug: 'my_integration',
    name: 'My Integration',
    description: 'Connect to My Service',
    category: 'productivity',
    icon: '/integrations/my-icon.svg',
    version: '1.0.0',
    authType: 'api_key',
  },
  
  auth: {
    type: 'api_key',
    config: {
      headerName: 'X-API-Key',
    },
  },
  
  actions: {
    my_action: {
      id: 'my_action',
      name: 'My Action',
      description: 'Does something',
      inputSchema: z.object({
        field: z.string(),
      }),
      outputSchema: z.object({
        result: z.string(),
      }),
      async execute(input, credentials, context) {
        // Your logic here
        const response = await fetch('https://api.myservice.com/action', {
          headers: {
            'X-API-Key': credentials.data.apiKey,
          },
          body: JSON.stringify(input),
        });
        
        return {
          success: true,
          data: await response.json(),
        };
      },
    },
  },
  
  triggers: {},
};

export default myIntegration;
```

2. Add to registry in `src/integrations/registry.ts`:

```typescript
const integrationModules = [
  import('./plugins/google-sheets'),
  import('./plugins/notion'),
  import('./plugins/slack'),
  import('./plugins/my-integration'), // Add this
];
```

3. Done! Your integration is now available.

---

## Using AI Features

### AI Field Mapping

```typescript
import { generateFieldMappings } from '@/services/ai-service';

const result = await generateFieldMappings(
  // Source schema
  [
    { name: 'firstName', type: 'string' },
    { name: 'lastName', type: 'string' },
  ],
  // Target schema
  [
    { name: 'fullName', type: 'string' },
  ],
  'org-123',
  'Combine first and last name'
);

console.log(result.mappings);
// [{
//   source: '$.firstName',
//   target: '$.fullName',
//   transform: {
//     type: 'template',
//     config: { template: '{{$.firstName}} {{$.lastName}}' }
//   }
// }]
```

### AI Workflow Generation

```typescript
import { generateWorkflowFromDescription } from '@/services/ai-service';

const workflow = await generateWorkflowFromDescription(
  'When someone fills out a form, add them to Google Sheets and send a Slack notification',
  'org-123'
);

console.log(workflow);
// { name: '...', definition: { ... } }
```

---

## Next Steps

### 1. **Explore Examples**
- Check `examples/workflows/` for more workflow examples
- Study the 3 built-in integrations

### 2. **Read Documentation**
- `README.md` - Full overview
- `docs/ARCHITECTURE.md` - System design
- `docs/API.md` - API reference
- `docs/DEPLOYMENT.md` - Deploy to production

### 3. **Build Your Integration**
- Copy an existing integration as a template
- Implement your actions and triggers
- Test thoroughly
- Add to registry

### 4. **Customize UI**
- Components in `src/ui/`
- Built with shadcn/ui
- Fully customizable

### 5. **Deploy**
- Follow `docs/DEPLOYMENT.md`
- Recommended: Vercel + Railway
- Or Docker/Kubernetes

---

## Common Tasks

### Execute a Workflow
```typescript
import { workflowEngine } from '@/workflows/engine';

await workflowEngine.executeWorkflow(
  workflowId,
  organizationId,
  payload,
  'manual'
);
```

### Create a Connection
```typescript
import { createConnection } from '@/services/credential-service';

await createConnection({
  organizationId: 'org-123',
  integrationId: 'google_sheets',
  name: 'My Connection',
  credentials: { accessToken: '...' },
});
```

### Get Metrics
```typescript
import { getDashboardMetrics } from '@/services/metrics-service';

const metrics = await getDashboardMetrics('org-123');
console.log(metrics.successRate);
```

### Queue a Job
```typescript
import { enqueueWorkflow } from '@/services/queue-service';

const jobId = await enqueueWorkflow(
  workflowId,
  organizationId,
  payload,
  'webhook',
  { priority: 10 }
);
```

---

## Troubleshooting

### Issue: Database connection fails
```bash
# Test connection
psql $DATABASE_URL

# If using Supabase, check:
# 1. Project is not paused
# 2. Connection string includes password
# 3. SSL mode is correct
```

### Issue: Worker not processing
```bash
# Check queue
redis-cli -u $UPSTASH_REDIS_REST_URL
> ZCARD workflow:queue

# Check worker logs
npm run worker:dev

# Manually process one job
# (in worker terminal, it should auto-process)
```

### Issue: Integration not found
```bash
# Check registry
# Edit src/integrations/registry.ts
# Make sure your integration is imported

# Restart dev server
npm run dev
```

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │ Workflow   │  │Integration │  │ Dashboard  │    │
│  │ Builder    │  │  Gallery   │  │ & Logs     │    │
│  └────────────┘  └────────────┘  └────────────┘    │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│              API Layer (Next.js API Routes)           │
│  • POST /api/workflows/execute                       │
│  • GET  /api/workflows/:id/executions                │
│  • GET  /api/integrations                            │
│  • POST /api/ai/generate-mapping                     │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│                   Service Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ Queue        │  │ Credentials  │  │ AI       │  │
│  │ Service      │  │ Service      │  │ Service  │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│              Background Workers (Scalable)            │
│  • Dequeue jobs from Redis                           │
│  • Execute workflows                                 │
│  • Log results                                       │
│  • Handle retries                                    │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│                   Data Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ PostgreSQL   │  │ Redis        │  │ OpenAI   │  │
│  │ (Supabase)   │  │ (Upstash)    │  │ API      │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## Resources

### Documentation
- 📘 `README.md` - Main documentation
- 🚀 `QUICKSTART.md` - 5-minute setup
- 🏗️ `docs/ARCHITECTURE.md` - System design
- 🌐 `docs/API.md` - API reference
- 🚢 `docs/DEPLOYMENT.md` - Production deployment
- 📋 `PROJECT_SUMMARY.md` - Complete overview

### Code Examples
- `examples/workflows/` - Sample workflows
- `src/integrations/plugins/` - Integration examples

### External Links
- Next.js: https://nextjs.org
- Prisma: https://prisma.io
- Supabase: https://supabase.com
- shadcn/ui: https://ui.shadcn.com

---

## Support & Community

- 📧 **Email**: support@yourplatform.com
- 💬 **Discord**: [Coming soon]
- 🐛 **Issues**: GitHub Issues
- 📖 **Docs**: This repository

---

**Ready to build amazing integrations?** 

Start with the [Quick Setup](#quick-setup) above! 🚀

