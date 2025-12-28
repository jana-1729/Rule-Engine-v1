import { IntegrationAction } from '../../../types';
import { z } from 'zod';

/**
 * Create Channel Action for Microsoft Teams
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
    webUrl: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Creating Microsoft Teams channel', { input });
    
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/teams/${input.teamId}/channels`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credentials.data.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            displayName: input.displayName,
            description: input.description,
            membershipType: input.membershipType,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Microsoft Teams API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      logger.info('Channel created successfully', { data });
      
      return {
        success: true,
        data: {
          success: true,
          id: data.id,
          webUrl: data.webUrl,
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

