import { cookies } from 'next/headers';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

/**
 * Session Management
 * Simple session handling for dashboard authentication
 */

const SESSION_COOKIE_NAME = 'session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface Session {
  userId: string;
  accountId: string;
  email: string;
  role: string;
  expiresAt: Date;
}

/**
 * Create a new session
 */
export async function createSession(userId: string): Promise<string> {
  const user = await prisma.accountUser.findUnique({
    where: { id: userId },
    include: { account: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  const session: Session = {
    userId: user.id,
    accountId: user.accountId,
    email: user.email,
    role: user.role,
    expiresAt,
  };

  // Store session in database (simplified - use Redis in production)
  await prisma.auditLog.create({
    data: {
      accountId: user.accountId,
      userId: user.id,
      action: 'session.created',
      resource: 'session',
      resourceId: sessionToken,
    },
  });

  // Set cookie
  cookies().set(SESSION_COOKIE_NAME, JSON.stringify({ token: sessionToken, ...session }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
  });

  return sessionToken;
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value) as Session & { token: string };

    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
      await destroySession();
      return null;
    }

    return {
      userId: session.userId,
      accountId: session.accountId,
      email: session.email,
      role: session.role,
      expiresAt: new Date(session.expiresAt),
    };
  } catch {
    return null;
  }
}

/**
 * Destroy session
 */
export async function destroySession(): Promise<void> {
  cookies().delete(SESSION_COOKIE_NAME);
}

/**
 * Authenticate user with email/password
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<{ user: any; account: any } | null> {
  const user = await prisma.accountUser.findFirst({
    where: { email },
    include: { account: true },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  return { user, account: user.account };
}

/**
 * Require authentication
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

/**
 * Generate session token
 */
function generateSessionToken(): string {
  return `sess_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
}

