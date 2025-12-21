/**
 * API Key Management Service
 * Handles API key generation, validation, rotation, and security
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export interface APIKeyMetadata {
  name?: string;
  description?: string;
  permissions?: string[];
  rateLimit?: number;
  expiresAt?: Date;
}

export interface APIKeyRotationResult {
  oldKey: string;
  newKey: string;
  rotatedAt: Date;
  expiresAt: Date;
}

export class APIKeyService {
  /**
   * Generate a new API key
   */
  generateKey(prefix: string = 'app'): string {
    const randomBytes = crypto.randomBytes(32);
    const key = randomBytes.toString('base64url');
    return `${prefix}_${key}`;
  }

  /**
   * Hash API key for storage
   */
  hashKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Get key prefix (for identification without revealing full key)
   */
  getKeyPrefix(apiKey: string): string {
    const parts = apiKey.split('_');
    if (parts.length >= 2) {
      return `${parts[0]}_${parts[1].substring(0, 8)}...`;
    }
    return apiKey.substring(0, 12) + '...';
  }

  /**
   * Create a new API key for an app
   */
  async createAPIKey(
    appId: string,
    metadata?: APIKeyMetadata
  ): Promise<{
    apiKey: string;
    keyPrefix: string;
    id: string;
  }> {
    // Generate new key
    const apiKey = this.generateKey('app');
    const hashedKey = this.hashKey(apiKey);
    const keyPrefix = this.getKeyPrefix(apiKey);

    // Store in database
    const apiKeyRecord = await prisma.app.update({
      where: { id: appId },
      data: {
        apiKey: hashedKey,
        updatedAt: new Date(),
      },
    });

    // Log key creation
    await this.logKeyEvent(appId, 'created', {
      keyPrefix,
      metadata,
    });

    return {
      apiKey, // Return unhashed key (only time it's shown)
      keyPrefix,
      id: apiKeyRecord.id,
    };
  }

  /**
   * Validate API key
   */
  async validateKey(apiKey: string): Promise<{
    valid: boolean;
    appId?: string;
    app?: any;
    error?: string;
  }> {
    try {
      const hashedKey = this.hashKey(apiKey);

      // Find app with this key
      const app = await prisma.app.findFirst({
        where: {
          apiKey: hashedKey,
          status: 'active',
        },
        include: {
          account: true,
        },
      });

      if (!app) {
        return {
          valid: false,
          error: 'Invalid or expired API key',
        };
      }

      // Check if account is active
      if (app.account.status !== 'active') {
        return {
          valid: false,
          error: 'Account is not active',
        };
      }

      // Update last used timestamp
      await prisma.app.update({
        where: { id: app.id },
        data: {
          updatedAt: new Date(),
        },
      });

      return {
        valid: true,
        appId: app.id,
        app,
      };
    } catch (error) {
      console.error('API key validation error:', error);
      return {
        valid: false,
        error: 'Key validation failed',
      };
    }
  }

  /**
   * Rotate API key (generate new key, deprecate old one)
   */
  async rotateKey(
    appId: string,
    gracePeriodDays: number = 30
  ): Promise<APIKeyRotationResult> {
    // Get current app
    const app = await prisma.app.findUnique({
      where: { id: appId },
    });

    if (!app) {
      throw new Error('App not found');
    }

    // Generate new key
    const newApiKey = this.generateKey('app');
    const hashedNewKey = this.hashKey(newApiKey);
    const oldKeyPrefix = this.getKeyPrefix(app.apiKey);

    // Calculate expiration for old key
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + gracePeriodDays);

    // Update app with new key
    await prisma.app.update({
      where: { id: appId },
      data: {
        apiKey: hashedNewKey,
        updatedAt: new Date(),
      },
    });

    // Log rotation
    await this.logKeyEvent(appId, 'rotated', {
      oldKeyPrefix,
      newKeyPrefix: this.getKeyPrefix(newApiKey),
      gracePeriodDays,
      expiresAt,
    });

    return {
      oldKey: oldKeyPrefix, // Don't return full old key
      newKey: newApiKey, // Return full new key (only time it's shown)
      rotatedAt: new Date(),
      expiresAt,
    };
  }

  /**
   * Revoke API key
   */
  async revokeKey(appId: string): Promise<{ success: boolean }> {
    try {
      await prisma.app.update({
        where: { id: appId },
        data: {
          status: 'inactive',
          updatedAt: new Date(),
        },
      });

      await this.logKeyEvent(appId, 'revoked', {});

      return { success: true };
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      return { success: false };
    }
  }

  /**
   * Get API key usage statistics
   */
  async getKeyUsage(appId: string, days: number = 30): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    requestsByDay: Array<{ date: string; count: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get execution stats
    const executions = await prisma.execution.findMany({
      where: {
        appId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        status: true,
        duration: true,
        createdAt: true,
      },
    });

    const totalRequests = executions.length;
    const successfulRequests = executions.filter((e) => e.status === 'success').length;
    const failedRequests = executions.filter((e) => e.status === 'failure').length;

    const averageResponseTime =
      executions.reduce((sum, e) => sum + (e.duration || 0), 0) / totalRequests || 0;

    // Group by day
    const requestsByDay: Record<string, number> = {};
    executions.forEach((e) => {
      const date = e.createdAt.toISOString().split('T')[0];
      requestsByDay[date] = (requestsByDay[date] || 0) + 1;
    });

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime),
      requestsByDay: Object.entries(requestsByDay).map(([date, count]) => ({
        date,
        count,
      })),
    };
  }

  /**
   * Check rate limit for API key
   */
  async checkRateLimit(
    appId: string,
    windowMinutes: number = 1
  ): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt: Date;
  }> {
    const app = await prisma.app.findUnique({
      where: { id: appId },
    });

    if (!app) {
      throw new Error('App not found');
    }

    const limit = app.rateLimitPerMinute || 100;
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

    // Count requests in window
    const requestCount = await prisma.execution.count({
      where: {
        appId,
        createdAt: {
          gte: windowStart,
        },
      },
    });

    const remaining = Math.max(0, limit - requestCount);
    const allowed = requestCount < limit;

    const resetAt = new Date();
    resetAt.setMinutes(resetAt.getMinutes() + windowMinutes);

    return {
      allowed,
      limit,
      remaining,
      resetAt,
    };
  }

  /**
   * Log API key events
   */
  private async logKeyEvent(
    appId: string,
    event: 'created' | 'rotated' | 'revoked' | 'used',
    metadata: any
  ) {
    try {
      // In a real implementation, this would save to a dedicated audit log table
      console.log('API Key Event:', {
        appId,
        event,
        metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log key event:', error);
    }
  }

  /**
   * Get API key security recommendations
   */
  async getSecurityRecommendations(appId: string): Promise<
    Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      action: string;
    }>
  > {
    const recommendations: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      action: string;
    }> = [];

    const app = await prisma.app.findUnique({
      where: { id: appId },
    });

    if (!app) {
      return recommendations;
    }

    // Check key age
    const keyAge = Date.now() - app.createdAt.getTime();
    const keyAgeDays = keyAge / (1000 * 60 * 60 * 24);

    if (keyAgeDays > 365) {
      recommendations.push({
        severity: 'high',
        message: 'API key is over 1 year old',
        action: 'Rotate your API key for security',
      });
    } else if (keyAgeDays > 180) {
      recommendations.push({
        severity: 'medium',
        message: 'API key is over 6 months old',
        action: 'Consider rotating your API key',
      });
    }

    // Check rate limit
    if (!app.rateLimitPerMinute || app.rateLimitPerMinute > 1000) {
      recommendations.push({
        severity: 'medium',
        message: 'No rate limit configured or limit is very high',
        action: 'Set an appropriate rate limit',
      });
    }

    // Check webhook security
    if (app.webhookUrl && !app.webhookSecret) {
      recommendations.push({
        severity: 'high',
        message: 'Webhook URL configured without signature verification',
        action: 'Enable webhook signature verification',
      });
    }

    return recommendations;
  }
}

// Singleton instance
export const apiKeyService = new APIKeyService();

