# Getting Started Guide

## 🚀 5-Minute Quick Start

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Setup Environment Variables

```bash
# Copy the template
cp .env.example .env

# Generate secure keys
openssl rand -base64 32  # For ENCRYPTION_KEY
openssl rand -base64 32  # For SESSION_SECRET
```

**Edit `.env` and add:**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/rule_engine"
REDIS_URL="redis://localhost:6379"
ENCRYPTION_KEY="paste-first-generated-key-here"
SESSION_SECRET="paste-second-generated-key-here"
```

📖 **Detailed setup**: See `ENV_SETUP_GUIDE.md`

### Step 3: Setup Database

```bash
# Push schema to database
npm run db:push
```

### Step 4: Start the Application

```bash
npm run dev
```

### Step 5: Visit Dashboard

```bash
open http://localhost:3000
```

---

## ✅ First Steps in Dashboard

### 1. Create Your Account
1. Click **"Get Started"**
2. Fill in:
   - Company Name: `Your Company`
   - Email: `you@company.com`
   - Password: `password123` (min 8 chars)
3. Click **"Create Account"**

You'll be automatically logged in and get a default app with API credentials!

### 2. Explore the Dashboard

Navigate through these sections:

**📊 Dashboard** - Overview with stats
- Total apps
- Executions count
- Connected users
- Success rate

**🔌 Integrations** - Available integrations
- View Slack integration
- See available actions
- Monitor connections

**⚡ Workflows** - Visual workflow builder
- Create new workflow
- Drag-and-drop nodes
- Connect Slack actions

**📝 Executions** - Logs and monitoring
- View all API executions
- Filter by status, integration, app
- See detailed logs with errors

**📱 Apps** - API key management
- Create new apps
- Get API credentials
- View app stats

**⚙️ Settings** - Account management
- Update company name
- Change password
- Manage account

---

## 🔑 Get Your API Credentials

### Option 1: Use Default App (Auto-created)

When you signed up, a default app was created. To find your credentials:

1. Go to **Apps** page
2. See your app listed
3. Click **"Manage"**
4. Your **App ID** is shown
5. **API Key** was shown once on signup (you'll need to create a new app if you didn't save it)

### Option 2: Create New App

1. Go to **Apps** page
2. Click **"+ Create App"**
3. Enter app name: `Production`
4. Click **"Create App"**
5. **Save the API Key!** (shown only once)

You'll get:
- **App ID**: `app_xxxxxxxxxxxxxxxx`
- **API Key**: `ak_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 🔌 Setup Your First Integration (Slack)

### 1. Create Slack App

1. Go to https://api.slack.com/apps
2. Click **"Create New App"** → **"From scratch"**
3. Enter app name: `My Integration Platform`
4. Select your workspace
5. Click **"Create App"**

### 2. Configure OAuth

1. In sidebar, click **"OAuth & Permissions"**
2. Scroll to **"Redirect URLs"**
3. Add: `http://localhost:3000/api/v1/connections/callback`
4. Click **"Save URLs"**

### 3. Add Scopes

Scroll to **"Scopes"** → **"Bot Token Scopes"**, add:
- `chat:write`
- `channels:read`
- `users:read`
- `team:read`

### 4. Get Credentials

1. Go to **"Basic Information"**
2. Scroll to **"App Credentials"**
3. Copy **Client ID** and **Client Secret**

### 5. Add to .env

```env
SLACK_CLIENT_ID="1234567890.1234567890123"
SLACK_CLIENT_SECRET="abcdef1234567890abcdef1234567890"
SLACK_REDIRECT_URI="http://localhost:3000/api/v1/connections/callback"
```

### 6. Restart Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### 7. Seed Slack Integration in Database

Run this SQL in your database:

```sql
-- Insert Slack integration
INSERT INTO integrations (id, name, slug, description, version, status, category)
VALUES (
  gen_random_uuid(),
  'Slack',
  'slack',
  'Team communication and collaboration platform',
  '1.0.0',
  'active',
  'communication'
);

-- Get the integration ID
SELECT id, name FROM integrations WHERE slug = 'slack';

-- Insert auth method (replace <integration_id> with the ID from above)
INSERT INTO integration_auth_methods (id, integration_id, type, config)
VALUES (
  gen_random_uuid(),
  '<integration_id>',
  'oauth2',
  '{
    "authUrl": "https://slack.com/oauth/v2/authorize",
    "tokenUrl": "https://slack.com/api/oauth.v2.access",
    "scopes": ["chat:write", "channels:read", "users:read", "team:read"]
  }'
);

-- Insert send_message action
INSERT INTO integration_actions (id, integration_id, name, slug, description, status)
VALUES (
  gen_random_uuid(),
  '<integration_id>',
  'Send Message',
  'send_message',
  'Send a message to a Slack channel',
  'active'
);
```

---

## 🧪 Test the API

### 1. List Integrations

```bash
curl -X GET http://localhost:3000/api/v1/integrations \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-App-ID: YOUR_APP_ID"
```

Expected response:
```json
{
  "integrations": [
    {
      "id": "...",
      "name": "Slack",
      "slug": "slack",
      "version": "1.0.0",
      "category": "communication"
    }
  ]
}
```

### 2. Authorize End User (Get OAuth URL)

