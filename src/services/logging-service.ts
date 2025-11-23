import { prisma } from '../lib/prisma';

/**
 * Logging Service
 * Centralized logging for audit, errors, and system events
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  timestamp: Date;
}

/**
 * Log an audit event
 */
export async function logAudit(
  organizationId: string,
  userId: string | null,
  action: string,
  resource: string,
  resourceId?: string,
  changes?: any,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  }
) {
  await prisma.auditLog.create({
    data: {
      organizationId,
      userId,
      action,
      resource,
      resourceId,
      changes,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    },
  });

  console.log(`[AUDIT] ${action} on ${resource}${resourceId ? ` (${resourceId})` : ''} by user ${userId}`);
}

/**
 * Log an error for tracking
 */
export async function logError(
  errorType: string,
  errorMessage: string,
  errorStack?: string,
  context?: {
    workflowId?: string;
    executionId?: string;
    integrationId?: string;
    metadata?: any;
  }
) {
  await prisma.errorReport.create({
    data: {
      errorType,
      errorMessage,
      errorStack,
      workflowId: context?.workflowId,
      executionId: context?.executionId,
      integrationId: context?.integrationId,
      metadata: context?.metadata,
      status: 'open',
    },
  });

  console.error(`[ERROR] ${errorType}: ${errorMessage}`);
}

/**
 * Get error statistics
 */
export async function getErrorStats(timeRange: 'day' | 'week' | 'month' = 'day') {
  const now = new Date();
  const startDate = new Date(now);
  
  switch (timeRange) {
    case 'day':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
  }

  const errors = await prisma.errorReport.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      errorType: true,
      errorMessage: true,
      status: true,
      createdAt: true,
    },
  });

  // Group by error type
  const errorsByType = new Map<string, number>();
  errors.forEach(error => {
    const count = errorsByType.get(error.errorType) || 0;
    errorsByType.set(error.errorType, count + 1);
  });

  return {
    total: errors.length,
    open: errors.filter(e => e.status === 'open').length,
    resolved: errors.filter(e => e.status === 'resolved').length,
    byType: Array.from(errorsByType.entries()).map(([type, count]) => ({
      type,
      count,
    })),
  };
}

/**
 * Get audit log for a resource
 */
export async function getAuditLog(
  organizationId: string,
  resource?: string,
  resourceId?: string,
  limit: number = 50
) {
  const where: any = { organizationId };
  
  if (resource) where.resource = resource;
  if (resourceId) where.resourceId = resourceId;

  return await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Structured logger class
 */
export class Logger {
  private context: Record<string, any>;

  constructor(context: Record<string, any> = {}) {
    this.context = context;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(this.context).length > 0 
      ? ` [${JSON.stringify(this.context)}]` 
      : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    
    return `[${timestamp}] [${level.toUpperCase()}]${contextStr} ${message}${dataStr}`;
  }

  info(message: string, data?: any) {
    console.log(this.formatMessage(LogLevel.INFO, message, data));
  }

  warn(message: string, data?: any) {
    console.warn(this.formatMessage(LogLevel.WARN, message, data));
  }

  error(message: string, error?: any) {
    console.error(this.formatMessage(LogLevel.ERROR, message, error));
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, data));
    }
  }

  child(additionalContext: Record<string, any>): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }
}

/**
 * Create a logger with context
 */
export function createLogger(context: Record<string, any> = {}): Logger {
  return new Logger(context);
}

