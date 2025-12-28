import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { Client } from '@notionhq/client';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Create Page Action for Notion
 * 
 * Creates a new page in Notion using the official Notion SDK
 * Supports both database and page parents
 */
export const createPage: IntegrationAction = {
  id: 'create_page',
  name: 'Create Page',
  description: 'Create a new page in Notion',
  
  inputSchema: z.object({
    parent_type: z.enum(['database_id', 'page_id']).describe('Type of parent'),
    parent_id: z.string().describe('Parent database or page ID'),
    title: z.string().describe('Page title'),
    content: z.string().optional().describe('Page content (plain text)'),
    properties: z.record(z.any()).optional().describe('Additional properties (for database pages)'),
  }),

  outputSchema: z.object({
    id: z.string(),
    url: z.string(),
    created_time: z.string(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Creating Notion page', { title: input.title, parent_id: input.parent_id });
    
    try {
      // Initialize Notion client
      const notion = new Client({
        auth: credentials.data.accessToken,
      });

      // Build parent object
      const parent: any = input.parent_type === 'database_id'
        ? { database_id: input.parent_id }
        : { page_id: input.parent_id };

      // Build properties
      const properties: any = input.properties || {};
      
      // Add title property
      if (input.parent_type === 'database_id') {
        // For database pages, title goes in properties
        properties.Name = {
          title: [
            {
              text: {
                content: input.title,
              },
            },
          ],
        };
      } else {
        // For page children, title is in properties
        properties.title = {
          title: [
            {
              text: {
                content: input.title,
              },
            },
          ],
        };
      }

      // Build children blocks
      const children: any[] = [];
      if (input.content) {
        children.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: input.content,
                },
              },
            ],
          },
        });
      }

      // Create page with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await notion.pages.create({
            parent,
            properties,
            children: children.length > 0 ? children : undefined,
          });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'notion',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Notion page creation (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Notion page created successfully', { pageId: result.id });
      
      return {
        success: true,
        data: {
          id: result.id,
          url: (result as any).url || '',
          created_time: (result as any).created_time || new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Failed to create Notion page', { error });
      
      return {
        success: false,
        error: {
          code: 'CREATE_PAGE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

