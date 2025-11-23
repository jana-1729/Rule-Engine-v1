# ⚡ Quickstart Guide

Get your integration platform running in 5 minutes!

## 1. Clone & Install

```bash
git clone <your-repo-url>
cd Rule-Engine-v1
npm install
```

## 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Minimum required for local development
DATABASE_URL="postgresql://user:pass@localhost:5432/integration_platform"
UPSTASH_REDIS_REST_URL="your_upstash_url"
UPSTASH_REDIS_REST_TOKEN="your_upstash_token"
OPENAI_API_KEY="your_openai_key"
ENCRYPTION_KEY="your-32-character-secret-key-here"
```

### Quick Setup Options:

**Option A: Supabase (Recommended)**
1. Go to https://supabase.com
2. Create a new project
3. Copy connection string to `DATABASE_URL`
4. Copy anon key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Option B: Local PostgreSQL**
```bash
# Install PostgreSQL
brew install postgresql@15  # macOS
# or
sudo apt install postgresql-15  # Linux

# Create database
createdb integration_platform
```

## 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

## 4. Run Development

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start worker
npm run worker:dev
```

Visit **http://localhost:3000** 🎉

## 5. Create Your First Workflow

### Via API:

```bash
# Create a simple workflow
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Workflow",
    "definition": {
      "version": "1.0.0",
      "trigger": {
        "integration": "webhook",
        "trigger": "http_request",
        "connectionId": "internal"
      },
      "steps": [
        {
          "id": "step-1",
          "name": "Log Message",
          "integration": "internal",
          "action": "log",
          "input": {
            "mappings": [],
            "static": { "message": "Hello World!" }
          }
        }
      ]
    }
  }'

# Execute the workflow
curl -X POST http://localhost:3000/api/workflows/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "your-workflow-id",
    "triggerPayload": { "test": true }
  }'
```

### Via Code:

```typescript
import { workflowEngine } from '@/workflows/engine';

const result = await workflowEngine.executeWorkflow(
  'workflow-id',
  'organization-id',
  { test: true },
  'manual'
);

console.log(result);
```

## 6. Add an Integration Connection

### Google Sheets Example:

1. Get OAuth credentials from Google Cloud Console
2. Add to `.env`:
```bash
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

3. Create connection:
```typescript
import { createConnection } from '@/services/credential-service';

await createConnection({
  organizationId: 'org-123',
  integrationId: 'google_sheets',
  name: 'My Google Sheets',
  credentials: {
    accessToken: 'token',
    refreshToken: 'refresh',
    expiresAt: new Date('2024-12-31')
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
```

## 7. Test AI Field Mapping

```typescript
import { generateFieldMappings } from '@/services/ai-service';

const result = await generateFieldMappings(
  [
    { name: 'firstName', type: 'string' },
    { name: 'lastName', type: 'string' },
    { name: 'email', type: 'email' }
  ],
  [
    { name: 'fullName', type: 'string' },
    { name: 'emailAddress', type: 'email' }
  ],
  'org-123',
  'Map user data from signup form to CRM'
);

console.log(result.mappings);
```

## Common Issues

### Database Connection Fails
```bash
# Test connection
psql $DATABASE_URL

# If fails, check:
# 1. PostgreSQL is running
# 2. Connection string is correct
# 3. Database exists
```

### Worker Not Processing Jobs
```bash
# Check Redis connection
redis-cli -u $UPSTASH_REDIS_REST_URL PING

# Check queue
redis-cli -u $UPSTASH_REDIS_REST_URL ZCARD workflow:queue

# Restart worker
npm run worker:dev
```

### OpenAI API Errors
```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# If fails, get new key from https://platform.openai.com/api-keys
```

## Next Steps

1. **Explore Examples**: Check `examples/workflows/` for sample workflows
2. **Read Docs**: See `docs/ARCHITECTURE.md` for system design
3. **Add Integrations**: Create custom integrations in `src/integrations/plugins/`
4. **Build UI**: Customize components in `src/ui/`
5. **Deploy**: Follow `docs/DEPLOYMENT.md` for production setup

## Helpful Commands

```bash
# Type checking
npm run type-check

# Database migrations
npm run db:migrate

# Clear all queues (careful!)
# In redis-cli:
# DEL workflow:queue workflow:processing workflow:scheduled workflow:dead_letter

# View logs
docker logs -f integration-platform-worker  # if using Docker
tail -f logs/worker.log  # if using PM2
```

## Project Structure Quick Reference

```
src/
├── app/              → Next.js pages & API routes
├── integrations/     → Integration plugins
├── workflows/        → Execution engine
├── services/         → Business logic
├── workers/          → Background jobs
├── ui/              → React components
└── lib/             → Utilities

Key Files:
- prisma/schema.prisma        → Database schema
- src/integrations/registry.ts → Integration loader
- src/workflows/engine.ts      → Workflow executor
- src/services/queue-service.ts → Job queue
```

## Need Help?

- 📖 Full docs: `README.md`
- 🏗️ Architecture: `docs/ARCHITECTURE.md`
- 🚀 Deployment: `docs/DEPLOYMENT.md`
- 💬 Issues: GitHub Issues
- 📧 Email: support@yourplatform.com

---

**Happy automating!** 🚀

