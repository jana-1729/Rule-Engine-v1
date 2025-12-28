import { IntegrationAction } from '../../../types';
import { z } from 'zod';

/**
 * Send Message Action for Microsoft Teams
 */
export const sendMessage: IntegrationAction = {
  id: 'send_message',
  name: 'Send Message',
  description: 'Send a message to a Microsoft Teams channel',
  
  inputSchema: z.object({
    teamId: z.string().describe('Team ID'),
    channelId: z.string().describe('Channel ID'),
    message: z.string().describe('Message content'),
    contentType: z.enum(['text', 'html']).optional().default('text').describe('Content type'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    timestamp: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Sending message to Microsoft Teams', { input });
    
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/teams/${input.teamId}/channels/${input.channelId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credentials.data.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: {
              contentType: input.contentType,
              content: input.message,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Microsoft Teams API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      logger.info('Message sent successfully', { data });
      
      return {
        success: true,
        data: {
          success: true,
          id: data.id,
          timestamp: data.createdDateTime || new Date().toISOString(),
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

