# 🔧 Environment Variables Setup Guide

Complete guide to setting up all required environment variables for the Rule Engine.

---

## 📋 Quick Start Checklist

### ✅ Required (Must Have)
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `ENCRYPTION_KEY` - 32-character encryption key
- [ ] `NEXTAUTH_SECRET` - NextAuth secret key
- [ ] `NEXT_PUBLIC_APP_URL` - Your application URL

### 🤖 AI Features (Recommended)
- [ ] `GOOGLE_GEMINI_API_KEY` - For AI-powered field mapping
- [ ] `GEMINI_MODEL` - Gemini model to use

### 🔌 Integration OAuth (As Needed)
- [ ] OAuth credentials for each integration you want to use

---

## 🚀 Step-by-Step Setup

### Step 1: Create `.env.local` File

```bash
# Copy the example file
cp .env.example .env.local
```

Or create manually:
```bash
touch .env.local
```

---

### Step 2: Set Required Variables

#### Database URL
```bash
# Local PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/rule_engine?schema=public

# Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?pgbouncer=true

# Railway
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

#### Generate Encryption Keys
```bash
# Generate ENCRYPTION_KEY (32 characters)
openssl rand -base64 32

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

Add to `.env.local`:
```bash
ENCRYPTION_KEY=your-generated-key-here
NEXTAUTH_SECRET=your-generated-secret-here
```

#### Application URLs
```bash
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# Production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
```

---

### Step 3: Setup AI Features (Optional but Recommended)

#### Get Gemini API Key (FREE!)

1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

Add to `.env.local`:
```bash
GOOGLE_GEMINI_API_KEY=AIza-your-key-here
GEMINI_MODEL=gemini-2.5-flash-lite-latest
```

**Free Tier Includes:**
- ✅ 15 requests/minute
- ✅ 1 million tokens/day
- ✅ 1,500 requests/day
- ✅ No credit card required!

---

### Step 4: Setup Integrations (As Needed)

Only add OAuth credentials for integrations you plan to use.

#### Slack

1. Go to: https://api.slack.com/apps
2. Create New App → From Scratch
3. Add OAuth Scopes:
   - `chat:write`
   - `channels:read`
   - `channels:manage`
   - `users:read`
4. Get Client ID & Secret

```bash
SLACK_CLIENT_ID=123456789.123456789
SLACK_CLIENT_SECRET=abc123def456ghi789
```

#### Google (Gmail, Sheets)

1. Go to: https://console.cloud.google.com/
2. Create Project
3. Enable APIs: Gmail API, Google Sheets API
4. Create OAuth 2.0 Credentials
5. Add Redirect URI: `http://localhost:3000/api/auth/callback/google`

```bash
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
```

#### Notion

1. Go to: https://www.notion.so/my-integrations
2. Create New Integration
3. Get OAuth Client ID & Secret

```bash
NOTION_CLIENT_ID=abc-123-def-456
NOTION_CLIENT_SECRET=secret_abc123def456
```

#### Microsoft Teams

1. Go to: https://portal.azure.com/
2. Azure Active Directory → App Registrations
3. New Registration
4. Add API Permissions: Microsoft Graph
   - `Channel.ReadWrite.All`
   - `ChannelMessage.Send`

```bash
MICROSOFT_CLIENT_ID=abc-123-def-456
MICROSOFT_CLIENT_SECRET=abc~123.def_456
```

#### Discord

1. Go to: https://discord.com/developers/applications
2. New Application
3. OAuth2 → Add Redirect
4. Get Client ID & Secret

```bash
DISCORD_CLIENT_ID=123456789012345678
DISCORD_CLIENT_SECRET=abc123def456ghi789
```

#### HubSpot

1. Go to: https://developers.hubspot.com/
2. Create App
3. Add Scopes: `crm.objects.contacts.read`, `crm.objects.contacts.write`

```bash
HUBSPOT_CLIENT_ID=abc-123-def-456
HUBSPOT_CLIENT_SECRET=abc123def456ghi789
```

#### Salesforce

1. Go to: https://developer.salesforce.com/
2. Setup → App Manager → New Connected App
3. Enable OAuth Settings

```bash
SALESFORCE_CLIENT_ID=abc123def456ghi789
SALESFORCE_CLIENT_SECRET=ABC123DEF456GHI789
```

#### Jira

1. Go to: https://developer.atlassian.com/console/myapps/
2. Create OAuth 2.0 Integration
3. Add Scopes: `read:jira-work`, `write:jira-work`

```bash
JIRA_CLIENT_ID=abc123def456ghi789
JIRA_CLIENT_SECRET=ABC123DEF456GHI789
```

