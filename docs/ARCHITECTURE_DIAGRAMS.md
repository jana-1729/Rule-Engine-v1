# 🏗️ Architecture Diagrams: Current vs Refold

> **Visual Guide**: See exactly what needs to change

---

## 📊 CURRENT ARCHITECTURE (BROKEN)

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW CREATION                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. User fills form                                          │
│    - Workflow name                                          │
│    - Description                                            │
│    - Select app                                             │
│    - Select integration (from database)                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Fetch actions from DATABASE                              │
│    ❌ Static list from seed file                            │
│    ❌ No connection check                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Fetch action schema from DATABASE                        │
│    ❌ action.fields is undefined or empty                   │
│    ❌ No fields to configure                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Save workflow                                            │
│    {                                                        │
│      integrationId: 'cuid-123',                             │
│      definition: { action: 'send_message', fields: {} }     │
│    }                                                        │
│    ❌ No connection reference                               │
│    ❌ No credentials                                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Try to execute                                           │
│    ❌ ERROR: No credentials found                           │
│    ❌ Workflow is useless                                   │
└─────────────────────────────────────────────────────────────┘
```

### Database Structure (Current)

```
┌──────────────────┐
│   Integration    │
├──────────────────┤
│ id               │
│ slug             │
│ name             │
│ authType         │
│ authConfig       │
│ actions (JSON)   │◄── ❌ Static actions with no fields
│ triggers (JSON)  │
└──────────────────┘
         │
         │ (no connection!)
         │
         ▼
