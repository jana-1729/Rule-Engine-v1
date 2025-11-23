# Integration Platform - SaaS Integration & Workflow Automation

A scalable, enterprise-ready integration platform built with Next.js, similar to Zapier, Workato, and Refold.ai. Connect 1000+ integrations, build workflows, and automate data syncs with AI-assisted field mapping.

## 🚀 Features

### Core Capabilities
- **Modular Integration System**: Plugin architecture supporting 1000+ integrations
- **Visual Workflow Builder**: Drag-and-drop interface for creating workflows
- **AI-Assisted Mapping**: Intelligent field mapping suggestions using GPT-4
- **Scalable Execution**: Queue-based processing for millions of workflow executions
- **Real-time Logging**: Step-by-step execution traces with full observability
- **Multi-tenant**: Organization-level isolation with Row-Level Security

### Integrations (Extensible)
- Google Sheets
- Notion
- Slack
- HubSpot (coming soon)
- Salesforce (coming soon)
- Snowflake (coming soon)
- +1000 more (plugin architecture)

### Technical Highlights
- **Next.js 14** with App Router
- **Supabase** for auth, database, and RLS
- **Prisma** ORM for type-safe database access
- **Upstash Redis** for queue management
- **OpenAI GPT-4** for AI features
- **shadcn/ui** + TailwindCSS for beautiful UI
- **TypeScript** throughout

## 📁 Project Structure

```
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   │   ├── workflows/        # Workflow execution endpoints
│   │   │   ├── integrations/     # Integration management
│   │   │   └── ai/               # AI-assisted features
│   │   └── globals.css
│   │
│   ├── integrations/             # Integration Plugin System
│   │   ├── types.ts              # Core integration types
│   │   ├── registry.ts           # Integration registry
│   │   ├── base-integration.ts   # Base class for integrations
│   │   └── plugins/              # Individual integrations
│   │       ├── google-sheets/
│   │       ├── notion/
│   │       └── slack/
│   │
│   ├── workflows/                # Workflow Engine
│   │   ├── engine.ts             # Execution engine
│   │   ├── field-mapper.ts       # Field mapping with transformations
│   │   └── validator.ts          # Workflow validation
│   │
│   ├── services/                 # Backend Services
│   │   ├── queue-service.ts      # Redis-based job queue
│   │   ├── credential-service.ts # Secure credential management
│   │   ├── ai-service.ts         # AI-powered features
│   │   ├── metrics-service.ts    # Analytics & metrics
│   │   └── logging-service.ts    # Centralized logging
│   │
│   ├── workers/                  # Background Workers
│   │   └── execution-worker.ts   # Workflow execution worker
│   │
│   ├── ui/                       # UI Components
│   │   ├── components/           # shadcn components
│   │   └── workflow/             # Workflow-specific components
│   │
│   ├── lib/                      # Shared Libraries
│   │   ├── prisma.ts
│   │   ├── supabase.ts
│   │   ├── encryption.ts
│   │   └── utils.ts
│   │
│   └── db/
│       └── (generated Prisma client)
│
├── prisma/
│   └── schema.prisma             # Database schema
│
├── examples/
│   └── workflows/                # Example workflow definitions
│       ├── google-sheets-to-notion.json
│       ├── slack-notification.json
│       └── data-transformation.json
│
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL (via Supabase)
- Redis (via Upstash)
- OpenAI API Key

### 1. Clone and Install

```bash
git clone <your-repo>
cd Rule-Engine-v1
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
# Database
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis/Upstash
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# OpenAI
OPENAI_API_KEY=your_openai_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENCRYPTION_KEY=your_32_character_encryption_key
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

### 4. Run Development Server

```bash
# Start Next.js dev server
npm run dev

# In another terminal, start the worker
npm run worker:dev
```

The app will be available at `http://localhost:3000`

## 🔌 Adding New Integrations

Create a new integration in `src/integrations/plugins/your-integration/index.ts`:

