import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { errorRecovery } from '@/services/error-recovery-service';
import axios from 'axios';

/**
 * Create Channel Action for Discord
 * 
 * Creates a new channel in a Discord server (guild)
 * Supports text, voice, and other channel types
 */
export const createChannel: IntegrationAction = {
  id: 'create_channel',
  name: 'Create Channel',
  description: 'Create a new channel in a Discord server',
  
  inputSchema: z.object({
    guildId: z.string().describe('Server (Guild) ID'),
    name: z.string().describe('Channel name'),
    type: z.number().optional().default(0).describe('Channel type (0=text, 2=voice, 4=category, 5=announcement)'),
    topic: z.string().optional().describe('Channel topic (text channels only)'),
    position: z.number().optional().describe('Channel position'),
    parentId: z.string().optional().describe('Parent category ID'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    name: z.string().optional(),
    type: z.number().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Creating Discord channel', { 
      guildId: input.guildId,
      name: input.name
    });
    
    try {
      // Create channel with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await axios.post(
            `https://discord.com/api/v10/guilds/${input.guildId}/channels`,
            {
              name: input.name,
              type: input.type,
              topic: input.topic,
              position: input.position,
              parent_id: input.parentId,
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
            logger.warn(`Retrying Discord channel creation (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Channel created successfully', { 
        channelId: result.data.id,
        channelName: result.data.name
      });
      
      return {
        success: true,
        data: {
          success: true,
          id: result.data.id,
          name: result.data.name,
          type: result.data.type,
        },
      };
    } catch (error) {
      logger.error('Failed to create Discord channel', { error });
      
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
