import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { Client } from '@notionhq/client';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Update Page Action for Notion
 * 
 * Updates an existing page's properties in Notion
 * Uses the official Notion SDK
 */
export const updatePage: IntegrationAction = {
  id: 'update_page',
  name: 'Update Page',
  description: 'Update a Notion page properties',
  
  inputSchema: z.object({
    page_id: z.string().describe('Page ID to update'),
    properties: z.record(z.any()).describe('Properties to update'),
    archived: z.boolean().optional().describe('Archive the page'),
  }),

  outputSchema: z.object({
    id: z.string(),
    last_edited_time: z.string(),
    archived: z.boolean(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Updating Notion page', { page_id: input.page_id });
    
    try {
      // Initialize Notion client
      const notion = new Client({
        auth: credentials.data.accessToken,
      });

      // Update page with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await notion.pages.update({
            page_id: input.page_id,
            properties: input.properties,
            archived: input.archived,
          });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'notion',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Notion page update (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Notion page updated successfully', { pageId: result.id });
      
      return {
        success: true,
        data: {
          id: result.id,
          last_edited_time: (result as any).last_edited_time || new Date().toISOString(),
          archived: (result as any).archived || false,
        },
      };
    } catch (error) {
      logger.error('Failed to update Notion page', { error });
      
      return {
        success: false,
        error: {
          code: 'UPDATE_PAGE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

