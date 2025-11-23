import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateApiKey, hashApiKey, getKeyPrefix } from '@/lib/auth';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

/**
 * Create App
 * 
 * POST /api/v1/apps
 * 
 * Company X signs up and creates their first app
 * Returns appId and apiKey for authentication
 * 
 * Body:
 * {
 *   "accountEmail": "admin@company-x.com",
 *   "accountPassword": "secure-password",
 *   "accountName": "Company X",
 *   "appName": "Company X Product",
 *   "webhookUrl": "https://company-x.com/webhooks/integrations"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      accountEmail,
      accountPassword,
      accountName,
      appName,
      appDescription,
      webhookUrl,
      allowedOrigins,
    } = body;

    // Validation
    if (!accountEmail || !accountPassword || !accountName || !appName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if account exists
    const existingAccount = await prisma.account.findUnique({
      where: { email: accountEmail },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(accountPassword, 10);

    // Generate slug
    const slug = accountName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Create account and app in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create account
      const account = await tx.account.create({
        data: {
          email: accountEmail,
          name: accountName,
          slug: `${slug}-${nanoid(6)}`,
          passwordHash,
          plan: 'free',
          status: 'active',
        },
      });

      // Create first app
      const appId = `app_${nanoid(16)}`;
      const apiKey = generateApiKey(appId);
      const apiKeyHash = hashApiKey(apiKey);
      const webhookSecret = `whsec_${nanoid(32)}`;

      const app = await tx.app.create({
        data: {
          accountId: account.id,
          appId,
          apiKey: apiKeyHash,
          name: appName,
          description: appDescription,
          webhookUrl,
          webhookSecret,
          allowedOrigins: allowedOrigins || [],
          status: 'active',
        },
      });

      // Store API key version for rotation
      await tx.apiKeyVersion.create({
        data: {
          appId: app.id,
          keyHash: apiKeyHash,
          keyPrefix: getKeyPrefix(apiKey),
          status: 'active',
        },
      });

      // Create account owner user
      await tx.accountUser.create({
        data: {
          accountId: account.id,
          email: accountEmail,
          name: accountName,
          role: 'owner',
          passwordHash,
          joinedAt: new Date(),
        },
      });

      return { account, app, apiKey, webhookSecret };
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        accountId: result.account.id,
        appId: result.app.id,
        action: 'app.created',
        resource: 'app',
        resourceId: result.app.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        account: {
          id: result.account.id,
          email: result.account.email,
          name: result.account.name,
        },
        app: {
          id: result.app.id,
          appId: result.app.appId,
          apiKey: result.apiKey, // Only returned on creation!
          webhookSecret: result.webhookSecret,
          name: result.app.name,
        },
        message: 'Account and app created successfully. Save your API key - it will not be shown again!',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating app:', error);
    return NextResponse.json(
      { error: 'Failed to create app', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get Apps
 * 
 * GET /api/v1/apps
 * 
 * Requires account authentication (not API key)
 */
export async function GET(request: NextRequest) {
  // TODO: Implement session-based auth for dashboard
  return NextResponse.json(
    { error: 'Not implemented - use dashboard' },
    { status: 501 }
  );
}

