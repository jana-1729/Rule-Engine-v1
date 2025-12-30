import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';
import crypto from 'crypto';

/**
 * ConnectionManager - Handles end-user OAuth connections
 * 
 * Features:
 * - OAuth flow management
 * - Credential encryption/decryption
 * - Connection health monitoring
 * - Error tracking and recovery
 * - Automatic token refresh
 */

interface ConnectionCredentials {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scope?: string | null;
}

interface ConnectionStatus {
  id: string;
  status: 'active' | 'expired' | 'revoked' | 'error' | 'refreshing';
  lastUsedAt?: Date | null;
  lastErrorAt?: Date | null;
  errorCount: number;
  consecutiveErrors: number;
  integration: {
    id: string;
    slug: string;
    name: string;
    logo?: string | null;
  };
}

interface OAuthInitiateResult {
  authUrl: string;
  state: string;
}

export class ConnectionManager {
  /**
   * Check if end user has active connection for integration
   */
  async hasConnection(endUserId: string, integrationSlug: string): Promise<boolean> {
    try {
      const integration = await prisma.integration.findUnique({
        where: { slug: integrationSlug },
      });
      
      if (!integration) {
        console.warn(`[ConnectionManager] Integration not found: ${integrationSlug}`);
        return false;
      }
      
      const connection = await prisma.endUserConnection.findUnique({
        where: {
          endUserId_integrationId: {
            endUserId,
            integrationId: integration.id,
          },
        },
      });
      
      if (!connection) return false;
      
      // Check if connection is active and not expired
      const isActive = connection.status === 'active';
      const isNotExpired = !connection.expiresAt || connection.expiresAt > new Date();
      
      return isActive && isNotExpired;
    } catch (error) {
      console.error('[ConnectionManager] Error checking connection:', error);
      return false;
    }
  }
  
  /**
   * Get connection with decrypted credentials
   */
  async getConnection(
    endUserId: string, 
    integrationSlug: string
  ): Promise<(ConnectionStatus & { credentials: ConnectionCredentials }) | null> {
    try {
      const integration = await prisma.integration.findUnique({
        where: { slug: integrationSlug },
      });
      
      if (!integration) {
        throw new Error(`Integration not found: ${integrationSlug}`);
      }
      
      const connection = await prisma.endUserConnection.findUnique({
        where: {
          endUserId_integrationId: {
            endUserId,
            integrationId: integration.id,
          },
        },
        include: {
          integration: {
            select: {
              id: true,
              slug: true,
              name: true,
              logo: true,
            },
          },
        },
      });
      
      if (!connection) {
        console.info(`[ConnectionManager] No connection found for user ${endUserId} and integration ${integrationSlug}`);
        return null;
      }
      
      // Check if token is expired
      if (connection.expiresAt && connection.expiresAt < new Date()) {
        console.warn(`[ConnectionManager] Token expired for connection ${connection.id}`);
        
        // Attempt to refresh if possible
        if (connection.refreshToken) {
          try {
            return await this.refreshConnection(connection.id);
          } catch (refreshError) {
            console.error('[ConnectionManager] Failed to refresh token:', refreshError);
            // Mark as expired
            await prisma.endUserConnection.update({
              where: { id: connection.id },
              data: { status: 'expired' },
            });
            throw new Error('Connection expired and refresh failed');
          }
        } else {
          // No refresh token, mark as expired
          await prisma.endUserConnection.update({
            where: { id: connection.id },
            data: { status: 'expired' },
          });
          throw new Error('Connection expired');
        }
      }
      
      // Decrypt credentials
      const accessToken = await decrypt(connection.accessToken);
      const refreshToken = connection.refreshToken 
        ? await decrypt(connection.refreshToken) 
        : null;
      
      return {
        id: connection.id,
        status: connection.status as any,
        lastUsedAt: connection.lastUsedAt,
        lastErrorAt: connection.lastErrorAt,
        errorCount: connection.errorCount,
        consecutiveErrors: connection.consecutiveErrors,
        integration: connection.integration,
        credentials: {
          accessToken,
          refreshToken,
          expiresAt: connection.expiresAt,
          scope: connection.scope,
        },
      };
    } catch (error) {
      console.error('[ConnectionManager] Error getting connection:', error);
      throw error;
    }
  }
  
