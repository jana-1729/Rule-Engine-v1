import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import Trello from 'trello';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Move Card Action for Trello
 * 
 * Moves a card to a different list or board in Trello using the official SDK
 * Supports cross-board moves and position control
 */
export const moveCard: IntegrationAction = {
  id: 'move_card',
  name: 'Move Card',
  description: 'Move a card to a different list or board in Trello',
  
  inputSchema: z.object({
    cardId: z.string().describe('Card ID'),
    idList: z.string().optional().describe('Target list ID'),
    idBoard: z.string().optional().describe('Target board ID (for cross-board moves)'),
    pos: z.union([z.string(), z.number()]).optional().default('bottom').describe('Position in target list (top, bottom, or number)'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    name: z.string().optional(),
    idList: z.string().optional(),
    idBoard: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Moving Trello card', { 
      cardId: input.cardId,
      targetList: input.idList,
      targetBoard: input.idBoard
    });
    
    try {
      // Validate that at least one target is provided
      if (!input.idList && !input.idBoard) {
        throw new Error('Either idList or idBoard must be provided');
      }

      // Initialize Trello client
      const trello = new Trello(
        credentials.data.apiKey || process.env.TRELLO_API_KEY,
        credentials.data.token || credentials.data.accessToken
      );

      // Build move data
      const moveData: any = {
        pos: input.pos,
      };
      
      if (input.idList) moveData.idList = input.idList;
      if (input.idBoard) moveData.idBoard = input.idBoard;

      // Move card with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await trello.updateCard(input.cardId, moveData);
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'trello',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Trello card move (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Card moved successfully', { 
        cardId: result.id,
        cardName: result.name,
        newList: result.idList,
        newBoard: result.idBoard
      });
      
      return {
        success: true,
        data: {
          success: true,
          id: result.id,
          name: result.name,
          idList: result.idList,
          idBoard: result.idBoard,
        },
      };
    } catch (error) {
      logger.error('Failed to move Trello card', { error });
      
      return {
        success: false,
        error: {
          code: 'MOVE_CARD_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

