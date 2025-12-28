import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import Trello from 'trello';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Update Card Action for Trello
 * 
 * Updates an existing card in Trello using the official SDK
 * Supports partial updates and all card properties
 */
export const updateCard: IntegrationAction = {
  id: 'update_card',
  name: 'Update Card',
  description: 'Update an existing card in Trello',
  
  inputSchema: z.object({
    cardId: z.string().describe('Card ID'),
    name: z.string().optional().describe('Card name'),
    desc: z.string().optional().describe('Card description'),
    closed: z.boolean().optional().describe('Archive the card'),
    idList: z.string().optional().describe('Move to list ID'),
    idBoard: z.string().optional().describe('Move to board ID'),
    pos: z.union([z.string(), z.number()]).optional().describe('Position'),
    due: z.string().optional().describe('Due date (ISO 8601 format)'),
    dueComplete: z.boolean().optional().describe('Mark due date as complete'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    name: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Updating Trello card', { cardId: input.cardId });
    
    try {
      // Initialize Trello client
      const trello = new Trello(
        credentials.data.apiKey || process.env.TRELLO_API_KEY,
        credentials.data.token || credentials.data.accessToken
      );

      // Build update data (only include provided fields)
      const updateData: any = {};
      
      if (input.name !== undefined) updateData.name = input.name;
      if (input.desc !== undefined) updateData.desc = input.desc;
      if (input.closed !== undefined) updateData.closed = input.closed;
      if (input.idList) updateData.idList = input.idList;
      if (input.idBoard) updateData.idBoard = input.idBoard;
      if (input.pos !== undefined) updateData.pos = input.pos;
      if (input.due !== undefined) updateData.due = input.due;
      if (input.dueComplete !== undefined) updateData.dueComplete = input.dueComplete;

      // Update card with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await trello.updateCard(input.cardId, updateData);
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'trello',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Trello card update (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Card updated successfully', { 
        cardId: result.id,
        cardName: result.name
      });
      
      return {
        success: true,
        data: {
          success: true,
          id: result.id,
          name: result.name,
        },
      };
    } catch (error) {
      logger.error('Failed to update Trello card', { error });
      
      return {
        success: false,
        error: {
          code: 'UPDATE_CARD_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

