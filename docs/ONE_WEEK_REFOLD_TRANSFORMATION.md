# 🚀 ONE WEEK PLAN: Transform to Refold-Level B2B2C Platform

> **Goal**: Fix workflow creation architecture to match Refold.ai's B2B2C model  
> **Timeline**: 7 Days (Focused Sprint)  
> **Date**: December 30, 2025

---

## 🔍 CRITICAL ANALYSIS: What's Wrong with Current Approach

### ❌ Current Problems

1. **Workflow Creation is Broken**
   - Workflows require integration credentials BEFORE creation
   - No connection management in workflow builder
   - Fields are static, not dynamic from integration schemas
   - No credential validation during workflow setup

2. **Missing B2B2C Flow**
   ```
   Current (WRONG):
   Your App → Workflow → ??? → Integration
   
   Refold (CORRECT):
   Your App (B2B) → Customer's End User (B2C) → Integration Connection → Workflow
   ```

3. **No End-User Connection Management**
   - End users can't connect their own integrations
   - No OAuth flow for end users
   - Credentials are app-level, not user-level
   - No connection status/health monitoring

4. **Static Integration Schema**
   - Fields are hardcoded in seed file
   - No dynamic field fetching from integration plugins
   - No field validation based on integration requirements
   - No conditional fields (if X selected, show Y)

---

## 🎯 REFOLD'S ARCHITECTURE (What We Need to Build)

### 1. **B2B2C Model**

```typescript
// Refold's Flow
┌─────────────────────────────────────────────────────────────┐
│ YOUR SAAS APP (B2B)                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Customer A (Enterprise Company)                         │ │
│ │                                                         │ │
│ │  ┌──────────────────────────────────────────────────┐  │ │
│ │  │ End User 1 (john@customerA.com)                  │  │ │
│ │  │  - Connected: Slack, Gmail, Notion              │  │ │
│ │  │  - Workflows: 5 active                          │  │ │
│ │  └──────────────────────────────────────────────────┘  │ │
│ │                                                         │ │
│ │  ┌──────────────────────────────────────────────────┐  │ │
│ │  │ End User 2 (sarah@customerA.com)                 │  │ │
│ │  │  - Connected: Salesforce, HubSpot               │  │ │
│ │  │  - Workflows: 3 active                          │  │ │
│ │  └──────────────────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2. **Workflow Creation Flow (Refold Way)**

```typescript
Step 1: SELECT INTEGRATION
  ↓
Step 2: CHECK CONNECTION STATUS
  ├─ Connected? → Proceed to Step 3
  └─ Not Connected? → INITIATE OAUTH FLOW
      ↓
      User authorizes integration
      ↓
      Store encrypted credentials
      ↓
      Return to workflow builder
  ↓
Step 3: FETCH AVAILABLE ACTIONS (from integration plugin)
  ↓
Step 4: SELECT ACTION
  ↓
Step 5: FETCH ACTION SCHEMA (dynamic fields from plugin)
  ↓
Step 6: CONFIGURE FIELDS (with AI suggestions)
  ↓
Step 7: ADD CONDITIONS/MAPPINGS
  ↓
Step 8: TEST WORKFLOW (with real connection)
  ↓
Step 9: SAVE & ACTIVATE
```

### 3. **Integration Plugin Structure (Refold Way)**

```typescript
// Each integration is a self-contained plugin
interface IntegrationPlugin {
  metadata: {
    slug: string;
    name: string;
    description: string;
    logo: string;
    category: string;
  };
  
  // Auth configuration
  auth: {
    type: 'oauth2' | 'api_key' | 'basic';
    config: OAuthConfig | ApiKeyConfig;
    validate: (credentials: Credentials) => Promise<boolean>;
    refresh: (credentials: Credentials) => Promise<Credentials>;
  };
  
  // Dynamic actions (not static!)
  actions: {
    [actionId: string]: {
      id: string;
      name: string;
      description: string;
      
      // Dynamic schema (not hardcoded!)
      getInputSchema: (context?: Context) => Promise<ZodSchema>;
      getOutputSchema: () => Promise<ZodSchema>;
      
      // Execution
      execute: (input: any, credentials: Credentials, context: ExecutionContext) => Promise<ActionResult>;
      
      // Field dependencies
      getDynamicFields?: (selectedFields: Record<string, any>) => Promise<Field[]>;
    };
  };
  
