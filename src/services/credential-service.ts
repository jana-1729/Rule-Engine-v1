import { prisma } from '../lib/prisma';
import { encrypt, decrypt } from '../lib/encryption';
import { ConnectionCredentials } from '../integrations/types';

/**
 * Credential Service
 * Manages secure storage and retrieval of integration credentials
 */

export interface CreateConnectionInput {
  organizationId: string;
  integrationId: string;
  name: string;
  credentials: any;
  scopes?: string[];
}

/**
 * Create a new connection with encrypted credentials
 */
export async function createConnection(input: CreateConnectionInput) {
  // Validate required credentials
  if (!input.credentials.accessToken) {
    throw new Error('Access token is required');
  }

  // Encrypt sensitive data
  const encryptedAccessToken = await encrypt(input.credentials.accessToken);
  const encryptedRefreshToken = input.credentials.refreshToken
    ? await encrypt(input.credentials.refreshToken)
    : null;

  // Store in database
  const connection = await prisma.end_usersConnection.create({
    data: {
      appId: input.organizationId, // Assuming organizationId maps to appId
      integrationId: input.integrationId,
      endUserId: input.organizationId, // This needs to be fixed - should be actual endUserId
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: input.credentials.expiresAt ? new Date(input.credentials.expiresAt) : null,
      scope: input.scopes?.join(' ') || null,
      status: 'active',
      lastUsedAt: new Date(),
    },
    include: {
      integration: true,
    },
  });

  console.log(`✓ Created connection: ${connection.id} for integration: ${input.integrationId}`);

  return connection;
}

/**
 * Get connection with decrypted credentials
 */
export async function getConnection(
  connectionId: string
): Promise<ConnectionCredentials | null> {
  const connection = await prisma.end_usersConnection.findUnique({
    where: { id: connectionId },
    include: { integrations: true },
  });

  if (!connection) {
    return null;
  }

  // Check if token is expired
  if (connection.expiresAt && connection.expiresAt < new Date()) {
    // Try to refresh token
    const refreshed = await refreshConnection(connectionId);
    if (refreshed) {
      return refreshed;
    }
    
    // Mark as expired
    await prisma.end_usersConnection.update({
      where: { id: connectionId },
      data: { status: 'expired' },
    });
    
    throw new Error('Connection expired and could not be refreshed');
  }

  // Decrypt credentials
  const decryptedCredentials: any = {};
  
  if (connection.accessToken) {
    decryptedCredentials.accessToken = await decrypt(connection.accessToken);
  }
  
  if (connection.refreshToken) {
    decryptedCredentials.refreshToken = await decrypt(connection.refreshToken);
  }

  // Update last used timestamp
  await prisma.end_usersConnection.update({
    where: { id: connectionId },
    data: { lastUsedAt: new Date() },
  });

  return {
    type: connection.integrations.authType as any,
    data: decryptedCredentials,
    expiresAt: connection.expiresAt || undefined,
  };
}

/**
 * Refresh OAuth2 token
 */
export async function refreshConnection(
  connectionId: string
): Promise<ConnectionCredentials | null> {
  const connection = await prisma.end_usersConnection.findUnique({
    where: { id: connectionId },
    include: { integrations: true },
  });

  if (!connection || !connection.refreshToken) {
    return null;
  }

  try {
    // This is a simplified version
    // In production, implement OAuth2 refresh flow for each integration
    console.log(`🔄 Refreshing connection: ${connectionId}`);
    
    // Placeholder: Actual refresh logic would go here
    // const newTokens = await refreshOAuth2Token(connection);
    
    return null;
  } catch (error) {
    console.error('Failed to refresh connection:', error);
    return null;
  }
}

/**
 * Validate connection credentials
 */
export async function validateConnection(connectionId: string): Promise<boolean> {
  const connection = await prisma.end_usersConnection.findUnique({
    where: { id: connectionId },
    include: { integrations: true },
  });

  if (!connection) {
    return false;
  }

  // Get integration from registry
  const { integrationRegistry } = await import('../integrations/registry');
  const integration = integrationRegistry.get(connection.integrations.slug);

  if (!integration || !integration.auth.validate) {
    return true; // Assume valid if no validation function
  }

  try {
    const credentials = await getConnection(connectionId);
    if (!credentials) return false;
    
    return await integration.auth.validate(credentials);
  } catch (error) {
    console.error('Connection validation failed:', error);
    return false;
  }
}

/**
 * Revoke connection
 */
export async function revokeConnection(connectionId: string): Promise<void> {
  await prisma.end_usersConnection.update({
    where: { id: connectionId },
    data: { status: 'revoked' },
  });

  console.log(`🔒 Revoked connection: ${connectionId}`);
}

/**
 * Delete connection
 */
export async function deleteConnection(connectionId: string): Promise<void> {
  await prisma.end_usersConnection.delete({
    where: { id: connectionId },
  });

  console.log(`🗑️  Deleted connection: ${connectionId}`);
}

/**
 * List connections for organization
 */
export async function listConnections(appId: string) {
  return await prisma.end_usersConnection.findMany({
    where: { appId },
    include: { integrations: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get connection statistics
 */
export async function getConnectionStats(connectionId: string) {
  // Get usage from executions
  const executions = await prisma.executions.findMany({
    where: {
      // Note: This query needs to be updated based on actual schema
      // For now, we'll just get all executions
    },
    select: {
      status: true,
      createdAt: true,
      completedAt: true,
    },
  });

  const total = executions.length;
  const successful = executions.filter(e => e.status === 'success').length;
  const failed = executions.filter(e => e.status === 'failed').length;

  return {
    totalExecutions: total,
    successfulExecutions: successful,
    failedExecutions: failed,
    successRate: total > 0 ? (successful / total) * 100 : 0,
  };
}

