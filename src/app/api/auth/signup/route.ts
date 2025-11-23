import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';
import { generateApiKey, hashApiKey, getKeyPrefix } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const signupSchema = z.object({
  accountName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountName, email, password } = signupSchema.parse(body);

    // Check if email already exists
    const existing = await prisma.accountUser.findFirst({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate slug
    const slug = accountName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Create account, user, and default app in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create account
      const account = await tx.account.create({
        data: {
          email,
          name: accountName,
          slug: `${slug}-${nanoid(6)}`,
          passwordHash,
          plan: 'free',
          status: 'active',
        },
      });

      // Create owner user
      const user = await tx.accountUser.create({
        data: {
          accountId: account.id,
          email,
          name: accountName,
          role: 'owner',
          passwordHash,
          joinedAt: new Date(),
        },
      });

      // Create default app
      const appId = `app_${nanoid(16)}`;
      const apiKey = generateApiKey(appId);
      const apiKeyHash = hashApiKey(apiKey);

      const app = await tx.app.create({
        data: {
          accountId: account.id,
          appId,
          apiKey: apiKeyHash,
          name: `${accountName} - Default App`,
          status: 'active',
        },
      });

      // Store API key version
      await tx.apiKeyVersion.create({
        data: {
          appId: app.id,
          keyHash: apiKeyHash,
          keyPrefix: getKeyPrefix(apiKey),
          status: 'active',
        },
      });

      return { account, user, app, apiKey };
    });

    // Create session
    await createSession(result.user.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        account: {
          id: result.account.id,
          name: result.account.name,
        },
        app: {
          id: result.app.id,
          appId: result.app.appId,
          apiKey: result.apiKey, // Show once on signup
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Signup failed' },
      { status: 500 }
    );
  }
}

