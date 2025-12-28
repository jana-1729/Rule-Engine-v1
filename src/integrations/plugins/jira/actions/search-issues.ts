import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import JiraClient from 'jira-client';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Search Issues Action for Jira
 * 
 * Searches for issues in Jira using JQL (Jira Query Language)
 * Supports complex queries and field selection
 */
export const searchIssues: IntegrationAction = {
  id: 'search_issues',
  name: 'Search Issues',
  description: 'Search for issues in Jira using JQL',
  
  inputSchema: z.object({
    jql: z.string().describe('JQL query (e.g., "project = PROJ AND status = Open")'),
    maxResults: z.number().min(1).max(100).optional().default(50).describe('Maximum number of results'),
    fields: z.array(z.string()).optional().describe('Fields to return (default: all)'),
    startAt: z.number().optional().default(0).describe('Starting index for pagination'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    total: z.number().optional(),
    startAt: z.number().optional(),
    maxResults: z.number().optional(),
    issues: z.array(z.any()).optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Searching Jira issues', { jql: input.jql });
    
    try {
      // Initialize Jira client
      const jira = new JiraClient({
        protocol: 'https',
        host: credentials.data.host || 'your-domain.atlassian.net',
        username: credentials.data.username,
        password: credentials.data.apiToken || credentials.data.accessToken,
        apiVersion: '2',
        strictSSL: true,
      });

      // Build search options
      const searchOptions: any = {
        maxResults: input.maxResults,
        startAt: input.startAt,
      };
      
      if (input.fields && input.fields.length > 0) {
        searchOptions.fields = input.fields;
      }

      // Search issues with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await jira.searchJira(input.jql, searchOptions);
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'jira',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Jira search (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Search completed successfully', { 
        total: result.total,
        returned: result.issues.length
      });
      
      return {
        success: true,
        data: {
          success: true,
          total: result.total,
          startAt: result.startAt,
          maxResults: result.maxResults,
          issues: result.issues,
        },
      };
    } catch (error) {
      logger.error('Failed to search Jira issues', { error });
      
      return {
        success: false,
        error: {
          code: 'SEARCH_ISSUES_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

