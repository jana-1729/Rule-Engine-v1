import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { Client } from '@notionhq/client';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Query Database Action for Notion
 * 
 * Queries a Notion database with filters and sorting
 * Uses the official Notion SDK
 */
export const queryDatabase: IntegrationAction = {
  id: 'query_database',
  name: 'Query Database',
  description: 'Query a Notion database with filters and sorting',
  
  inputSchema: z.object({
    database_id: z.string().describe('Database ID to query'),
    filter: z.any().optional().describe('Filter object (Notion API format)'),
    sorts: z.array(z.any()).optional().describe('Sort configuration'),
    page_size: z.number().min(1).max(100).optional().default(100).describe('Number of results per page'),
    start_cursor: z.string().optional().describe('Pagination cursor'),
  }),

  outputSchema: z.object({
    results: z.array(z.any()),
    has_more: z.boolean(),
    next_cursor: z.string().nullable(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Querying Notion database', { database_id: input.database_id });
    
    try {
      // Initialize Notion client
      const notion = new Client({
        auth: credentials.data.accessToken,
      });

      // Query database with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          // @ts-ignore - Notion SDK types are incomplete
          return await notion.databases.query({
            database_id: input.database_id,
            filter: input.filter,
            sorts: input.sorts,
            page_size: input.page_size || 100,
            start_cursor: input.start_cursor,
          });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'notion',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Notion database query (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Notion database queried successfully', { 
        results_count: result.results.length,
        has_more: result.has_more,
      });
      
      return {
        success: true,
        data: {
          results: result.results,
          has_more: result.has_more,
          next_cursor: result.next_cursor,
        },
      };
    } catch (error) {
      logger.error('Failed to query Notion database', { error });
      
      return {
        success: false,
        error: {
          code: 'QUERY_DATABASE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