  // Triggers (webhooks, polling)
  triggers?: {
    [triggerId: string]: TriggerDefinition;
  };
}
```

---

## 📋 ONE WEEK IMPLEMENTATION PLAN

### **DAY 1: Fix Database Schema & Connection Management**

#### Morning: Database Schema Updates

**File**: `prisma/schema.prisma`

```prisma
// Add missing fields to EndUserConnection
model EndUserConnection {
  id            String   @id @default(cuid())
  appId         String
  endUserId     String
  integrationId String
  
  // Encrypted credentials
  accessToken   String   // Encrypted
  refreshToken  String?  // Encrypted
  expiresAt     DateTime?
  scope         String?
  
  // Connection health
  status        String   @default("active") // active, expired, revoked, error
  lastUsedAt    DateTime?
  lastError     String?
  lastErrorAt   DateTime?
  
  // Metadata
  metadata      Json?    // Integration-specific data
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  app           App      @relation(fields: [appId], references: [id], onDelete: Cascade)
  endUser       EndUser  @relation(fields: [endUserId], references: [id], onDelete: Cascade)
  integration   Integration @relation(fields: [integrationId], references: [id])
  executions    Execution[]
  
  @@unique([endUserId, integrationId]) // One connection per user per integration
  @@index([appId])
  @@index([endUserId])
  @@index([integrationId])
  @@index([status])
  @@map("end_user_connections")
}

// Add connection tracking to Workflow
model Workflow {
  id              String   @id @default(cuid())
  appId           String
  integrationId   String
  name            String
  description     String?
  
  // Connection requirement
  requiresConnection Boolean @default(true) // Does this workflow need end-user connection?
  
  // Definition
  definition      Json     // Workflow steps, mappings, conditions
  
  // Status
  enabled         Boolean  @default(false)
  status          String   @default("draft") // draft, active, paused, error
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  app             App      @relation(fields: [appId], references: [id], onDelete: Cascade)
  integration     Integration @relation(fields: [integrationId], references: [id])
  executions      Execution[]
  
  @@index([appId])
  @@index([integrationId])
  @@index([enabled])
  @@map("workflows")
}
```

#### Afternoon: Connection Management Service

**File**: `src/services/connection-manager.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';

export class ConnectionManager {
  /**
   * Check if end user has active connection for integration
   */
  async hasConnection(endUserId: string, integrationSlug: string): Promise<boolean> {
    const integration = await prisma.integration.findUnique({
      where: { slug: integrationSlug },
    });
    
    if (!integration) return false;
    
    const connection = await prisma.endUserConnection.findUnique({
      where: {
        endUserId_integrationId: {
          endUserId,
          integrationId: integration.id,
        },
      },
    });
    
    return connection?.status === 'active';
  }
  
  /**
   * Get connection with decrypted credentials
   */
  async getConnection(endUserId: string, integrationSlug: string) {
    const integration = await prisma.integration.findUnique({
      where: { slug: integrationSlug },
    });
    
    if (!integration) throw new Error('Integration not found');
    
    const connection = await prisma.endUserConnection.findUnique({
      where: {
        endUserId_integrationId: {
          endUserId,
          integrationId: integration.id,
        },
      },
      include: {
        integration: true,
      },
    });
    
    if (!connection) return null;
    
    // Decrypt credentials
    const accessToken = await decrypt(connection.accessToken);
    const refreshToken = connection.refreshToken 
      ? await decrypt(connection.refreshToken) 
      : null;
    
    return {
      ...connection,
      credentials: {
        accessToken,
        refreshToken,
        expiresAt: connection.expiresAt,
        scope: connection.scope,
      },
    };
  }
  