┌──────────────────┐
│    Workflow      │
├──────────────────┤
│ id               │
│ integrationId    │◄── Just an ID, no connection
│ definition       │
│ enabled          │
└──────────────────┘
         │
         │ (can't execute!)
         │
         ▼
┌──────────────────┐
│   Execution      │
├──────────────────┤
│ id               │
│ workflowId       │
│ status: 'error'  │◄── ❌ Always fails (no credentials)
└──────────────────┘
```

---

## ✅ REFOLD ARCHITECTURE (CORRECT)

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW CREATION                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Select integration                                       │
│    - Show integration cards with logos                      │
│    - User clicks "Slack"                                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Check connection status                                  │
│    GET /api/connections/check?integration=slack             │
│                                                             │
│    ┌─────────────────────────────────────────┐             │
│    │ IF NOT CONNECTED:                       │             │
│    │   ✅ Show "Connect Slack" button        │             │
│    │   ✅ User clicks → OAuth popup          │             │
│    │   ✅ User authorizes                    │             │
│    │   ✅ Store encrypted credentials        │             │
│    │   ✅ Return to workflow builder         │             │
│    └─────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Fetch actions from PLUGIN (not database!)                │
│    GET /api/integrations/slack/actions                      │
│    ✅ Returns: integrationRegistry.get('slack').actions     │
│    ✅ Dynamic list from plugin code                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. User selects action: "Send Message"                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Fetch action schema from PLUGIN                          │
│    GET /api/integrations/slack/actions/send_message/schema  │
│    ✅ Converts Zod schema to JSON                           │
│    ✅ Returns all fields with types                         │
│    {                                                        │
│      fields: [                                              │
│        { name: 'channel', type: 'string', required: true }, │
│        { name: 'text', type: 'textarea', required: true },  │
│        { name: 'thread_ts', type: 'string', required: false}│
│      ]                                                      │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Configure fields                                         │
│    ✅ All fields visible                                    │
│    ✅ Proper input types                                    │
│    ✅ Validation                                            │
│    ✅ Can test with real connection                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Save workflow                                            │
│    {                                                        │
│      integrationSlug: 'slack',                              │
│      connectionId: 'cuid-456',  ✅ Connection reference     │
│      definition: {                                          │
│        action: 'send_message',                              │
│        fieldMappings: { channel: '#general', text: '...' } │
│      }                                                      │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Execute workflow                                         │
│    ✅ Fetch user's connection                               │
│    ✅ Decrypt credentials                                   │
│    ✅ Execute action with credentials                       │
│    ✅ SUCCESS!                                              │
└─────────────────────────────────────────────────────────────┘
```

### Database Structure (Refold Way)

```
┌──────────────────┐
│   Integration    │  ◄── Metadata only
├──────────────────┤
│ id               │
│ slug             │
│ name             │
│ authType         │
│ authConfig       │
│ ❌ NO actions    │  ◄── Actions in plugin code, not DB
│ ❌ NO fields     │
└──────────────────┘
         │
         │
         ▼
┌──────────────────────────┐
│  EndUserConnection       │  ◄── User's credentials
├──────────────────────────┤
│ id                       │
│ endUserId                │
│ integrationId            │
│ accessToken (encrypted)  │  ✅ User's OAuth token
│ refreshToken (encrypted) │
│ status: 'active'         │  ✅ Health monitoring
│ expiresAt                │
│ lastUsedAt               │
└──────────────────────────┘
         │
         │
         ▼
┌──────────────────┐
│    Workflow      │
├──────────────────┤
│ id               │
│ integrationId    │
│ definition       │  ✅ Complete field mappings
│ enabled          │
└──────────────────┘
         │
         │
         ▼
┌──────────────────┐
│   Execution      │
├──────────────────┤
│ id               │
│ workflowId       │
│ connectionId     │  ✅ Which connection was used
│ status: 'success'│  ✅ Works!
│ output           │
└──────────────────┘
```

### B2B2C Model

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR SAAS APP (B2B)                      │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Account: Acme Corp (Your Customer)                 │    │
│  │ Plan: Enterprise                                   │    │
│  │                                                    │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │ End User: john@acme.com                      │ │    │
│  │  │                                              │ │    │
│  │  │  ┌────────────────────────────────────────┐ │ │    │
│  │  │  │ Connections:                           │ │ │    │
│  │  │  │                                        │ │ │    │
│  │  │  │ ┌────────────────────────────────┐    │ │ │    │
│  │  │  │ │ Slack                          │    │ │ │    │
│  │  │  │ │ Status: ✅ Active              │    │ │ │    │
│  │  │  │ │ Token: xoxb-encrypted...       │    │ │ │    │
│  │  │  │ │ Expires: 2025-12-31           │    │ │ │    │
│  │  │  │ └────────────────────────────────┘    │ │ │    │
│  │  │  │                                        │ │ │    │
│  │  │  │ ┌────────────────────────────────┐    │ │ │    │
│  │  │  │ │ Gmail                          │    │ │ │    │
│  │  │  │ │ Status: ✅ Active              │    │ │ │    │
│  │  │  │ │ Token: ya29.encrypted...       │    │ │ │    │
│  │  │  │ │ Expires: 2025-12-31           │    │ │ │    │
│  │  │  │ └────────────────────────────────┘    │ │ │    │
│  │  │  │                                        │ │ │    │
│  │  │  │ ┌────────────────────────────────┐    │ │ │    │
│  │  │  │ │ Notion                         │    │ │ │    │
│  │  │  │ │ Status: ⚠️  Expired            │    │ │ │    │
│  │  │  │ │ Last Used: 2025-11-15         │    │ │ │    │
│  │  │  │ └────────────────────────────────┘    │ │ │    │
│  │  │  └────────────────────────────────────────┘ │ │    │
│  │  │                                              │ │    │
│  │  │  ┌────────────────────────────────────────┐ │ │    │
│  │  │  │ Workflows:                             │ │ │    │
│  │  │  │                                        │ │ │    │
│  │  │  │ • "Slack to Notion"                   │ │ │    │
│  │  │  │   Uses: john's Slack + Notion tokens  │ │ │    │
│  │  │  │   Status: ⚠️  Notion expired          │ │ │    │
│  │  │  │                                        │ │ │    │
│  │  │  │ • "Gmail to Slack"                    │ │ │    │
│  │  │  │   Uses: john's Gmail + Slack tokens   │ │ │    │
│  │  │  │   Status: ✅ Active                   │ │ │    │
│  │  │  └────────────────────────────────────────┘ │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │                                                    │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │ End User: sarah@acme.com                     │ │    │
│  │  │                                              │ │    │
│  │  │  ┌────────────────────────────────────────┐ │ │    │
│  │  │  │ Connections:                           │ │ │    │
│  │  │  │                                        │ │ │    │
│  │  │  │ ┌────────────────────────────────┐    │ │ │    │
│  │  │  │ │ Salesforce                     │    │ │ │    │
│  │  │  │ │ Status: ✅ Active              │    │ │ │    │
│  │  │  │ │ Token: 00D...encrypted         │    │ │ │    │
│  │  │  │ └────────────────────────────────┘    │ │ │    │
│  │  │  │                                        │ │ │    │
│  │  │  │ ┌────────────────────────────────┐    │ │ │    │
│  │  │  │ │ HubSpot                        │    │ │ │    │
│  │  │  │ │ Status: ✅ Active              │    │ │ │    │
│  │  │  │ │ Token: pat-encrypted...        │    │ │ │    │
│  │  │  │ └────────────────────────────────┘    │ │ │    │
│  │  │  └────────────────────────────────────────┘ │ │    │
│  │  │                                              │ │    │
│  │  │  ┌────────────────────────────────────────┐ │ │    │
│  │  │  │ Workflows:                             │ │ │    │
│  │  │  │                                        │ │ │    │
│  │  │  │ • "Salesforce to HubSpot"             │ │ │    │
│  │  │  │   Uses: sarah's SF + HubSpot tokens   │ │ │    │
│  │  │  │   Status: ✅ Active                   │ │ │    │
│  │  │  └────────────────────────────────────────┘ │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### OAuth Flow

```
┌──────────────┐                                    ┌──────────────┐
│              │                                    │              │
│   Browser    │                                    │  Your API    │
│              │                                    │              │
└──────┬───────┘                                    └──────┬───────┘
       │                                                   │
       │ 1. Click "Connect Slack"                         │
       ├──────────────────────────────────────────────────►
       │                                                   │
       │                                                   │ 2. Generate state
       │                                                   │    Store in DB
       │                                                   │
       │ 3. Return OAuth URL                              │
       ◄──────────────────────────────────────────────────┤
       │                                                   │
       │                                                   │
       │ 4. Redirect to Slack                             │
       ├──────────────────────────────────┐               │
       │                                  │               │
       │                                  ▼               │
       │                          ┌──────────────┐        │
       │                          │              │        │
       │                          │    Slack     │        │
       │                          │    OAuth     │        │
       │                          │              │        │
       │                          └──────┬───────┘        │
       │                                  │               │
       │ 5. User authorizes               │               │
       │                                  │               │
       │ 6. Redirect back with code       │               │
       ◄──────────────────────────────────┘               │
       │                                                   │
       │ 7. Send code + state                             │
       ├──────────────────────────────────────────────────►
       │                                                   │
       │                                                   │ 8. Verify state
       │                                                   │    Exchange code for token
       │                                                   │    Encrypt token
       │                                                   │    Store in DB
       │                                                   │
       │ 9. Redirect to workflow builder                  │
       ◄──────────────────────────────────────────────────┤
       │                                                   │
       │ 10. Continue workflow creation                   │
       │     (now with connection!)                       │
       │                                                   │
```

### Workflow Execution Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. API Request: POST /api/workflows/{id}/execute            │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Fetch Workflow from Database                              │
│    SELECT * FROM workflows WHERE id = ?                      │
│    ✅ Get: integrationId, definition, etc.                   │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Fetch User's Connection                                   │
│    SELECT * FROM end_user_connections                        │
│    WHERE endUserId = ? AND integrationId = ?                 │
│    ✅ Get: encrypted credentials                             │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Check Connection Status                                   │
│    IF status != 'active':                                    │
│      ❌ THROW ERROR: "Connection expired/revoked"            │
│    IF expiresAt < now():                                     │
│      ❌ THROW ERROR: "Token expired"                         │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Decrypt Credentials                                       │
│    accessToken = decrypt(connection.accessToken)             │
│    refreshToken = decrypt(connection.refreshToken)           │
│    ✅ Get: Plain text tokens                                 │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Get Integration Plugin                                    │
│    integration = integrationRegistry.get(workflow.slug)      │
│    ✅ Get: Plugin with actions                               │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. Get Action from Plugin                                    │
│    action = integration.actions[workflow.definition.action]  │
│    ✅ Get: Action with execute function                      │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 8. Execute Action with User's Credentials                    │
│    result = await action.execute(                            │
│      workflow.definition.fieldMappings,                      │
│      { accessToken, refreshToken },  ◄── User's credentials  │
│      context                                                 │
│    )                                                         │
│    ✅ Action executes successfully                           │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 9. Update Connection Last Used                               │
│    UPDATE end_user_connections                               │
│    SET lastUsedAt = NOW()                                    │
│    WHERE id = connection.id                                  │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 10. Store Execution Result                                   │
│     INSERT INTO executions (workflowId, status, output, ...) │
│     ✅ Execution logged                                      │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 11. Return Success                                           │
│     { success: true, data: result }                          │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 KEY TAKEAWAYS

### Current (Broken)
- ❌ No connection management
- ❌ Static fields in database
- ❌ Workflows can't execute
- ❌ No OAuth flow
- ❌ Missing B2B2C layer

### Refold Way (Correct)
- ✅ Full connection management
- ✅ Dynamic fields from plugins
- ✅ Workflows execute with user credentials
- ✅ Complete OAuth flow
- ✅ Proper B2B2C architecture

---

**Use these diagrams as reference while implementing the transformation!** 🚀

