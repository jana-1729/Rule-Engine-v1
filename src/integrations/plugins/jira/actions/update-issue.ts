import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import JiraClient from 'jira-client';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Update Issue Action for Jira
 * 
 * Updates an existing issue in Jira using the official SDK
 * Supports transitions, custom fields, and partial updates
 */
export const updateIssue: IntegrationAction = {
  id: 'update_issue',
  name: 'Update Issue',
  description: 'Update an existing issue in Jira',
  
  inputSchema: z.object({
    issueKey: z.string().describe('Issue key (e.g., PROJ-123)'),
    summary: z.string().optional().describe('Issue summary'),
    description: z.string().optional().describe('Issue description'),
    priority: z.string().optional().describe('Priority'),
    assignee: z.string().optional().describe('Assignee username'),
    status: z.string().optional().describe('Status (will trigger transition if available)'),
    labels: z.array(z.string()).optional().describe('Labels'),
    customFields: z.record(z.any()).optional().describe('Custom fields'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    issueKey: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Updating Jira issue', { issueKey: input.issueKey });
    
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

      // Build update object (only include provided fields)
      const updateData: any = {
        fields: {},
      };
      
      if (input.summary) {
        updateData.fields.summary = input.summary;
      }
      
      if (input.description) {
        updateData.fields.description = input.description;
      }
      
      if (input.priority) {
        updateData.fields.priority = { name: input.priority };
      }
      
      if (input.assignee) {
        updateData.fields.assignee = { name: input.assignee };
      }
      
      if (input.labels) {
        updateData.fields.labels = input.labels;
      }
      
      // Add custom fields
      if (input.customFields) {
        Object.assign(updateData.fields, input.customFields);
      }

      // Update issue with automatic retry
      await errorRecovery.executeWithRetry(
        async () => {
          return await jira.updateIssue(input.issueKey, updateData);
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'jira',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Jira issue update (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      // Handle status transition if provided
      if (input.status) {
        try {
          const transitions = await jira.listTransitions(input.issueKey);
          const transition = transitions.transitions.find(
            (t: any) => t.name.toLowerCase() === input.status!.toLowerCase()
          );
          
          if (transition) {
            await jira.transitionIssue(input.issueKey, {
              transition: { id: transition.id },
            });
            logger.info('Issue transitioned successfully', { 
              issueKey: input.issueKey,
              status: input.status
            });
          }
        } catch (transitionError) {
          logger.warn('Failed to transition issue', { error: transitionError });
        }
      }
      
      logger.info('Issue updated successfully', { issueKey: input.issueKey });
      
      return {
        success: true,
        data: {
          success: true,
          issueKey: input.issueKey,
        },
      };
    } catch (error) {
      logger.error('Failed to update Jira issue', { error });
      
      return {
        success: false,
        error: {
          code: 'UPDATE_ISSUE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

