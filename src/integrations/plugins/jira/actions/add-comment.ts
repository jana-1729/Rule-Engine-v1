import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import JiraClient from 'jira-client';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Add Comment Action for Jira
 * 
 * Adds a comment to a Jira issue using the official SDK
 * Supports rich text formatting
 */
export const addComment: IntegrationAction = {
  id: 'add_comment',
  name: 'Add Comment',
  description: 'Add a comment to a Jira issue',
  
  inputSchema: z.object({
    issueKey: z.string().describe('Issue key (e.g., PROJ-123)'),
    body: z.string().describe('Comment body'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    self: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Adding comment to Jira issue', { issueKey: input.issueKey });
    
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

      // Add comment with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await jira.addComment(input.issueKey, input.body);
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'jira',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Jira add comment (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Comment added successfully', { 
        issueKey: input.issueKey,
        commentId: result.id
      });
      
      return {
        success: true,
        data: {
          success: true,
          id: result.id,
          self: result.self,
        },
      };
    } catch (error) {
      logger.error('Failed to add comment to Jira issue', { error });
      
      return {
        success: false,
        error: {
          code: 'ADD_COMMENT_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

