# 🔍 Current Architecture vs Refold Architecture

> **Critical Analysis**: What's wrong and how to fix it

---

## ❌ CURRENT ARCHITECTURE (BROKEN)

### Workflow Creation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: User fills workflow name & description             │
├─────────────────────────────────────────────────────────────┤
│ Step 2: Select App (from user's apps)                      │
├─────────────────────────────────────────────────────────────┤
│ Step 3: Select Integration (from database)                 │
│         ❌ No connection check!                             │
├─────────────────────────────────────────────────────────────┤
│ Step 4: Select Action (from database)                      │
│         ❌ Static list from seed file!                      │
├─────────────────────────────────────────────────────────────┤
│ Step 5: Configure Fields                                   │
│         ❌ Fields are empty! (fetched from DB, not plugin) │
│         ❌ No credential validation!                        │
├─────────────────────────────────────────────────────────────┤
│ Step 6: Save Workflow                                      │
│         ❌ No connection ID stored!                         │
│         ❌ Can't execute without credentials!               │
└─────────────────────────────────────────────────────────────┘

RESULT: Workflow saved but CANNOT execute!
```

### Problems

1. **No Connection Management**
   ```typescript
   // Current: Integration selected, but no connection check
   const workflow = {
     integrationId: 'cuid-123',  // Just an ID
     definition: { action: 'send_message', fields: {...} }
   };
   
   // When executing:
   // ❌ Where are the credentials?
   // ❌ Which user's OAuth token to use?
   // ❌ Is the connection still valid?
   ```

2. **Static Fields from Database**
   ```typescript
   // Current: Fields stored in database (seed file)
   actions: {
     send_message: {
       id: 'send_message',
       name: 'Send Message',
       // ❌ No fields! Or hardcoded fields that don't match plugin
     }
   }
   
   // API tries to fetch fields:
   const fields = action.fields || [];  // Returns []
   ```

3. **No B2B2C Model**
   ```
   Current Structure:
   
   Account (Your SaaS Customer)
     ↓
   Workflow (uses integration)
     ↓
   ??? (No connection to end user's credentials)
   ```

---

## ✅ REFOLD ARCHITECTURE (CORRECT)

### Workflow Creation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Select Integration                                 │
├─────────────────────────────────────────────────────────────┤
│ Step 2: Check Connection Status                            │
│         ✅ Query: Does user have active connection?         │
│         ┌────────────────────────────────────────┐         │
│         │ IF NOT CONNECTED:                      │         │
│         │   → Show "Connect" button              │         │
│         │   → Initiate OAuth flow                │         │
│         │   → User authorizes in popup/redirect  │         │
│         │   → Store encrypted credentials        │         │
│         │   → Return to workflow builder         │         │
│         └────────────────────────────────────────┘         │
├─────────────────────────────────────────────────────────────┤
│ Step 3: Fetch Available Actions                            │
│         ✅ From integration plugin (not database!)          │
│         ✅ Dynamic list based on user's permissions         │
├─────────────────────────────────────────────────────────────┤
│ Step 4: Select Action                                      │
├─────────────────────────────────────────────────────────────┤
│ Step 5: Fetch Action Schema                                │
│         ✅ Dynamic fields from plugin's Zod schema          │
│         ✅ Conditional fields based on selections           │
│         ✅ AI-powered field suggestions                     │
├─────────────────────────────────────────────────────────────┤
│ Step 6: Configure Fields                                   │
│         ✅ All fields visible with proper types             │
│         ✅ Validation based on schema                       │
│         ✅ Test with real connection                        │
├─────────────────────────────────────────────────────────────┤
│ Step 7: Save Workflow                                      │
│         ✅ Stores connection ID                             │
│         ✅ Validates with real credentials                  │
│         ✅ Ready to execute immediately                     │
└─────────────────────────────────────────────────────────────┘

RESULT: Workflow saved AND can execute immediately!
```

### B2B2C Model

```
┌─────────────────────────────────────────────────────────────┐
│ YOUR SAAS APP (B2B)                                         │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Account: Acme Corp (Your Customer)                 │    │
│  │                                                    │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │ End User: john@acme.com (B2C)                │ │    │
│  │  │                                              │ │    │
│  │  │  Connections:                                │ │    │
│  │  │  ├─ Slack (OAuth, expires: 2025-12-31)      │ │    │
│  │  │  ├─ Gmail (OAuth, expires: 2025-12-31)      │ │    │
│  │  │  └─ Notion (OAuth, expires: 2025-12-31)     │ │    │
│  │  │                                              │ │    │
│  │  │  Workflows:                                  │ │    │
│  │  │  ├─ "Slack to Notion" (uses john's tokens)  │ │    │
│  │  │  └─ "Gmail to Slack" (uses john's tokens)   │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │                                                    │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │ End User: sarah@acme.com (B2C)               │ │    │
│  │  │                                              │ │    │
│  │  │  Connections:                                │ │    │
│  │  │  ├─ Salesforce (OAuth, expires: 2025-12-31) │ │    │
│  │  │  └─ HubSpot (API Key)                        │ │    │
│  │  │                                              │ │    │
│  │  │  Workflows:                                  │ │    │
│  │  │  └─ "Salesforce to HubSpot" (uses sarah's)  │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Database Structure

```typescript
// Refold's Way

// 1. Integration (plugin metadata)
Integration {
  id: 'cuid-123',
  slug: 'slack',
  name: 'Slack',
  authType: 'oauth2',
  authConfig: { ... },  // OAuth URLs, scopes
  // ❌ NO actions/fields stored here!
}

// 2. End User Connection (user's credentials)
EndUserConnection {
  id: 'cuid-456',
  endUserId: 'user-789',
  integrationId: 'cuid-123',
  accessToken: 'encrypted...',
  refreshToken: 'encrypted...',
  status: 'active',
  expiresAt: '2025-12-31',
}

// 3. Workflow (references connection)
Workflow {
  id: 'cuid-999',
  integrationId: 'cuid-123',
  definition: {
    action: 'send_message',
    fieldMappings: { ... }
  },
  requiresConnection: true,  // ✅ Flag
}

// 4. Execution (uses connection)
Execution {
  id: 'cuid-111',
  workflowId: 'cuid-999',
  connectionId: 'cuid-456',  // ✅ Which connection was used
  status: 'success',
}
```

### Integration Plugin Structure

```typescript
// Refold's Way: Plugins are self-contained

// src/integrations/plugins/slack/index.ts
export const slackIntegration: Integration = {
  metadata: {
    slug: 'slack',
    name: 'Slack',
    logo: '/assets/integrations/slack.jpeg',
    category: 'communication',
  },
  
  // Auth configuration
  auth: {
    type: 'oauth2',
    config: {
      authorizationUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      scopes: ['chat:write', 'channels:read'],
    },
    validate: async (credentials) => {
      // Test if credentials work
      const response = await fetch('https://slack.com/api/auth.test', {
        headers: { Authorization: `Bearer ${credentials.accessToken}` }
      });
      return response.ok;
    },
  },
  
  // Actions (dynamic, not in database!)
  actions: {
    send_message: {
      id: 'send_message',
      name: 'Send Message',
      description: 'Send a message to a Slack channel',
      
      // ✅ Dynamic schema (Zod)
      inputSchema: z.object({
        channel: z.string().describe('Channel ID or name'),
        text: z.string().describe('Message text'),
        thread_ts: z.string().optional().describe('Thread timestamp'),
      }),
      
      outputSchema: z.object({
        ok: z.boolean(),
        ts: z.string(),
      }),
      
      // ✅ Execution with credentials
      execute: async (input, credentials, context) => {
        const slack = new WebClient(credentials.accessToken);
        const result = await slack.chat.postMessage({
          channel: input.channel,
          text: input.text,
          thread_ts: input.thread_ts,
        });
        return { success: true, data: result };
      },
    },
  },
};
```

### API Endpoints

```typescript
// ✅ REFOLD WAY

// 1. Check connection status
GET /api/connections/check?integration=slack
→ { connected: true, connection: { id, status, lastUsedAt } }

// 2. Initiate OAuth
POST /api/connections/initiate
{ integration: 'slack', redirectUri: '...' }
→ { authUrl: 'https://slack.com/oauth/...', state: '...' }

// 3. OAuth callback
GET /api/connections/callback?code=...&state=...
→ Stores encrypted credentials
→ Redirects back to workflow builder

// 4. Get actions (from plugin!)
GET /api/integrations/slack/actions
→ Fetches from integration registry, not database
→ { actions: [{ id, name, description }] }

// 5. Get action schema (dynamic!)
GET /api/integrations/slack/actions/send_message/schema
→ Converts Zod schema to JSON
→ { fields: [{ name, type, label, required }] }

// 6. Create workflow (with connection)
POST /api/workflows
{
  name: 'My Workflow',
  integrationSlug: 'slack',
  definition: {
    action: 'send_message',
    fieldMappings: { ... }
  }
}
→ Validates connection exists
→ Stores workflow with connection reference

// 7. Execute workflow (with user's credentials)
POST /api/workflows/{id}/execute
→ Fetches workflow
→ Fetches user's connection
→ Executes action with decrypted credentials
→ Updates connection lastUsedAt
```

---

## 🎯 KEY DIFFERENCES

| Aspect | Current (Wrong) | Refold (Correct) |
|--------|----------------|------------------|
| **Connection Management** | ❌ No connection tracking | ✅ Full OAuth flow & credential storage |
| **Field Schema** | ❌ Static in database | ✅ Dynamic from plugin Zod schema |
| **Credential Storage** | ❌ No user-specific credentials | ✅ Encrypted per-user credentials |
| **Workflow Execution** | ❌ Can't execute (no credentials) | ✅ Uses user's connection |
| **Integration Plugins** | ❌ Metadata only | ✅ Self-contained with actions |
| **B2B2C Model** | ❌ Missing end-user layer | ✅ Full B2B2C architecture |
| **OAuth Flow** | ❌ Not implemented | ✅ Complete OAuth flow |
| **Connection Health** | ❌ No monitoring | ✅ Status tracking & refresh |

---

## 🚀 TRANSFORMATION SUMMARY

### What Needs to Change

1. **Database Schema**
   - Add connection health fields
   - Add workflow connection requirement flag
   - Proper indexes for performance

2. **Connection Management**
   - Build ConnectionManager service
   - Implement OAuth flow
   - Handle token refresh
   - Monitor connection health

3. **Integration Schema**
   - Remove static fields from database
   - Fetch schema from plugins
   - Convert Zod to JSON schema
   - Support dynamic/conditional fields

4. **Workflow Builder**
   - Add connection checking
   - Show OAuth button if not connected
   - Fetch actions dynamically
   - Fetch fields dynamically
   - Validate with real connection

5. **Workflow Execution**
   - Use user's connection
   - Decrypt credentials
   - Handle token expiry
   - Update connection status

---

## 📋 IMPLEMENTATION PRIORITY

### Week 1 (Critical)
1. ✅ Database schema updates
2. ✅ ConnectionManager service
3. ✅ OAuth flow implementation
4. ✅ Dynamic schema fetching
5. ✅ Workflow builder refactor

### Week 2 (Important)
6. ⚠️ Connection health monitoring
7. ⚠️ Token refresh automation
8. ⚠️ Error recovery
9. ⚠️ Connection UI/UX improvements

### Week 3+ (Nice to Have)
10. 💡 AI-powered field mapping
11. 💡 Workflow templates
12. 💡 Trigger support
13. 💡 Memory graph system

---

## ✅ SUCCESS CRITERIA

After transformation, you should be able to:

1. **Create Workflow**
   - Select integration
   - See "Connect" button if not connected
   - Complete OAuth flow
   - See all available actions (from plugin)
   - See all fields with proper types (from plugin)
   - Save workflow successfully

2. **Execute Workflow**
   - Workflow uses user's connection
   - Credentials are decrypted
   - Action executes successfully
   - Connection status updates

3. **Manage Connections**
   - View all connections
   - See connection status
   - Reconnect if expired
   - Disconnect if needed

---

**This is the foundation. Once this is done, everything else becomes easy!** 🚀

