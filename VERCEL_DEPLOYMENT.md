# Vercel Deployment Guide

## ✅ Build Issues Fixed

All Vercel build issues have been resolved:

1. **Dynamic API Routes**: Added `export const dynamic = 'force-dynamic'` to all 30 API routes
2. **Prisma Lazy Loading**: Implemented Proxy-based lazy initialization to prevent database connections during build
3. **Build Scripts**: Added `postinstall` and updated build script to generate Prisma Client

## 🚀 Deployment Steps

### 1. Push Your Code

```bash
git add .
git commit -m "Fix: Vercel deployment issues - lazy load Prisma and dynamic API routes"
git push
```

### 2. Set Environment Variables in Vercel

Go to your Vercel project settings → Environment Variables and add:

#### Required Variables

```bash
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
ENCRYPTION_KEY=your-32-character-encryption-key
NEXTAUTH_SECRET=your-nextauth-secret-key
```

**For Supabase Database:**
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?pgbouncer=true
```

**Generate Secrets:**
```bash
# Generate ENCRYPTION_KEY (32 characters)
openssl rand -base64 32

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

#### Optional Variables

```bash
# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourapp.com

# Redis (for queues and caching)
REDIS_URL=redis://localhost:6379

# OpenAI (for AI features)
OPENAI_API_KEY=sk-...

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXTAUTH_URL=https://your-app.vercel.app

# Integration OAuth Credentials
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NOTION_CLIENT_ID=your-notion-client-id
NOTION_CLIENT_SECRET=your-notion-client-secret
```

### 3. Vercel Build Settings

These should be automatically detected, but verify:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x or higher

### 4. Deploy

#### Automatic Deployment
Push to your main/master branch - Vercel will automatically deploy.

#### Manual Deployment
```bash
vercel --prod
```

### 5. Post-Deployment Setup

After your first successful deployment:

1. **Run Database Migrations** (if needed):
   ```bash
   # Pull environment variables locally
   vercel env pull
   
   # Run migrations
   npm run db:push
   ```

2. **Seed Integrations**:
   ```bash
   npm run db:seed:integrations
   ```

3. **Verify Deployment**:
   - Visit your Vercel URL
   - Check `/api/health` (if you have one)
   - Test login/signup functionality

## 🔍 Troubleshooting

### Build Fails with Prisma Error

**Problem**: Prisma tries to connect to database during build

**Solution**: Already fixed! The Prisma client now uses lazy loading via Proxy.

### API Routes Return 500 Errors

**Problem**: Missing environment variables

**Solution**: 
1. Check Vercel dashboard → Settings → Environment Variables
2. Ensure `DATABASE_URL` and `ENCRYPTION_KEY` are set
3. Redeploy after adding variables

### Database Connection Errors

**Problem**: Invalid DATABASE_URL format

**Solution**: 
- For Supabase: Use connection pooling URL with `?pgbouncer=true`
- Ensure password is URL-encoded if it contains special characters
- Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`

### OAuth Integrations Not Working

**Problem**: Missing OAuth credentials or incorrect redirect URLs

**Solution**:
1. Add OAuth client IDs and secrets to Vercel environment variables
2. Update OAuth redirect URLs in provider dashboards:
   - Slack: `https://your-app.vercel.app/api/public/v1/connections/callback`
   - Google: `https://your-app.vercel.app/api/public/v1/connections/callback`
   - Notion: `https://your-app.vercel.app/api/public/v1/connections/callback`

## 📊 What Was Fixed

### 1. Prisma Client Initialization (`src/lib/prisma.ts`)

**Before:**
```typescript
export const prisma = new PrismaClient()
// ❌ Connects immediately at module load
```

**After:**
```typescript
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = globalForPrisma.prisma ?? getPrismaClient();
    return client[prop as keyof PrismaClient];
  },
});
// ✅ Only connects when first used
```

### 2. API Routes Dynamic Export

Added to all 30 API routes:
```typescript
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```

### 3. Build Scripts (`package.json`)

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

## ✅ Success Indicators

Your deployment is successful when:

- ✅ Build completes without errors
- ✅ All pages are accessible
- ✅ API routes respond correctly
- ✅ Database queries work
- ✅ Authentication works
- ✅ No console errors in browser

## 🎉 You're Done!

Your application is now successfully deployed on Vercel!

For support, check:
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

