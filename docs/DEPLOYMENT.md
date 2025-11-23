# Deployment Guide - B2B2C Integration Platform

Complete guide to deploying your embedded integration platform to production.

---

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance
- Domain with SSL
- OAuth credentials for each integration

---

## Option 1: Vercel + Railway (Recommended)

### Step 1: Deploy API to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Step 2: Set Environment Variables in Vercel

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
ENCRYPTION_KEY=your-32-character-key

# Integration OAuth Credentials
SLACK_CLIENT_ID=xxx
SLACK_CLIENT_SECRET=xxx
NOTION_CLIENT_ID=xxx
NOTION_CLIENT_SECRET=xxx
```

### Step 3: Deploy Worker to Railway

Create `railway.toml`:
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run worker"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

Deploy:
```bash
railway up
```

---

## Option 2: Docker (Self-Hosted)

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL}
      - UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    depends_on:
      - postgres
      - redis

  worker:
    build: .
    command: npm run worker
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL}
      - UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: integration_platform
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Deploy:
```bash
docker-compose up -d
```

---

## Database Setup

### Option 1: Supabase (Recommended)

1. Create project at https://supabase.com
2. Get connection string
3. Run migrations:

```bash
npm run db:push
```

4. Enable RLS:

```sql
-- Enable Row-Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE end_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE end_user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Apps can only see their own data"
  ON executions FOR ALL
  USING (app_id IN (
    SELECT id FROM apps WHERE account_id = current_setting('app.current_account_id')::text
  ));
```

### Option 2: Self-Hosted PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql-15

# Create database
sudo -u postgres createdb integration_platform

# Run migrations
npm run db:push
```

---

## OAuth Configuration

For each integration, you need to:

1. Create OAuth app in provider's developer portal
2. Set redirect URI to: `https://your-domain.com/api/v1/connections/callback`
3. Add credentials to environment variables

### Slack

1. Go to https://api.slack.com/apps
2. Create new app
3. Add OAuth redirect URL: `https://your-domain.com/api/v1/connections/callback`
4. Get credentials:

```bash
SLACK_CLIENT_ID=xxx
SLACK_CLIENT_SECRET=xxx
```

### Notion

1. Go to https://www.notion.so/my-integrations
2. Create new integration
3. Get credentials:

```bash
NOTION_CLIENT_ID=xxx
NOTION_CLIENT_SECRET=xxx
```

### Google (Sheets, Calendar, etc.)

1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 Client ID
3. Add redirect URI
4. Get credentials:

```bash
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

---

## SSL Setup

### Option 1: Cloudflare (Easiest)

1. Add domain to Cloudflare
2. Point DNS to your server
3. Enable "Full (strict)" SSL mode
4. Done! Cloudflare handles SSL

### Option 2: Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Configure Nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Monitoring

### Health Check Endpoint

Add to your deployment:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
}
```

### Logging

Use Logtail or Datadog:

```bash
npm install @logtail/node

# In your code
import { Logtail } from '@logtail/node';
const logtail = new Logtail(process.env.LOGTAIL_TOKEN);
logtail.info('Server started');
```

### Metrics

Track:
- API request rate
- Execution success/failure rate
- Response times
- Queue depth
- Database connections

---

## Scaling

### Horizontal Scaling

**API Servers**:
- Vercel auto-scales
- For self-hosted: Use load balancer

**Workers**:
```yaml
# Scale to 5 workers
docker-compose up -d --scale worker=5
```

**Database**:
- Start: 2 GB RAM, 1 vCPU
- Production: 8 GB RAM, 4 vCPU
- Enable read replicas

### Caching

Use Redis to cache:
- Integration metadata
- App configurations
- Rate limit counters

---

## Backups

### Database

```bash
# Daily backups
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240101.sql
```

### Redis

Enable persistence in redis.conf:
```
appendonly yes
```

---

## Security Checklist

- [ ] SSL/TLS enabled
- [ ] Environment variables not in git
- [ ] API keys hashed in database
- [ ] OAuth tokens encrypted (AES-256)
- [ ] RLS policies enabled
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] Webhook signatures verified
- [ ] Security headers set
- [ ] Dependencies updated

---

## Production Checklist

- [ ] Database migrations run
- [ ] Environment variables set
- [ ] OAuth apps configured
- [ ] SSL certificates installed
- [ ] Workers deployed
- [ ] Health checks passing
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] DNS configured
- [ ] Rate limiting enabled
- [ ] Error tracking enabled

---

## Post-Deployment

1. Test OAuth flow with real integration
2. Create test account and execute actions
3. Monitor logs for errors
4. Check webhook delivery
5. Verify rate limiting works

---

**Your platform is production-ready!** 🚀

