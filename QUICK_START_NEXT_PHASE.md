# ⚡ Quick Start: Next Phase

**Goal**: 70% → 85% Refold.ai Parity in 7 Days

---

## 🎯 What We're Building

### Week Focus: **Production-Ready Integrations + AI Workflows + Triggers**

```
Day 1-2: Real API Implementations (Gmail, Notion, Sheets, Slack)
Day 3-4: Webhook & Trigger System
Day 5-6: AI Workflow Generator
Day 7:   Real-Time Monitoring + Performance
```

---

## 🚀 Day 1: Gmail & Notion Integration Completion

### Morning (4 hours)

#### 1. Install Dependencies
```bash
cd /Users/janarthanans/Projects/Rule-Engine-v1

# Google APIs
npm install googleapis @google-cloud/local-auth

# Notion SDK
npm install @notionhq/client
```

#### 2. Complete Gmail Integration
**File**: `src/integrations/plugins/gmail/actions/send-email.ts`

Replace placeholder with:
```typescript
import { google } from 'googleapis';
import { IntegrationAction } from '@/integrations/types';

export const sendEmail: IntegrationAction = {
  id: 'send_email',
  name: 'Send Email',
  description: 'Send an email via Gmail',
  
  inputSchema: {
    type: 'object',
    properties: {
      to: { type: 'string', description: 'Recipient email' },
      subject: { type: 'string', description: 'Email subject' },
      body: { type: 'string', description: 'Email body (HTML or plain text)' },
      cc: { type: 'string', description: 'CC recipients (comma-separated)' },
      bcc: { type: 'string', description: 'BCC recipients (comma-separated)' },
    },
    required: ['to', 'subject', 'body'],
  },

  async execute(input, context) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: context.credentials.access_token,
        refresh_token: context.credentials.refresh_token,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Create MIME message
      const message = [
        `To: ${input.to}`,
        input.cc ? `Cc: ${input.cc}` : '',
        input.bcc ? `Bcc: ${input.bcc}` : '',
        `Subject: ${input.subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        input.body,
      ].filter(Boolean).join('\n');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      return {
        success: true,
        data: {
          messageId: result.data.id,
          threadId: result.data.threadId,
          labelIds: result.data.labelIds,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code || 'GMAIL_ERROR',
          message: error.message,
        },
      };
    }
  },
};
```

#### 3. Add Gmail Draft Action
**Create**: `src/integrations/plugins/gmail/actions/create-draft.ts`

```typescript
import { google } from 'googleapis';
import { IntegrationAction } from '@/integrations/types';