```typescript
import { Integration } from '@/integrations/types';
import { z } from 'zod';

const metadata = {
  slug: 'your_integration',
  name: 'Your Integration',
  description: 'Description',
  category: 'productivity',
  icon: '/integrations/icon.svg',
  version: '1.0.0',
  authType: 'oauth2',
};

const yourIntegration: Integration = {
  metadata,
  auth: {
    type: 'oauth2',
    config: {
      authorizationUrl: '...',
      tokenUrl: '...',
      clientId: process.env.YOUR_CLIENT_ID,
      clientSecret: process.env.YOUR_CLIENT_SECRET,
      scopes: ['...'],
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/your-integration`,
    },
  },
  actions: {
    your_action: {
      id: 'your_action',
      name: 'Your Action',
      description: 'Description',
      inputSchema: z.object({ /* ... */ }),
      outputSchema: z.object({ /* ... */ }),
      async execute(input, credentials, context) {
        // Implementation
        return { success: true, data: {} };
      },
    },
  },
  triggers: {},
};

export default yourIntegration;
```

Then register it in `src/integrations/registry.ts`.

## 📊 Database Schema

### Core Tables

- **organizations**: Multi-tenant organization management
- **users**: User accounts with role-based access
- **integrations**: Available integrations catalog
- **connections**: OAuth tokens and API credentials (encrypted)
- **workflows**: Workflow definitions (JSON DSL)
- **workflow_executions**: Execution records with status
- **workflow_step_logs**: Step-by-step execution logs
- **ai_generated_mappings**: AI mapping suggestions
- **usage_metrics**: Usage tracking for billing
- **audit_logs**: Security and compliance logs
- **error_reports**: Error tracking and monitoring

### Scalability Features

- **Partitioning**: workflow_executions and workflow_step_logs partitioned by date
- **Indexing**: Optimized indexes on frequently queried fields
- **RLS**: Row-Level Security for multi-tenant isolation
- **Connection Pooling**: PgBouncer for production environments

## 🔄 Workflow JSON DSL

Example workflow definition:

```json
{
  "version": "1.0.0",
  "trigger": {
    "integration": "google_sheets",
    "trigger": "new_row",
    "config": { "spreadsheetId": "...", "sheetName": "Sheet1" },
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
        "mappings": [
          { "source": "$.row[0]", "target": "$.properties.Name.title[0].text.content" }
        ],
        "static": { "parent": { "database_id": "..." } }
      },
      "retry": { "maxAttempts": 3, "delay": "exponential" }
    }
  ],
  "settings": {
    "timeout": 30000,
    "errorHandling": { "strategy": "retry" }
  }
}
```

## 🤖 AI Features

### Field Mapping
```typescript
import { generateFieldMappings } from '@/services/ai-service';

const result = await generateFieldMappings(
  sourceSchema,
  targetSchema,
  organizationId,
  'Map CRM contacts to marketing platform'
);
// Returns: { mappings, confidence, explanation }
```

### Workflow Generation
```typescript
import { generateWorkflowFromDescription } from '@/services/ai-service';

const workflow = await generateWorkflowFromDescription(
  'When a new row is added to Google Sheets, create a Notion page',
  organizationId
);
```

## 📈 Metrics & Observability

### Dashboard Metrics
```typescript
import { getDashboardMetrics } from '@/services/metrics-service';

const metrics = await getDashboardMetrics(organizationId);
// Returns: totalWorkflows, executionsToday, successRate, etc.
```

### Execution Logs
All executions are fully traced with:
- Input/output data
- Step-by-step logs
- Error details
- Timing information
- Retry attempts

## 🔒 Security

- **Encryption**: AES-256-GCM for sensitive credentials
- **Row-Level Security**: Supabase RLS policies
- **Audit Logging**: All actions logged
- **Webhook Verification**: Signature validation
- **Rate Limiting**: Per-workflow and per-integration
- **OAuth Token Refresh**: Automatic token renewal

## 🚢 Deployment

### Vercel (Recommended for Next.js)

```bash
npm run build
vercel deploy
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Worker Deployment

Deploy the worker separately:

```bash
# On a server or container
npm run worker
```

## 📚 API Reference

### Execute Workflow
```
POST /api/workflows/execute
Body: { workflowId, triggerPayload, priority? }
```

### Get Executions
```
GET /api/workflows/:id/executions?limit=50&status=success
```

### List Integrations
```
GET /api/integrations?organizationId=...&category=productivity
```

### Generate Mapping (AI)
```
POST /api/ai/generate-mapping
Body: { sourceSchema, targetSchema, organizationId, context? }
```

## 🧪 Testing

```bash
# Run tests (add your test suite)
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your integration/feature
4. Submit a pull request

## 🆘 Support

- Documentation: [Coming soon]
- Issues: GitHub Issues
- Community: [Discord/Slack]

---

**Built with ❤️ for seamless integrations**

