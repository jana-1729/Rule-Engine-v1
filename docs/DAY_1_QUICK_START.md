# 🚀 DAY 1 QUICK START: Database Schema & Connection Management

> **Date**: December 30, 2025  
> **Goal**: Fix database schema and build connection management foundation  
> **Time**: 6-8 hours

---

## ✅ CHECKLIST

### Morning (3-4 hours)
- [ ] Update Prisma schema
- [ ] Run migrations
- [ ] Test database changes

### Afternoon (3-4 hours)
- [ ] Build ConnectionManager service
- [ ] Create API routes for connection checking
- [ ] Test connection flow

---

## 📋 STEP-BY-STEP GUIDE

### Step 1: Update Prisma Schema (30 minutes)

**File**: `prisma/schema.prisma`

Add these fields to `EndUserConnection`:

```prisma
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
  
  // Connection health (NEW)
  status        String   @default("active") // active, expired, revoked, error
  lastUsedAt    DateTime?
  lastError     String?
  lastErrorAt   DateTime?
  
  // Metadata
  metadata      Json?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  app           App      @relation(fields: [appId], references: [id], onDelete: Cascade)
  endUser       EndUser  @relation(fields: [endUserId], references: [id], onDelete: Cascade)
  integration   Integration @relation(fields: [integrationId], references: [id])
  executions    Execution[]
  
  @@unique([endUserId, integrationId])
  @@index([appId])
  @@index([endUserId])
  @@index([integrationId])
  @@index([status])
  @@map("end_user_connections")
}
```

Add to `Workflow`:

```prisma
model Workflow {
  id              String   @id @default(cuid())
  appId           String
  integrationId   String
  name            String
  description     String?
  
  // NEW: Connection requirement
  requiresConnection Boolean @default(true)
  
  definition      Json
  enabled         Boolean  @default(false)
  status          String   @default("draft") // draft, active, paused, error
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  app             App      @relation(fields: [appId], references: [id], onDelete: Cascade)
  integration     Integration @relation(fields: [integrationId], references: [id])
  executions      Execution[]
  
  @@index([appId])
  @@index([integrationId])
  @@index([enabled])
  @@map("workflows")
}
```

### Step 2: Generate and Run Migration (10 minutes)

```bash
cd /Users/janarthanans/Projects/Rule-Engine-v1

# Generate migration
npx prisma migrate dev --name add_connection_management

# Push to database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### Step 3: Create ConnectionManager Service (60 minutes)

**File**: `src/services/connection-manager.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';
import crypto from 'crypto';

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
    appId: string,
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
        appId,
        endUserId,
        integrationId: integration.id,
        redirectUri: redirectUri || '',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      },
    });
    
    // Build OAuth URL
    const clientId = authConfig.clientId || 
                    process.env[`${integrationSlug.toUpperCase().replace(/-/g, '_')}_CLIENT_ID`] || 
                    '';
    
    const params = new URLSearchParams({
      client_id: clientId,
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
    
    // Get client credentials
    const clientId = authConfig.clientId || 
                    process.env[`${integration.slug.toUpperCase().replace(/-/g, '_')}_CLIENT_ID`] || 
                    '';
    const clientSecret = authConfig.clientSecret || 
                        process.env[`${integration.slug.toUpperCase().replace(/-/g, '_')}_CLIENT_SECRET`] || 
                        '';
    
    // Exchange code for token
    const tokenResponse = await fetch(authConfig.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/connections/callback`,
      }),
    });
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
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

### Step 4: Create API Routes (60 minutes)

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
      session.accountId,
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

### Step 5: Test Everything (30 minutes)

```bash
# Start dev server
npm run dev

# Test in browser:
# 1. Go to /dashboard/workflows/new
# 2. Select an integration
# 3. Check connection status
# 4. Initiate OAuth (if not connected)
# 5. Complete OAuth flow
# 6. Verify connection is stored in database
```

---

## 🧪 TESTING CHECKLIST

- [ ] Database migration runs without errors
- [ ] Can check connection status
- [ ] Can initiate OAuth flow
- [ ] OAuth callback stores encrypted credentials
- [ ] Can retrieve connection with decrypted credentials
- [ ] Connection status updates correctly

---

## 🐛 TROUBLESHOOTING

### Migration Fails
```bash
# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Or manually fix in Prisma Studio
npx prisma studio
```

### OAuth Doesn't Work
- Check environment variables (CLIENT_ID, CLIENT_SECRET)
- Verify redirect URI matches OAuth app settings
- Check integration authConfig in database

### Encryption Errors
- Ensure ENCRYPTION_KEY is set in .env
- Check encryption.ts implementation

---

## ✅ END OF DAY 1

You should now have:
- ✅ Updated database schema
- ✅ ConnectionManager service
- ✅ API routes for connection management
- ✅ OAuth flow working

**Tomorrow (Day 2)**: Dynamic integration schema system

---

## 📝 NOTES

- Keep all OAuth credentials in environment variables
- Never log decrypted tokens
- Test with at least one OAuth integration (Slack recommended)
- Connection status should update automatically

**Ready to start? Let's go! 🚀**