#### GitHub

1. Go to: https://github.com/settings/developers
2. New OAuth App
3. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

```bash
GITHUB_CLIENT_ID=Iv1.abc123def456
GITHUB_CLIENT_SECRET=abc123def456ghi789jkl012mno345
```

#### Trello

1. Go to: https://trello.com/app-key
2. Get API Key
3. Generate Token

```bash
TRELLO_API_KEY=abc123def456ghi789
TRELLO_API_SECRET=abc123def456ghi789jkl012mno345
```

---

### Step 5: Optional Services

#### Email Notifications (SMTP)

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourapp.com
```

**Gmail App Password:**
1. Go to: https://myaccount.google.com/apppasswords
2. Generate App Password
3. Use that instead of your regular password

#### Redis (Caching & Queues)

```bash
# Local Redis
REDIS_URL=redis://localhost:6379

# Upstash Redis (Free Tier)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

Get Upstash: https://upstash.com/

---

## 🗄️ Database Setup

After setting up environment variables:

```bash
# 1. Generate Prisma Client
npm run db:generate

# 2. Push schema to database
npm run db:push

# 3. Seed integrations (IMPORTANT!)
npm run db:seed:integrations
```

**⚠️ Important:** You MUST run `npm run db:seed:integrations` to populate the integrations table. Without this, you'll get foreign key errors when creating workflows.

---

## ✅ Verify Setup

### Check Environment Variables

```bash
# Create a test script
cat > check-env.js << 'EOF'
const required = ['DATABASE_URL', 'ENCRYPTION_KEY', 'NEXTAUTH_SECRET', 'NEXT_PUBLIC_APP_URL'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required variables:', missing.join(', '));
  process.exit(1);
}

console.log('✅ All required environment variables are set!');

if (process.env.GOOGLE_GEMINI_API_KEY) {
  console.log('✅ AI features enabled (Gemini)');
} else {
  console.log('⚠️  AI features disabled (no Gemini API key)');
}
EOF

# Run the check
node -r dotenv/config check-env.js
```

### Test Database Connection

```bash
npm run test:connection
```

### Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

---

## 🐛 Troubleshooting

### Issue: "Foreign key constraint violated: workflows_integrationId_fkey"

**Cause:** Integrations table is empty

**Solution:**
```bash
npm run db:seed:integrations
```

### Issue: "AI service not available"

**Cause:** Missing or invalid Gemini API key

**Solution:**
1. Check `.env.local` has `GOOGLE_GEMINI_API_KEY`
2. Verify key starts with `AIza`
3. Restart dev server

### Issue: "Database connection failed"

**Cause:** Invalid `DATABASE_URL`

**Solution:**
1. Check database is running
2. Verify connection string format
3. Test with: `npm run test:connection`

### Issue: "OAuth redirect mismatch"

**Cause:** Redirect URI not configured in OAuth provider

**Solution:**
1. Add redirect URI in provider settings
2. Format: `{NEXT_PUBLIC_APP_URL}/api/auth/callback/{provider}`
3. Example: `http://localhost:3000/api/auth/callback/slack`

---

## 📝 Complete Example `.env.local`

```bash
# ==========================================
# CORE (REQUIRED)
# ==========================================
DATABASE_URL=postgresql://postgres:password@localhost:5432/rule_engine?schema=public
ENCRYPTION_KEY=abc123def456ghi789jkl012mno345pq
NEXTAUTH_SECRET=xyz789uvw456rst123opq890lmn567
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# ==========================================
# AI FEATURES (RECOMMENDED)
# ==========================================
GOOGLE_GEMINI_API_KEY=AIza-your-key-here
GEMINI_MODEL=gemini-2.5-flash-lite-latest

# ==========================================
# INTEGRATIONS (AS NEEDED)
# ==========================================
SLACK_CLIENT_ID=123456789.123456789
SLACK_CLIENT_SECRET=abc123def456ghi789

GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456

NOTION_CLIENT_ID=abc-123-def-456
NOTION_CLIENT_SECRET=secret_abc123def456

# ... add others as needed
```

---

## 🎯 Next Steps

1. ✅ Set up required environment variables
2. ✅ Run database migrations
3. ✅ Seed integrations
4. ✅ Start development server
5. ✅ Test AI features at `/dashboard/ai-demo`
6. ✅ Create your first workflow!

---

## 📚 Additional Resources

- **Gemini API**: https://ai.google.dev/
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Env Vars**: https://nextjs.org/docs/basic-features/environment-variables
- **OAuth Setup Guides**: See `docs/integrations/` for each integration

---

**Need Help?** Check the documentation or open an issue on GitHub.

