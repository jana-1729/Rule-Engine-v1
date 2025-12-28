import { IntegrationAction } from '../../../types';
import { z } from 'zod';

export const sendMessage: IntegrationAction = {
  id: 'send_message',
  name: 'Send Message',
  description: 'Send a message to a Discord channel',
  
  inputSchema: z.object({
    channelId: z.string().describe('Channel ID'),
    content: z.string().describe('Message content'),
    embeds: z.array(z.any()).optional().describe('Message embeds'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    timestamp: z.string().optional(),
  }),

  async execute(input, context) {
    const { credentials, logger } = context;
    
    logger.info('Sending message to Discord', { input });
    
    try {
      const response = await fetch(
        `https://discord.com/api/v10/channels/${input.channelId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: input.content,
            embeds: input.embeds,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Discord API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          success: true,
          id: data.id,
          timestamp: data.timestamp,
        },
      };
    } catch (error) {
      logger.error('Failed to send message', { error });
      
      return {
        success: false,
        error: {
          code: 'EXECUTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

