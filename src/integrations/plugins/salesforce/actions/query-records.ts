import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import jsforce from 'jsforce';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Query Records Action for Salesforce
 * 
 * Queries Salesforce records using SOQL (Salesforce Object Query Language)
 * Supports complex queries and automatic retry
 */
export const queryRecords: IntegrationAction = {
  id: 'query_records',
  name: 'Query Records',
  description: 'Query Salesforce records using SOQL',
  
  inputSchema: z.object({
    query: z.string().describe('SOQL query (e.g., "SELECT Id, Name FROM Account WHERE Industry = \'Technology\'")'),
    maxRecords: z.number().min(1).max(2000).optional().default(100).describe('Maximum number of records to return'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    totalSize: z.number().optional(),
    records: z.array(z.any()).optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Querying Salesforce records', { query: input.query });
    
    try {
      // Initialize Salesforce connection
      const conn = new jsforce.Connection({
        instanceUrl: credentials.data.instanceUrl || 'https://login.salesforce.com',
        accessToken: credentials.data.accessToken,
      });

      // Query records with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await conn.query(input.query, { maxFetch: input.maxRecords });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'salesforce',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Salesforce query (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Query executed successfully', { 
        totalSize: result.totalSize,
        recordsReturned: result.records.length
      });
      
      return {
        success: true,
        data: {
          success: true,
          totalSize: result.totalSize,
          records: result.records,
        },
      };
    } catch (error) {
      logger.error('Failed to query Salesforce records', { error });
      
      return {
        success: false,
        error: {
          code: 'QUERY_RECORDS_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