export const createDraft: IntegrationAction = {
  id: 'create_draft',
  name: 'Create Draft',
  description: 'Create an email draft in Gmail',
  
  inputSchema: {
    type: 'object',
    properties: {
      to: { type: 'string', description: 'Recipient email' },
      subject: { type: 'string', description: 'Email subject' },
      body: { type: 'string', description: 'Email body' },
    },
    required: ['to', 'subject', 'body'],
  },

  async execute(input, context) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: context.credentials.access_token,
        refresh_token: context.credentials.refresh_token,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const message = [
        `To: ${input.to}`,
        `Subject: ${input.subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        input.body,
      ].join('\n');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const result = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: encodedMessage,
          },
        },
      });

      return {
        success: true,
        data: {
          draftId: result.data.id,
          messageId: result.data.message?.id,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code || 'GMAIL_ERROR',
          message: error.message,
        },
      };
    }
  },
};
```

#### 4. Update Gmail Actions Index
**File**: `src/integrations/plugins/gmail/actions/index.ts`

```typescript
export { sendEmail } from './send-email';
export { readEmails } from './read-emails';
export { createDraft } from './create-draft';
```

---

### Afternoon (4 hours)

#### 5. Complete Notion Integration
**File**: `src/integrations/plugins/notion/actions/create-page.ts`

```typescript
import { Client } from '@notionhq/client';
import { IntegrationAction } from '@/integrations/types';

export const createPage: IntegrationAction = {
  id: 'create_page',
  name: 'Create Page',
  description: 'Create a new page in Notion',
  
  inputSchema: {
    type: 'object',
    properties: {
      parent_id: { type: 'string', description: 'Parent page or database ID' },
      title: { type: 'string', description: 'Page title' },
      content: { type: 'string', description: 'Page content (markdown)' },
    },
    required: ['parent_id', 'title'],
  },

  async execute(input, context) {
    try {
      const notion = new Client({
        auth: context.credentials.access_token,
      });

      const response = await notion.pages.create({
        parent: {
          type: 'page_id',
          page_id: input.parent_id,
        },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: input.title,
                },
              },
            ],
          },
        },
        children: input.content ? [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: input.content,
                  },
                },
              ],
            },
          },
        ] : [],
      });

      return {
        success: true,
        data: {
          pageId: response.id,
          url: response.url,
          createdTime: response.created_time,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code || 'NOTION_ERROR',
          message: error.message,
        },
      };
    }
  },
};
```

#### 6. Test Integrations
```bash
# Run integration tests
npm run test src/integrations/__tests__/gmail.test.ts
npm run test src/integrations/__tests__/notion.test.ts

# Manual test with Postman/curl
curl -X POST http://localhost:3000/api/v1/integrations/gmail/actions/send_email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "body": "This is a test email from the integration"
  }'
```

---

## 📋 Day 1 Checklist

- [ ] Install googleapis and @notionhq/client
- [ ] Complete Gmail send_email with real API
- [ ] Add Gmail create_draft action
- [ ] Complete Notion create_page with real API
- [ ] Update action index files
- [ ] Write/update integration tests
- [ ] Test with real OAuth credentials
- [ ] Update documentation

---

## 🎯 Day 2: Google Sheets & Slack

### Tasks
1. Install Google Sheets API dependencies
2. Implement append_row, read_range, update_cell
3. Enhance Slack send_message with real API
4. Add Slack file upload action
5. Write integration tests
6. Update documentation

---

## 🎯 Day 3-4: Webhook & Trigger System

### Key Files to Create
```
src/services/webhook-service.ts
src/services/polling-service.ts
src/app/api/webhooks/[integration]/route.ts
src/integrations/plugins/slack/triggers/new-message.ts
src/integrations/plugins/github/triggers/push-event.ts
```

### Implementation Priority
1. Webhook infrastructure
2. Slack webhooks (new_message, reaction_added)
3. GitHub webhooks (push, pull_request, issue)
4. Gmail polling (new_email)
5. Notion polling (page_created)

---

## 🎯 Day 5-6: AI Workflow Generator

### Key Files to Create
```
src/services/ai-workflow-service.ts
src/app/api/ai/generate-workflow/route.ts
src/ui/workflow/ai-workflow-builder.tsx
```

### Features
- Natural language → Workflow JSON
- Integration selection
- Action mapping
- Field mapping suggestions
- Validation & optimization

---

## 🎯 Day 7: Real-Time & Performance

### Key Files to Create
```
src/services/websocket-service.ts
src/services/cache-service.ts
src/app/dashboard/executions/live/page.tsx
```

### Features
- WebSocket server
- Real-time execution updates
- Redis caching
- Performance optimization

---

## 📊 Progress Tracking

### Daily Updates
```bash
# Update progress
echo "Day 1: Gmail ✅ Notion ✅" >> PROGRESS.md
echo "Day 2: Sheets ✅ Slack ✅" >> PROGRESS.md
# ... etc
```

### Success Metrics
- [ ] All integrations have real API calls
- [ ] 15+ triggers implemented
- [ ] AI workflow generator functional
- [ ] Real-time monitoring live
- [ ] 85% Refold.ai parity achieved

---

## 🚨 Common Issues & Solutions

### Issue 1: OAuth Token Expired
**Solution**: Implement automatic token refresh
```typescript
if (error.code === 401) {
  const newToken = await refreshOAuthToken(context.credentials.refresh_token);
  context.credentials.access_token = newToken;
  // Retry the request
}
```

### Issue 2: Rate Limiting
**Solution**: Implement exponential backoff
```typescript
import { errorRecovery } from '@/services/error-recovery-service';

const result = await errorRecovery.executeWithRetry(
  async () => await apiCall(),
  { maxRetries: 5, serviceName: 'gmail' }
);
```

### Issue 3: Webhook Signature Verification Failed
**Solution**: Check signature algorithm
```typescript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');
```

---

## 📚 Quick Reference

### Environment Variables Needed
```bash
# Gmail
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=

# Notion
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
NOTION_REDIRECT_URI=

# Google Sheets
GOOGLE_SHEETS_CLIENT_ID=
GOOGLE_SHEETS_CLIENT_SECRET=

# Slack
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=

# OpenAI (for AI features)
OPENAI_API_KEY=
```

### Useful Commands
```bash
# Development
npm run dev

# Run worker
npm run worker:dev

# Database
npm run db:studio
npm run db:seed:integrations

# Testing
npm run test
npm run test:watch

# Generate integration
npm run generate:integration
```

---

## 🎉 End Goal

After 7 days, you'll have:

✅ **11 Production-Ready Integrations**  
✅ **15+ Working Triggers**  
✅ **AI Workflow Generator**  
✅ **Real-Time Monitoring**  
✅ **85% Refold.ai Parity**  

**Ready to dominate the integration marketplace! 🚀**

---

**Start now**: Install dependencies and begin with Gmail integration!

```bash
npm install googleapis @notionhq/client
```

