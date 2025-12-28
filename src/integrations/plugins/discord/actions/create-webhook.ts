import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { errorRecovery } from '@/services/error-recovery-service';
import axios from 'axios';

/**
 * Create Webhook Action for Discord
 * 
 * Creates a webhook for a Discord channel
 * Webhooks allow external services to post messages
 */
export const createWebhook: IntegrationAction = {
  id: 'create_webhook',
  name: 'Create Webhook',
  description: 'Create a webhook for a Discord channel',
  
  inputSchema: z.object({
    channelId: z.string().describe('Channel ID'),
    name: z.string().describe('Webhook name'),
    avatar: z.string().url().optional().describe('Webhook avatar URL (optional)'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    url: z.string().optional(),
    token: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Creating Discord webhook', { 
      channelId: input.channelId,
      name: input.name
    });
    
    try {
      // Create webhook with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await axios.post(
            `https://discord.com/api/v10/channels/${input.channelId}/webhooks`,
            {
              name: input.name,
              avatar: input.avatar,
            },
            {
              headers: {
                'Authorization': `Bot ${credentials.data.accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'discord',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Discord webhook creation (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      const webhookUrl = `https://discord.com/api/webhooks/${result.data.id}/${result.data.token}`;
      
      logger.info('Webhook created successfully', { 
        webhookId: result.data.id,
        webhookUrl
      });
      
      return {
        success: true,
        data: {
          success: true,
          id: result.data.id,
          url: webhookUrl,
          token: result.data.token,
        },
      };
    } catch (error) {
      logger.error('Failed to create Discord webhook', { error });
      
      return {
        success: false,
        error: {
          code: 'CREATE_WEBHOOK_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