  /**
   * Initiate OAuth flow for end user
   */
  async initiateOAuth(
    endUserId: string, 
    integrationSlug: string,
    redirectUri?: string
  ) {
    const integration = await prisma.integration.findUnique({
      where: { slug: integrationSlug },
    });
    
    if (!integration) throw new Error('Integration not found');
    if (integration.authType !== 'oauth2') {
      throw new Error('Integration does not support OAuth');
    }
    
    const authConfig = integration.authConfig as any;
    const state = crypto.randomBytes(32).toString('base64url');
    
    // Store OAuth state
    await prisma.oAuthState.create({
      data: {
        state,
        endUserId,
        integrationId: integration.id,
        redirectUri: redirectUri || '',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      },
    });
    
    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: authConfig.clientId || process.env[`${integrationSlug.toUpperCase()}_CLIENT_ID`] || '',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/connections/callback`,
      state,
      scope: (authConfig.scopes || []).join(' '),
      response_type: 'code',
    });
    
    return {
      authUrl: `${authConfig.authorizationUrl}?${params.toString()}`,
      state,
    };
  }
  
  /**
   * Handle OAuth callback and store credentials
   */
  async handleOAuthCallback(code: string, state: string) {
    // Find OAuth state
    const oauthState = await prisma.oAuthState.findUnique({
      where: { state },
      include: {
        integration: true,
        endUser: true,
      },
    });
    
    if (!oauthState) throw new Error('Invalid OAuth state');
    if (oauthState.expiresAt < new Date()) throw new Error('OAuth state expired');
    
    const integration = oauthState.integration;
    const authConfig = integration.authConfig as any;
    
    // Exchange code for token
    const tokenResponse = await fetch(authConfig.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: authConfig.clientId || '',
        client_secret: authConfig.clientSecret || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/connections/callback`,
      }),
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }
    
    const tokens = await tokenResponse.json();
    
    // Encrypt tokens
    const encryptedAccessToken = await encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token 
      ? await encrypt(tokens.refresh_token) 
      : null;
    
    // Store or update connection
    const connection = await prisma.endUserConnection.upsert({
      where: {
        endUserId_integrationId: {
          endUserId: oauthState.endUserId,
          integrationId: integration.id,
        },
      },
      create: {
        appId: oauthState.appId,
        endUserId: oauthState.endUserId,
        integrationId: integration.id,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: tokens.expires_in 
          ? new Date(Date.now() + tokens.expires_in * 1000) 
          : null,
        scope: tokens.scope,
        status: 'active',
        lastUsedAt: new Date(),
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt: tokens.expires_in 
          ? new Date(Date.now() + tokens.expires_in * 1000) 
          : null,
        scope: tokens.scope,
        status: 'active',
        lastUsedAt: new Date(),
        lastError: null,
        lastErrorAt: null,
      },
    });
    
    // Delete used OAuth state
    await prisma.oAuthState.delete({ where: { state } });
    
    return connection;
  }
  
  /**
   * Disconnect integration for end user
   */
  async disconnect(endUserId: string, integrationSlug: string) {
    const integration = await prisma.integration.findUnique({
      where: { slug: integrationSlug },
    });
    
    if (!integration) throw new Error('Integration not found');
    
    await prisma.endUserConnection.delete({
      where: {
        endUserId_integrationId: {
          endUserId,
          integrationId: integration.id,
        },
      },
    });
  }
  
  /**
   * Get all connections for end user
   */
  async getUserConnections(endUserId: string) {
    return await prisma.endUserConnection.findMany({
      where: { endUserId },
      include: {
        integration: {
          select: {
            id: true,
            slug: true,
            name: true,
            logo: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const connectionManager = new ConnectionManager();
```

---

### **DAY 2: Dynamic Integration Schema System**

#### Goal: Make integration fields dynamic (fetched from plugins, not database)

**File**: `src/services/integration-schema-service.ts`

```typescript
import { integrationRegistry } from '@/integrations/registry';
import { z } from 'zod';

export class IntegrationSchemaService {
  /**
   * Get available actions for an integration (from plugin, not database!)
   */
  async getActions(integrationSlug: string) {
    const integration = integrationRegistry.get(integrationSlug);
    
    if (!integration) {
      throw new Error(`Integration ${integrationSlug} not found in registry`);
    }
    
    const actions = integration.actions || {};
    
    return Object.entries(actions).map(([key, action]) => ({
      id: action.id || key,
      name: action.name || key,
      description: action.description || '',
      slug: key,
    }));
  }
  
  /**
   * Get dynamic input schema for an action
   */
  async getActionSchema(integrationSlug: string, actionId: string, context?: any) {
    const integration = integrationRegistry.get(integrationSlug);
    
    if (!integration) {
      throw new Error(`Integration ${integrationSlug} not found`);
    }
    
    const action = integration.actions?.[actionId];
    
    if (!action) {
      throw new Error(`Action ${actionId} not found in ${integrationSlug}`);
    }
    
    // Get input schema (can be dynamic based on context!)
    const inputSchema = action.inputSchema;
    
    // Convert Zod schema to JSON schema for frontend
    const fields = this.zodSchemaToFields(inputSchema);
    
    return {
      id: action.id || actionId,
      name: action.name || actionId,
      description: action.description || '',
      fields,
    };
  }
  
  /**
   * Convert Zod schema to field definitions
   */
  private zodSchemaToFields(schema: z.ZodType<any>): any[] {
    const fields: any[] = [];
    
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      
      for (const [key, fieldSchema] of Object.entries(shape)) {
        const field: any = {
          name: key,
          label: this.formatLabel(key),
          required: !this.isOptional(fieldSchema as z.ZodType),
        };
        
        // Determine field type
        if (fieldSchema instanceof z.ZodString) {
          const desc = (fieldSchema as any)._def.description || '';
          field.type = desc.includes('email') ? 'email' : 
                      desc.includes('url') ? 'url' : 
                      desc.length > 100 ? 'textarea' : 'string';
          field.description = desc;
        } else if (fieldSchema instanceof z.ZodNumber) {
          field.type = 'number';
        } else if (fieldSchema instanceof z.ZodBoolean) {
          field.type = 'boolean';
        } else if (fieldSchema instanceof z.ZodArray) {
          field.type = 'array';
        } else if (fieldSchema instanceof z.ZodEnum) {
          field.type = 'select';
          field.options = (fieldSchema as any)._def.values;
        }
        
        fields.push(field);
      }
    }
    
    return fields;
  }
  
  private isOptional(schema: z.ZodType): boolean {
    return schema instanceof z.ZodOptional || 
           schema instanceof z.ZodNullable ||
           (schema as any)._def.defaultValue !== undefined;
  }
  
  private formatLabel(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}

export const integrationSchemaService = new IntegrationSchemaService();
```

**Update API Route**: `src/app/api/integrations/[slug]/actions/[actionId]/schema/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { integrationSchemaService } from '@/services/integration-schema-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; actionId: string } }
) {
  try {
    const { slug, actionId } = params;
    
    // Get dynamic schema from integration plugin
    const schema = await integrationSchemaService.getActionSchema(slug, actionId);
    
    return NextResponse.json({
      success: true,
      schema,
    });
  } catch (error: any) {
    console.error('Failed to fetch action schema:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch action schema' },
      { status: 500 }
    );
  }
}
```

---

### **DAY 3: Workflow Builder with Connection Management**

#### Goal: Add connection checking and OAuth flow to workflow builder

**File**: `src/app/dashboard/workflows/new/page.tsx` (Major Refactor)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Link as LinkIcon } from 'lucide-react';

interface Connection {
  id: string;
  integrationId: string;
  status: 'active' | 'expired' | 'error';
  lastUsedAt: string;
  integration: {
    slug: string;
    name: string;
    logo: string;
  };
}

export default function NewWorkflowPage() {
  const router = useRouter();
  
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState('');
  const [connection, setConnection] = useState<Connection | null>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [selectedAction, setSelectedAction] = useState('');
  const [actionSchema, setActionSchema] = useState<any>(null);
  const [fieldMappings, setFieldMappings] = useState<Record<string, any>>({});
  
  // Workflow details
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(false);
  
  // Fetch integrations on mount
  useEffect(() => {
    fetchIntegrations();
  }, []);
  
  // Check connection when integration is selected
  useEffect(() => {
    if (selectedIntegration) {
      checkConnection();
    }
  }, [selectedIntegration]);
  
  // Fetch actions when connection is confirmed
  useEffect(() => {
    if (connection?.status === 'active') {
      fetchActions();
    }
  }, [connection]);
  
  // Fetch action schema when action is selected
  useEffect(() => {
    if (selectedAction) {
      fetchActionSchema();
    }
  }, [selectedAction]);
  
  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    }
  };
  
  const checkConnection = async () => {
    setCheckingConnection(true);
    try {
      const response = await fetch(
        `/api/connections/check?integration=${selectedIntegration}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setConnection(data.connection);
      } else {
        setConnection(null);
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
      setConnection(null);
    } finally {
      setCheckingConnection(false);
    }
  };
  
  const initiateConnection = async () => {
    try {
      const response = await fetch('/api/connections/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration: selectedIntegration,
          redirectUri: window.location.href,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Redirect to OAuth URL
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to initiate connection:', error);
    }
  };
  
  const fetchActions = async () => {
    try {
      const response = await fetch(
        `/api/integrations/${selectedIntegration}/actions`
      );
      
      if (response.ok) {
        const data = await response.json();
        setActions(data.actions || []);
      }
    } catch (error) {
      console.error('Failed to fetch actions:', error);
    }
  };
  
  const fetchActionSchema = async () => {
    try {
      const response = await fetch(
        `/api/integrations/${selectedIntegration}/actions/${selectedAction}/schema`
      );
      
      if (response.ok) {
        const data = await response.json();
        setActionSchema(data.schema);
      }
    } catch (error) {
      console.error('Failed to fetch action schema:', error);
    }
  };
  
  const handleSave = async () => {
    setLoading(true);
    try {
      const workflow = {
        name: workflowName,
        description: workflowDescription,
        integrationSlug: selectedIntegration,
        connectionId: connection?.id,
        definition: {
          version: '1.0',
          action: selectedAction,
          fieldMappings,
        },
        enabled: false,
      };
      
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });
      
      if (response.ok) {
        router.push('/dashboard/workflows');
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create Workflow</h1>
      
      {/* Step 1: Select Integration */}
      {currentStep === 1 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Select Integration</h2>
          
          <div className="grid grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <button
                key={integration.id}
                onClick={() => {
                  setSelectedIntegration(integration.slug);
                  setCurrentStep(2);
                }}
                className="p-4 border rounded-lg hover:border-blue-500 transition"
              >
                <img 
                  src={integration.logo} 
                  alt={integration.name}
                  className="w-12 h-12 mx-auto mb-2"
                />
                <p className="text-sm font-medium">{integration.name}</p>
              </button>
            ))}
          </div>
        </Card>
      )}
      
      {/* Step 2: Check/Create Connection */}
      {currentStep === 2 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          
          {checkingConnection ? (
            <p>Checking connection...</p>
          ) : connection?.status === 'active' ? (
            <Alert className="mb-4">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Connected to {connection.integration.name}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to connect your {selectedIntegration} account first
              </AlertDescription>
            </Alert>
          )}
          
          {connection?.status === 'active' ? (
            <Button onClick={() => setCurrentStep(3)}>
              Continue to Actions
            </Button>
          ) : (
            <Button onClick={initiateConnection}>
              <LinkIcon className="mr-2 h-4 w-4" />
              Connect {selectedIntegration}
            </Button>
          )}
        </Card>
      )}
      
      {/* Step 3: Select Action */}
      {currentStep === 3 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Select Action</h2>
          
          <div className="space-y-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  setSelectedAction(action.id);
                  setCurrentStep(4);
                }}
                className="w-full p-4 border rounded-lg hover:border-blue-500 transition text-left"
              >
                <p className="font-medium">{action.name}</p>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>
        </Card>
      )}
      
      {/* Step 4: Configure Fields */}
      {currentStep === 4 && actionSchema && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Configure Action</h2>
          
          <div className="space-y-4">
            {actionSchema.fields.map((field: any) => (
              <div key={field.name}>
                <label className="block text-sm font-medium mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {field.type === 'textarea' ? (
                  <textarea
                    className="w-full p-2 border rounded"
                    placeholder={field.placeholder}
                    value={fieldMappings[field.name] || ''}
                    onChange={(e) => setFieldMappings({
                      ...fieldMappings,
                      [field.name]: e.target.value,
                    })}
                  />
                ) : field.type === 'select' ? (
                  <select
                    className="w-full p-2 border rounded"
                    value={fieldMappings[field.name] || ''}
                    onChange={(e) => setFieldMappings({
                      ...fieldMappings,
                      [field.name]: e.target.value,
                    })}
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    className="w-full p-2 border rounded"
                    placeholder={field.placeholder}
                    value={fieldMappings[field.name] || ''}
                    onChange={(e) => setFieldMappings({
                      ...fieldMappings,
                      [field.name]: e.target.value,
                    })}
                  />
                )}
                
                {field.description && (
                  <p className="text-sm text-gray-500 mt-1">{field.description}</p>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex gap-4">
            <Button onClick={() => setCurrentStep(3)} variant="outline">
              Back
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Workflow'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
```

---

### **DAY 4-5: API Routes for Connection Management**

**File**: `src/app/api/connections/check/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectionManager } from '@/services/connection-manager';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const integration = searchParams.get('integration');
    
    if (!integration) {
      return NextResponse.json({ error: 'Integration required' }, { status: 400 });
    }
    
    // Check if user has connection
    const connection = await connectionManager.getConnection(
      session.userId,
      integration
    );
    
    return NextResponse.json({
      connected: !!connection,
      connection: connection ? {
        id: connection.id,
        status: connection.status,
        lastUsedAt: connection.lastUsedAt,
        integration: {
          slug: connection.integration.slug,
          name: connection.integration.name,
          logo: connection.integration.logo,
        },
      } : null,
    });
  } catch (error: any) {
    console.error('Failed to check connection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**File**: `src/app/api/connections/initiate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectionManager } from '@/services/connection-manager';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { integration, redirectUri } = await request.json();
    
    if (!integration) {
      return NextResponse.json({ error: 'Integration required' }, { status: 400 });
    }
    
    // Initiate OAuth flow
    const { authUrl, state } = await connectionManager.initiateOAuth(
      session.userId,
      integration,
      redirectUri
    );
    
    return NextResponse.json({
      authUrl,
      state,
    });
  } catch (error: any) {
    console.error('Failed to initiate connection:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**File**: `src/app/api/connections/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectionManager } from '@/services/connection-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/workflows/new?error=${error}`
      );
    }
    
    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }
    
    // Handle OAuth callback
    await connectionManager.handleOAuthCallback(code, state);
    
    // Redirect back to workflow builder
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/workflows/new?connected=true`
    );
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/workflows/new?error=connection_failed`
    );
  }
}
```

---

### **DAY 6: Update Workflow Execution to Use Connections**

**File**: `src/services/workflow-executor.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { integrationRegistry } from '@/integrations/registry';
import { connectionManager } from '@/services/connection-manager';

export class WorkflowExecutor {
  async execute(workflowId: string, endUserId: string, inputData: any = {}) {
    // Get workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        integration: true,
      },
    });
    
    if (!workflow) throw new Error('Workflow not found');
    
    // Get end user's connection
    const connection = await connectionManager.getConnection(
      endUserId,
      workflow.integration.slug
    );
    
    if (!connection) {
      throw new Error(`User not connected to ${workflow.integration.name}`);
    }
    
    if (connection.status !== 'active') {
      throw new Error(`Connection to ${workflow.integration.name} is ${connection.status}`);
    }
    
    // Get integration plugin
    const integration = integrationRegistry.get(workflow.integration.slug);
    if (!integration) {
      throw new Error(`Integration ${workflow.integration.slug} not found in registry`);
    }
    
    // Get action
    const definition = workflow.definition as any;
    const action = integration.actions?.[definition.action];
    
    if (!action) {
      throw new Error(`Action ${definition.action} not found`);
    }
    
    // Execute action with user's credentials
    const result = await action.execute(
      definition.fieldMappings,
      connection.credentials,
      {
        logger: console,
        workflowId: workflow.id,
        executionId: crypto.randomUUID(),
      }
    );
    
    // Update connection last used
    await prisma.endUserConnection.update({
      where: { id: connection.id },
      data: { lastUsedAt: new Date() },
    });
    
    return result;
  }
}

export const workflowExecutor = new WorkflowExecutor();
```

---

### **DAY 7: Testing, Documentation & Cleanup**

1. **Test complete flow**:
   - Create workflow
   - Check connection status
   - Initiate OAuth
   - Complete OAuth
   - Configure action
   - Save workflow
   - Execute workflow

2. **Update documentation**:
   - API reference
   - Integration development guide
   - Workflow builder guide

3. **Clean up**:
   - Remove old static field definitions from seed file
   - Remove debug logging
   - Run type checks
   - Fix linter errors

---

## 🎯 SUCCESS CRITERIA

After this week, you should have:

✅ **Proper B2B2C Architecture**
- End users can connect their own integrations
- OAuth flow works seamlessly
- Connections are user-specific, not app-specific

✅ **Dynamic Integration Schema**
- Fields are fetched from integration plugins
- No hardcoded fields in database
- Schema is dynamic and extensible

✅ **Complete Workflow Builder**
- Check connection status
- Initiate OAuth if needed
- Fetch actions dynamically
- Configure fields with proper UI
- Save and execute workflows

✅ **Secure Credential Management**
- Credentials encrypted at rest
- Token refresh handled automatically
- Connection health monitoring

---

## 🚀 NEXT STEPS (Week 2+)

1. **AI-Powered Field Mapping** (Refold's key feature)
2. **Workflow Templates**
3. **Trigger Support** (webhooks, polling)
4. **Error Recovery & Auto-healing**
5. **Memory Graph System**

---

## 📝 NOTES

- This plan focuses on **fixing the core architecture** first
- Once this is done, adding new integrations becomes trivial
- The dynamic schema system makes integrations truly plug-and-play
- Connection management is the foundation for B2B2C model

**Start with Day 1 tomorrow! 🚀**

