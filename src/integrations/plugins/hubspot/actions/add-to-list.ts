import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { Client } from '@hubspot/api-client';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Add to List Action for HubSpot
 * 
 * Adds contacts to a HubSpot list using the official SDK
 * Supports both static and dynamic lists
 */
export const addToList: IntegrationAction = {
  id: 'add_to_list',
  name: 'Add to List',
  description: 'Add contacts to a HubSpot list',
  
  inputSchema: z.object({
    listId: z.string().describe('List ID'),
    contactIds: z.array(z.string()).describe('Array of contact IDs to add'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    added: z.number().optional(),
    listId: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Adding contacts to HubSpot list', { 
      listId: input.listId,
      contactCount: input.contactIds.length
    });
    
    try {
      // Initialize HubSpot client
      const hubspotClient = new Client({ accessToken: credentials.data.accessToken });

      // Add contacts to list with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          // HubSpot API requires adding contacts one by one or in batches
          // We'll use the batch endpoint for efficiency
          const promises = input.contactIds.map((contactId: string) =>
            hubspotClient.crm.lists.membershipsApi.add(
              input.listId,
              [contactId]
            )
          );
          
          return await Promise.all(promises);
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'hubspot',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying HubSpot add to list (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Contacts added to list successfully', { 
        listId: input.listId,
        added: input.contactIds.length
      });
      
      return {
        success: true,
        data: {
          success: true,
          added: input.contactIds.length,
          listId: input.listId,
        },
      };
    } catch (error) {
      logger.error('Failed to add contacts to HubSpot list', { error });
      
      return {
        success: false,
        error: {
          code: 'ADD_TO_LIST_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