  /**
   * Initiate OAuth flow for end user
   */
  async initiateOAuth(
    appId: string,
    endUserId: string, 
    integrationSlug: string,
    redirectUri?: string
  ): Promise<OAuthInitiateResult> {
    try {
      const integration = await prisma.integration.findUnique({
        where: { slug: integrationSlug },
      });
      
      if (!integration) {
        throw new Error(`Integration not found: ${integrationSlug}`);
      }
      
      if (integration.authType !== 'oauth2') {
        throw new Error(`Integration ${integrationSlug} does not support OAuth2`);
      }
      
      const authConfig = integration.authConfig as any;
      
      if (!authConfig.authorizationUrl || !authConfig.tokenUrl) {
        throw new Error(`Invalid OAuth configuration for ${integrationSlug}`);
      }
      
      // Generate secure state
      const state = crypto.randomBytes(32).toString('base64url');
      
      // Store OAuth state
      await prisma.oAuthState.create({
        data: {
          state,
          appId,
          endUserId,
          integrationId: integration.id,
          redirectUri: redirectUri || '',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      });
      
      // Build OAuth URL
      const clientId = authConfig.clientId || 
                      process.env[`${integrationSlug.toUpperCase().replace(/-/g, '_')}_CLIENT_ID`] || 
                      '';
      
      if (!clientId) {
        throw new Error(`OAuth client ID not configured for ${integrationSlug}`);
      }
      
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/connections/callback`,
        state,
        scope: (authConfig.scopes || []).join(' '),
        response_type: 'code',
      });
      
      const authUrl = `${authConfig.authorizationUrl}?${params.toString()}`;
      
      console.info(`[ConnectionManager] OAuth initiated for user ${endUserId}, integration ${integrationSlug}`);
      
      return { authUrl, state };
    } catch (error) {
      console.error('[ConnectionManager] Error initiating OAuth:', error);
      throw error;
    }
  }
  
  /**
   * Handle OAuth callback and store credentials
   */
  async handleOAuthCallback(code: string, state: string) {
    try {
      // Find and validate OAuth state
      const oauthState = await prisma.oAuthState.findUnique({
        where: { state },
        include: {
          integration: true,
          endUser: true,
        },
      });
      
      if (!oauthState) {
        throw new Error('Invalid OAuth state');
      }
      
      if (oauthState.expiresAt < new Date()) {
        await prisma.oAuthState.delete({ where: { state } });
        throw new Error('OAuth state expired');
      }
      
      if (oauthState.usedAt) {
        throw new Error('OAuth state already used');
      }
      
      const integration = oauthState.integration;
      const authConfig = integration.authConfig as any;
      
      // Get client credentials
      const clientId = authConfig.clientId || 
                      process.env[`${integration.slug.toUpperCase().replace(/-/g, '_')}_CLIENT_ID`] || 
                      '';
      const clientSecret = authConfig.clientSecret || 
                          process.env[`${integration.slug.toUpperCase().replace(/-/g, '_')}_CLIENT_SECRET`] || 
                          '';
      
      if (!clientId || !clientSecret) {
        throw new Error(`OAuth credentials not configured for ${integration.slug}`);
      }
      
      // Exchange code for token
      console.info(`[ConnectionManager] Exchanging OAuth code for token: ${integration.slug}`);
      
      const tokenResponse = await fetch(authConfig.tokenUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/connections/callback`,
        }),
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('[ConnectionManager] Token exchange failed:', errorText);
        throw new Error(`Failed to exchange code for token: ${tokenResponse.status} ${errorText}`);
      }
      
      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        throw new Error('No access token in response');
      }
      
      // Encrypt tokens
      const encryptedAccessToken = await encrypt(tokens.access_token);
      const encryptedRefreshToken = tokens.refresh_token 
        ? await encrypt(tokens.refresh_token) 
        : null;
      
      // Calculate expiry
      const expiresAt = tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000) 
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
          expiresAt,
          scope: tokens.scope,
          status: 'active',
          lastUsedAt: new Date(),
          errorCount: 0,
          consecutiveErrors: 0,
          metadata: tokens.metadata || undefined,
        },
        update: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
          scope: tokens.scope,
          status: 'active',
          lastUsedAt: new Date(),
          lastError: undefined,
          lastErrorAt: undefined,
          errorCount: 0,
          consecutiveErrors: 0,
          metadata: tokens.metadata || undefined,
        },
      });
      
      // Mark OAuth state as used
      await prisma.oAuthState.update({
        where: { state },
        data: { usedAt: new Date() },
      });
      
      // Clean up old OAuth states (older than 1 hour)
      await prisma.oAuthState.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(Date.now() - 60 * 60 * 1000),
          },
        },
      });
      
      console.info(`[ConnectionManager] Connection created/updated: ${connection.id}`);
      
      return connection;
    } catch (error) {
      console.error('[ConnectionManager] Error handling OAuth callback:', error);
      throw error;
    }
  }
  
  /**
   * Refresh an expired connection
   */
  async refreshConnection(connectionId: string) {
    try {
      const connection = await prisma.endUserConnection.findUnique({
        where: { id: connectionId },
        include: {
          integration: true,
        },
      });
      
      if (!connection) {
        throw new Error('Connection not found');
      }
      
      if (!connection.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const integration = connection.integration;
      const authConfig = integration.authConfig as any;
      
      // Mark as refreshing
      await prisma.endUserConnection.update({
        where: { id: connectionId },
        data: { status: 'refreshing' },
      });
      
      const clientId = authConfig.clientId || 
                      process.env[`${integration.slug.toUpperCase().replace(/-/g, '_')}_CLIENT_ID`] || 
                      '';
      const clientSecret = authConfig.clientSecret || 
                          process.env[`${integration.slug.toUpperCase().replace(/-/g, '_')}_CLIENT_SECRET`] || 
                          '';
      
      const refreshToken = await decrypt(connection.refreshToken);
      
      console.info(`[ConnectionManager] Refreshing token for connection ${connectionId}`);
      
      const tokenResponse = await fetch(authConfig.tokenUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('[ConnectionManager] Token refresh failed:', errorText);
        
        // Mark as error
        await prisma.endUserConnection.update({
          where: { id: connectionId },
          data: { 
            status: 'error',
            lastError: {
              code: 'REFRESH_FAILED',
              message: errorText,
              timestamp: new Date().toISOString(),
            },
            lastErrorAt: new Date(),
            consecutiveErrors: connection.consecutiveErrors + 1,
          },
        });
        
        throw new Error(`Failed to refresh token: ${tokenResponse.status}`);
      }
      
      const tokens = await tokenResponse.json();
      
      // Encrypt new tokens
      const encryptedAccessToken = await encrypt(tokens.access_token);
      const encryptedRefreshToken = tokens.refresh_token 
        ? await encrypt(tokens.refresh_token) 
        : connection.refreshToken; // Keep old refresh token if new one not provided
      
      const expiresAt = tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000) 
        : null;
      
      // Update connection
      const updatedConnection = await prisma.endUserConnection.update({
        where: { id: connectionId },
        data: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
          scope: tokens.scope || connection.scope,
          status: 'active',
          lastUsedAt: new Date(),
          lastError: undefined,
          lastErrorAt: undefined,
          consecutiveErrors: 0,
        },
      });
      
      // Fetch the updated connection with integration details
      const updatedConnectionWithIntegration = await prisma.endUserConnection.findUnique({
        where: { id: connectionId },
        include: {
          integration: {
            select: {
              id: true,
              slug: true,
              name: true,
              logo: true,
            },
          },
        },
      });
      
      if (!updatedConnectionWithIntegration) {
        throw new Error('Failed to fetch updated connection');
      }
      
      console.info(`[ConnectionManager] Token refreshed successfully for connection ${connectionId}`);
      
      // Decrypt and return
      const accessToken = await decrypt(updatedConnectionWithIntegration.accessToken);
      const newRefreshToken = updatedConnectionWithIntegration.refreshToken 
        ? await decrypt(updatedConnectionWithIntegration.refreshToken) 
        : null;
      
      return {
        id: updatedConnectionWithIntegration.id,
        status: updatedConnectionWithIntegration.status as any,
        lastUsedAt: updatedConnectionWithIntegration.lastUsedAt,
        lastErrorAt: updatedConnectionWithIntegration.lastErrorAt,
        errorCount: updatedConnectionWithIntegration.errorCount,
        consecutiveErrors: updatedConnectionWithIntegration.consecutiveErrors,
        integration: updatedConnectionWithIntegration.integration,
        credentials: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresAt: updatedConnection.expiresAt,
          scope: updatedConnection.scope,
        },
      };
    } catch (error) {
      console.error('[ConnectionManager] Error refreshing connection:', error);
      throw error;
    }
  }
  
  /**
   * Disconnect integration for end user
   */
  async disconnect(endUserId: string, integrationSlug: string): Promise<void> {
    try {
      const integration = await prisma.integration.findUnique({
        where: { slug: integrationSlug },
      });
      
      if (!integration) {
        throw new Error(`Integration not found: ${integrationSlug}`);
      }
      
      await prisma.endUserConnection.delete({
        where: {
          endUserId_integrationId: {
            endUserId,
            integrationId: integration.id,
          },
        },
      });
      
      console.info(`[ConnectionManager] Connection disconnected for user ${endUserId}, integration ${integrationSlug}`);
    } catch (error) {
      console.error('[ConnectionManager] Error disconnecting:', error);
      throw error;
    }
  }
  
  /**
   * Get all connections for end user
   */
  async getUserConnections(endUserId: string): Promise<ConnectionStatus[]> {
    try {
      const connections = await prisma.endUserConnection.findMany({
        where: { endUserId },
        include: {
          integration: {
            select: {
              id: true,
              slug: true,
              name: true,
              logo: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      return connections.map(conn => ({
        id: conn.id,
        status: conn.status as any,
        lastUsedAt: conn.lastUsedAt,
        lastErrorAt: conn.lastErrorAt,
        errorCount: conn.errorCount,
        consecutiveErrors: conn.consecutiveErrors,
        integration: conn.integration,
      }));
    } catch (error) {
      console.error('[ConnectionManager] Error getting user connections:', error);
      throw error;
    }
  }
  
  /**
   * Record connection error
   */
  async recordConnectionError(
    connectionId: string, 
    error: { code: string; message: string; recoverable?: boolean }
  ): Promise<void> {
    try {
      const connection = await prisma.endUserConnection.findUnique({
        where: { id: connectionId },
      });
      
      if (!connection) return;
      
      const consecutiveErrors = connection.consecutiveErrors + 1;
      const shouldMarkAsError = consecutiveErrors >= 3; // After 3 consecutive errors
      
      await prisma.endUserConnection.update({
        where: { id: connectionId },
        data: {
          status: shouldMarkAsError ? 'error' : connection.status,
          lastError: {
            ...error,
            timestamp: new Date().toISOString(),
          },
          lastErrorAt: new Date(),
          errorCount: connection.errorCount + 1,
          consecutiveErrors,
        },
      });
      
      console.warn(`[ConnectionManager] Error recorded for connection ${connectionId}:`, error);
    } catch (err) {
      console.error('[ConnectionManager] Error recording connection error:', err);
    }
  }
  
  /**
   * Mark connection as used (updates lastUsedAt)
   */
  async markConnectionUsed(connectionId: string): Promise<void> {
    try {
      await prisma.endUserConnection.update({
        where: { id: connectionId },
        data: { 
          lastUsedAt: new Date(),
          consecutiveErrors: 0, // Reset on successful use
        },
      });
    } catch (error) {
      console.error('[ConnectionManager] Error marking connection as used:', error);
    }
  }
}

export const connectionManager = new ConnectionManager();