```bash
curl -X POST http://localhost:3000/api/v1/connections/authorize \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-App-ID: YOUR_APP_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "endUserId": "user_123",
    "integrationSlug": "slack",
    "redirectUrl": "http://localhost:3000/dashboard"
  }'
```

Expected response:
```json
{
  "authorizationUrl": "https://slack.com/oauth/v2/authorize?client_id=..."
}
```

### 3. Complete OAuth Flow

1. Open the `authorizationUrl` in browser
2. Click **"Allow"** to connect
3. You'll be redirected back
4. Connection is now active!

### 4. Execute Action (Send Slack Message)

```bash
curl -X POST http://localhost:3000/api/v1/integrations/slack/actions/send_message \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-App-ID: YOUR_APP_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "endUserId": "user_123",
    "input": {
      "channel": "#general",
      "text": "Hello from Rule Engine!"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "executionId": "exec_...",
  "result": {
    "ok": true,
    "message": "Message sent successfully"
  }
}
```

### 5. View Execution in Dashboard

1. Go to **Executions** page
2. See your API call logged
3. Filter by integration or status
4. View details and duration

---

## 📁 Project Structure

```
Rule-Engine-v1/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── (auth)/            # Login/signup
│   │   ├── dashboard/         # Dashboard pages
│   │   └── api/               # API routes
│   │       ├── auth/          # Auth endpoints
│   │       ├── dashboard/     # Dashboard APIs
│   │       └── v1/            # B2B2C API
│   ├── ui/                    # React components
│   │   ├── components/        # Base components
│   │   ├── dashboard/         # Dashboard components
│   │   └── workflow/          # Workflow builder
│   ├── lib/                   # Utilities
│   │   ├── prisma.ts          # Database client
│   │   ├── session.ts         # Auth session
│   │   ├── auth.ts            # API key auth
│   │   └── encryption.ts      # Token encryption
│   ├── integrations/          # Integration plugins
│   │   ├── plugins/
│   │   │   └── slack/         # Slack integration
│   │   └── registry.ts        # Integration loader
│   └── services/              # Backend services
│       ├── credential-service.ts
│       ├── logging-service.ts
│       └── queue-service.ts
├── prisma/
│   └── schema.prisma          # Database schema
├── .env.example               # Environment template
├── ENV_SETUP_GUIDE.md        # This guide
└── README.md                  # Project overview
```

---

## 🎯 Common Use Cases

### Use Case 1: SaaS Company Wants Slack Integration

**Traditional way:** 18 weeks of development
**With your platform:** 1 week

**Steps:**
1. Company X signs up
2. Gets API credentials
3. Integrates your API
4. Their users connect Slack
5. Company X sends messages via your API
6. You handle OAuth, tokens, rate limiting, errors

### Use Case 2: Project Management Tool + 50 Integrations

**Traditional way:** 2 years, 5 engineers
**With your platform:** 1 month, 1 engineer

**Steps:**
1. Integrate your API once
2. All 50 integrations work the same way
3. Add new integrations without code changes
4. Full observability via dashboard

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `ENV_SETUP_GUIDE.md` | Environment variables setup |
| `GETTING_STARTED.md` | This file - first steps |
| `README.md` | Project overview |
| `docs/API_REFERENCE.md` | Complete API docs |
| `docs/DEPLOYMENT.md` | Production deployment |
| `.cursorrules` | Development standards |

---

## 🆘 Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### "Redis connection failed"
```bash
# Check Redis is running
redis-cli ping  # Should return "PONG"

# Verify REDIS_URL in .env
cat .env | grep REDIS_URL
```

### "Session not working"
```bash
# Check SESSION_SECRET is set
cat .env | grep SESSION_SECRET

# Regenerate if needed
openssl rand -base64 32
```

### "OAuth callback not working"
- Check redirect URI matches in Slack app settings
- Verify `SLACK_REDIRECT_URI` in `.env`
- Ensure server is running on correct port

### "Encryption key invalid"
```bash
# Must be exactly 32 bytes
openssl rand -base64 32

# Copy to ENCRYPTION_KEY in .env (no quotes)
```

---

## ✅ Checklist

**Before you start:**
- [ ] Node.js 18+ installed
- [ ] PostgreSQL running (or Supabase account)
- [ ] Redis running (or Upstash account)

**Setup:**
- [ ] Copied `.env.example` to `.env`
- [ ] Generated encryption key
- [ ] Generated session secret
- [ ] Set database URL
- [ ] Set Redis URL
- [ ] Ran `npm install`
- [ ] Ran `npm run db:push`

**Testing:**
- [ ] Started dev server (`npm run dev`)
- [ ] Visited `http://localhost:3000`
- [ ] Created account
- [ ] Created app
- [ ] Got API credentials

**Slack Integration:**
- [ ] Created Slack app
- [ ] Added OAuth redirect URI
- [ ] Added bot scopes
- [ ] Got client ID and secret
- [ ] Added to `.env`
- [ ] Seeded database
- [ ] Tested OAuth flow

---

## 🎉 You're Ready!

Your B2B2C Integration Platform is now running!

**Next steps:**
1. ✅ Explore the dashboard
2. ✅ Create a workflow
3. ✅ Add more integrations
4. ✅ Test API endpoints
5. ✅ Deploy to production

**Need help?**
- Check error messages in terminal
- Review `ENV_SETUP_GUIDE.md`
- Check `docs/API_REFERENCE.md`
- Read `README.md`

**Happy building! 🚀**

