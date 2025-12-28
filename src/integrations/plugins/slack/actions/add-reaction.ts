import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { WebClient } from '@slack/web-api';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Add Reaction Action for Slack
 * 
 * Adds an emoji reaction to a Slack message using the official Slack SDK
 * Supports automatic retry
 */
export const addReaction: IntegrationAction = {
  id: 'add_reaction',
  name: 'Add Reaction',
  description: 'Add an emoji reaction to a Slack message',
  
  inputSchema: z.object({
    channel: z.string().describe('Channel ID where the message is'),
    timestamp: z.string().describe('Timestamp of the message to react to'),
    name: z.string().describe('Emoji name (without colons, e.g., "thumbsup", "heart", "rocket")'),
  }),

  outputSchema: z.object({
    ok: z.boolean(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Adding reaction to Slack message', { 
      channel: input.channel,
      emoji: input.name
    });
    
    try {
      // Initialize Slack client
      const slack = new WebClient(credentials.data.accessToken);

      // Add reaction with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await slack.reactions.add({
            channel: input.channel,
            timestamp: input.timestamp,
            name: input.name,
          });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'slack',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Slack add reaction (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      if (!result.ok) {
        throw new Error(`Slack API error: ${result.error || 'Unknown error'}`);
      }
      
      logger.info('Reaction added successfully', { 
        emoji: input.name
      });
      
      return {
        success: true,
        data: {
          ok: result.ok,
        },
      };
    } catch (error) {
      logger.error('Failed to add reaction to Slack message', { error });
      
      return {
        success: false,
        error: {
          code: 'ADD_REACTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

