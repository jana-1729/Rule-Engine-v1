import { prisma } from './prisma';
import { createHash } from 'crypto';

/**
 * Verify API Key and return App
 */
export async function verifyApiKey(apiKey: string) {
  if (!apiKey || !apiKey.startsWith('app_')) {
    return null;
  }

  // Hash the API key
  const keyHash = hashApiKey(apiKey);

  // Find app by hashed key
  const app = await prisma.app.findFirst({
    where: {
      apiKey: keyHash,
      status: 'active',
    },
    include: {
      account: {
        select: {
          id: true,
          name: true,
          status: true,
          plan: true,
        },
      },
    },
  });

  if (!app) {
    return null;
  }

  // Check if account is active
  if (app.account.status !== 'active') {
    return null;
  }

  // Update last used (async, don't wait)
  prisma.apiKeyVersion.updateMany({
    where: {
      keyHash,
      appId: app.id,
    },
    data: {
      lastUsedAt: new Date(),
    },
  }).catch(err => console.error('Failed to update API key last used:', err));

  return app;
}

/**
 * Generate new API key
 */
export function generateApiKey(appId: string): string {
  // Format: app_{appId}_{random}
  const random = randomString(32);
  return `app_${appId.substring(0, 8)}_${random}`;
}

/**
 * Hash API key for storage
 */
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Get key prefix for identification
 */
export function getKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 12);
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createHash('sha256')
    .update(payload + secret)
    .digest('hex');
  
  return signature === expectedSignature;
}

/**
 * Generate random string
 */
function randomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Rate limit check
 */
export async function checkRateLimit(
  appId: string,
  limit: number = 100,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  // Implement rate limiting logic
  // This is a simplified version
  // In production, use Redis for distributed rate limiting
  
  const windowStart = new Date(Date.now() - windowMs);
  
  const count = await prisma.execution.count({
    where: {
      appId,
      createdAt: {
        gte: windowStart,
      },
    },
  });

  const allowed = count < limit;
  const remaining = Math.max(0, limit - count);
  const resetAt = new Date(Date.now() + windowMs);

  return { allowed, remaining, resetAt };
}

