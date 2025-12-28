import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { Client } from '@microsoft/microsoft-graph-client';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Create Channel Action for Microsoft Teams
 * 
 * Creates a new channel in a Teams team using Microsoft Graph SDK
 * Supports standard and private channels
 */
export const createChannel: IntegrationAction = {
  id: 'create_channel',
  name: 'Create Channel',
  description: 'Create a new channel in a Microsoft Teams team',
  
  inputSchema: z.object({
    teamId: z.string().describe('Team ID'),
    displayName: z.string().describe('Channel display name'),
    description: z.string().optional().describe('Channel description'),
    membershipType: z.enum(['standard', 'private']).optional().default('standard').describe('Channel type'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    displayName: z.string().optional(),
    webUrl: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Creating Microsoft Teams channel', { 
      teamId: input.teamId,
      displayName: input.displayName
    });
    
    try {
      // Initialize Microsoft Graph client
      const client = Client.init({
        authProvider: (done) => {
          done(null, credentials.data.accessToken);
        },
      });

      // Create channel with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await client
            .api(`/teams/${input.teamId}/channels`)
            .post({
              displayName: input.displayName,
              description: input.description || '',
              membershipType: input.membershipType,
            });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'microsoft-teams',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Teams channel creation (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Channel created successfully', { 
        channelId: result.id,
        displayName: result.displayName
      });
      
      return {
        success: true,
        data: {
          success: true,
          id: result.id,
          displayName: result.displayName,
          webUrl: result.webUrl,
        },
      };
    } catch (error) {
      logger.error('Failed to create Teams channel', { error });
      
      return {
        success: false,
        error: {
          code: 'CREATE_CHANNEL_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};
