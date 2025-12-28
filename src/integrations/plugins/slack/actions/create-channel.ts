import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { WebClient } from '@slack/web-api';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Create Channel Action for Slack
 * 
 * Creates a new Slack channel using the official Slack SDK
 * Supports both public and private channels with automatic retry
 */
export const createChannel: IntegrationAction = {
  id: 'create_channel',
  name: 'Create Channel',
  description: 'Create a new Slack channel',
  
  inputSchema: z.object({
    name: z.string().describe('Channel name (lowercase, no spaces, max 80 chars)'),
    is_private: z.boolean().optional().default(false).describe('Whether the channel should be private'),
  }),

  outputSchema: z.object({
    ok: z.boolean(),
    channel: z.object({
      id: z.string(),
      name: z.string(),
      is_private: z.boolean().optional(),
      created: z.number().optional(),
    }),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Creating Slack channel', { name: input.name });
    
    try {
      // Initialize Slack client
      const slack = new WebClient(credentials.data.accessToken);

      // Create channel with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await slack.conversations.create({
            name: input.name,
            is_private: input.is_private,
          });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'slack',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Slack channel creation (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      if (!result.ok) {
        throw new Error(`Slack API error: ${result.error || 'Unknown error'}`);
      }
      
      logger.info('Slack channel created successfully', { 
        channelId: result.channel?.id,
        channelName: result.channel?.name
      });
      
      return {
        success: true,
        data: {
          ok: result.ok,
          channel: {
            id: result.channel?.id || '',
            name: result.channel?.name || input.name,
            is_private: result.channel?.is_private,
            created: result.channel?.created,
          },
        },
      };
    } catch (error) {
      logger.error('Failed to create Slack channel', { error });
      
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

