import { IntegrationAction } from '../../../types';
import { z } from 'zod';

export const createChannel: IntegrationAction = {
  id: 'create_channel',
  name: 'Create Channel',
  description: 'Create a new channel in a Discord server',
  
  inputSchema: z.object({
    guildId: z.string().describe('Server (Guild) ID'),
    name: z.string().describe('Channel name'),
    type: z.number().optional().default(0).describe('Channel type (0=text, 2=voice)'),
    topic: z.string().optional().describe('Channel topic'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    name: z.string().optional(),
  }),

  async execute(input, context) {
    const { credentials, logger } = context;
    
    logger.info('Creating Discord channel', { input });
    
    try {
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${input.guildId}/channels`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: input.name,
            type: input.type,
            topic: input.topic,
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
          name: data.name,
        },
      };
    } catch (error) {
      logger.error('Failed to create channel', { error });
      
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

