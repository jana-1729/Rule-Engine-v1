import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import Trello from 'trello';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Create Card Action for Trello
 * 
 * Creates a new card in a Trello list using the official SDK
 * Supports labels, members, due dates, and custom fields
 */
export const createCard: IntegrationAction = {
  id: 'create_card',
  name: 'Create Card',
  description: 'Create a new card in a Trello list',
  
  inputSchema: z.object({
    listId: z.string().describe('List ID where the card will be created'),
    name: z.string().describe('Card name'),
    desc: z.string().optional().describe('Card description (supports Markdown)'),
    pos: z.union([z.string(), z.number()]).optional().default('bottom').describe('Position (top, bottom, or number)'),
    due: z.string().optional().describe('Due date (ISO 8601 format)'),
    dueComplete: z.boolean().optional().describe('Mark due date as complete'),
    idMembers: z.array(z.string()).optional().describe('Member IDs to add to the card'),
    idLabels: z.array(z.string()).optional().describe('Label IDs to add to the card'),
    urlSource: z.string().url().optional().describe('URL source for the card'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    name: z.string().optional(),
    url: z.string().optional(),
    shortUrl: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Creating Trello card', { 
      listId: input.listId,
      name: input.name
    });
    
    try {
      // Initialize Trello client
      const trello = new Trello(
        credentials.data.apiKey || process.env.TRELLO_API_KEY,
        credentials.data.token || credentials.data.accessToken
      );

      // Build card data
      const cardData: any = {
        name: input.name,
        idList: input.listId,
        pos: input.pos,
      };
      
      if (input.desc) cardData.desc = input.desc;
      if (input.due) cardData.due = input.due;
      if (input.dueComplete !== undefined) cardData.dueComplete = input.dueComplete;
      if (input.idMembers && input.idMembers.length > 0) cardData.idMembers = input.idMembers.join(',');
      if (input.idLabels && input.idLabels.length > 0) cardData.idLabels = input.idLabels.join(',');
      if (input.urlSource) cardData.urlSource = input.urlSource;

      // Create card with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await trello.addCard(
            cardData.name,
            cardData.desc || '',
            cardData.idList,
            cardData.due,
            cardData.dueComplete,
            cardData.pos,
            cardData.idLabels,
            cardData.urlSource,
            cardData.idMembers
          );
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'trello',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Trello card creation (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Card created successfully', { 
        cardId: result.id,
        cardName: result.name,
        url: result.url
      });
      
      return {
        success: true,
        data: {
          success: true,
          id: result.id,
          name: result.name,
          url: result.url,
          shortUrl: result.shortUrl,
        },
      };
    } catch (error) {
      logger.error('Failed to create Trello card', { error });
      
      return {
        success: false,
        error: {
          code: 'CREATE_CARD_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

