import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import Trello from 'trello';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Add Checklist Action for Trello
 * 
 * Adds a checklist to a Trello card using the official SDK
 * Supports checklist items and positions
 */
export const addChecklist: IntegrationAction = {
  id: 'add_checklist',
  name: 'Add Checklist',
  description: 'Add a checklist to a Trello card',
  
  inputSchema: z.object({
    cardId: z.string().describe('Card ID'),
    name: z.string().describe('Checklist name'),
    pos: z.union([z.string(), z.number()]).optional().default('bottom').describe('Position (top, bottom, or number)'),
    items: z.array(z.object({
      name: z.string().describe('Item name'),
      checked: z.boolean().optional().default(false).describe('Item checked status'),
    })).optional().describe('Checklist items to add'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    name: z.string().optional(),
    checkItems: z.array(z.any()).optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Adding checklist to Trello card', { 
      cardId: input.cardId,
      name: input.name
    });
    
    try {
      // Initialize Trello client
      const trello = new Trello(
        credentials.data.apiKey || process.env.TRELLO_API_KEY,
        credentials.data.token || credentials.data.accessToken
      );

      // Add checklist with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          // Create checklist
          const checklist = await trello.addChecklistToCard(
            input.cardId,
            input.name
          );
          
          // Add items if provided
          if (input.items && input.items.length > 0) {
            for (const item of input.items) {
              await trello.addItemToChecklist(
                checklist.id,
                item.name,
                item.checked ? 'complete' : 'incomplete'
              );
            }
            
            // Fetch updated checklist with items
            return await trello.makeRequest('get', `/1/checklists/${checklist.id}`, {
              fields: 'all',
              checkItems: 'all',
            });
          }
          
          return checklist;
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'trello',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Trello add checklist (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Checklist added successfully', { 
        checklistId: result.id,
        checklistName: result.name,
        itemCount: result.checkItems?.length || 0
      });
      
      return {
        success: true,
        data: {
          success: true,
          id: result.id,
          name: result.name,
          checkItems: result.checkItems || [],
        },
      };
    } catch (error) {
      logger.error('Failed to add checklist to Trello card', { error });
      
      return {
        success: false,
        error: {
          code: 'ADD_CHECKLIST_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

