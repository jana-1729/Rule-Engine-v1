# Deployment Guide

## Overview

This guide covers deploying the integration platform to production. The system consists of two main components:

1. **Next.js Application** (Frontend + API)
2. **Background Workers** (Job processing)

## Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Redis (Upstash recommended)
- OpenAI API key
- Domain name with SSL

## Deployment Options

### Option 1: Vercel + Separate Worker (Recommended)

**Pros**: Easy deployment, auto-scaling, zero-config
**Cons**: Workers need separate hosting

#### Step 1: Deploy Next.js to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy --prod

# Set environment variables in Vercel dashboard
```

Environment variables needed:
```
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
OPENAI_API_KEY
NEXT_PUBLIC_APP_URL
ENCRYPTION_KEY
```

#### Step 2: Deploy Worker

**Option A: Railway**

```yaml
# railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run worker",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Deploy:
```bash
railway up
```

**Option B: Render**

```yaml
# render.yaml
services:
  - type: worker
    name: workflow-worker
    env: node
    buildCommand: npm install
    startCommand: npm run worker
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
```

**Option C: AWS ECS**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "run", "worker"]
```

Deploy with Fargate for auto-scaling.

---

### Option 2: Docker Compose (Self-Hosted)

Full stack deployment with Docker.

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL}
      - UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL}
      - UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    deploy:
      replicas: 3  # Scale workers

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=integration_platform
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Dockerfile.worker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run db:generate

CMD ["npm", "run", "worker"]
```

Deploy:
```bash
docker-compose up -d
```

---

### Option 3: Kubernetes

For large-scale production deployments.

#### deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: integration-platform-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: integration-platform-app
  template:
    metadata:
      labels:
        app: integration-platform-app
    spec:
      containers:
      - name: app
        image: your-registry/integration-platform:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: integration-platform-worker
spec:
  replicas: 5
  selector:
    matchLabels:
      app: integration-platform-worker
  template:
    metadata:
      labels:
        app: integration-platform-worker
    spec:
      containers:
      - name: worker
        image: your-registry/integration-platform-worker:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: integration-platform-service
spec:
  selector:
    app: integration-platform-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

Deploy:
```bash
kubectl apply -f deployment.yaml
```

---

## Database Setup

### Supabase (Recommended)

1. Create a new project at https://supabase.com
2. Get your connection string
3. Run migrations:

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run migrations
npm run db:push
```

4. Enable Row-Level Security (RLS):

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can only access their organization's data"
  ON workflows
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Repeat for other tables...
```

### Self-Hosted PostgreSQL

```bash
# Install PostgreSQL
sudo apt-get install postgresql-15

# Create database
sudo -u postgres psql
CREATE DATABASE integration_platform;
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE integration_platform TO app_user;

# Run migrations
npm run db:migrate
```

---

## Redis Setup

### Upstash (Recommended)

1. Create a Redis database at https://upstash.com
2. Copy REST URL and token
3. Add to environment variables

### Self-Hosted Redis

```bash
# Install Redis
sudo apt-get install redis-server

# Configure for production
sudo nano /etc/redis/redis.conf

# Set:
# maxmemory 2gb
# maxmemory-policy allkeys-lru
# appendonly yes

# Restart
sudo systemctl restart redis
```

---

## SSL/TLS Setup

### Option 1: Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Configure Nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Cloudflare

1. Add domain to Cloudflare
2. Enable "Full (strict)" SSL mode
3. Point DNS to your server
4. Cloudflare handles SSL automatically

---

## Monitoring

### Health Checks

Add to your deployment:

```typescript
// pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
}
```

### Logging

Use a service like:
- **LogTail** (Recommended)
- **Datadog**
- **New Relic**

```bash
# Install LogTail
npm install @logtail/node

# In your app
import { Logtail } from '@logtail/node';
const logtail = new Logtail(process.env.LOGTAIL_TOKEN);
```

### Metrics

Use Prometheus + Grafana:

```yaml
# docker-compose.yml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## Scaling Guidelines

### Horizontal Scaling

**Workers**:
- Start with 3 workers
- Add 1 worker per 1000 executions/hour
- Monitor queue depth

**API**:
- Auto-scales on Vercel
- For self-hosted: Use load balancer

### Vertical Scaling

**Database**:
- Start: 2 GB RAM, 1 vCPU
- Production: 8 GB RAM, 4 vCPU
- Enable read replicas for analytics

**Workers**:
- Memory: 512 MB minimum
- CPU: 1 vCPU per 2 workers

---

## Backup Strategy

### Database

```bash
# Daily backups
pg_dump -U app_user -d integration_platform > backup_$(date +%Y%m%d).sql

# Restore
psql -U app_user -d integration_platform < backup_20240101.sql
```

### Redis

```bash
# Enable AOF persistence
CONFIG SET appendonly yes

# Backup
redis-cli BGSAVE
```

---

## Security Checklist

- [ ] Environment variables not committed to git
- [ ] SSL/TLS enabled
- [ ] Database credentials encrypted
- [ ] RLS policies enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Webhook signatures verified
- [ ] Regular security audits
- [ ] Dependencies updated
- [ ] Secrets rotated regularly

---

## Troubleshooting

### Workers not processing jobs

```bash
# Check worker logs
docker logs integration-platform-worker

# Check Redis queue
redis-cli
> ZCARD workflow:queue

# Manually trigger worker
npm run worker
```

### High latency

- Check database connection pool
- Enable caching (Redis)
- Optimize queries (add indexes)
- Scale workers horizontally

### Memory leaks

- Monitor with `top` or `htop`
- Use Node.js `--inspect` flag
- Check for unclosed connections

---

## Production Checklist

- [ ] Environment variables set
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Workers deployed and running
- [ ] Health checks passing
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] DNS configured
- [ ] Rate limiting enabled
- [ ] Error tracking enabled

---

**Your platform is now production-ready!** 🚀

