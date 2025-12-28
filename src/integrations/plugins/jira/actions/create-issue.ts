import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import JiraClient from 'jira-client';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Create Issue Action for Jira
 * 
 * Creates a new issue in Jira using the official SDK
 * Supports custom fields, labels, and components
 */
export const createIssue: IntegrationAction = {
  id: 'create_issue',
  name: 'Create Issue',
  description: 'Create a new issue in Jira',
  
  inputSchema: z.object({
    project: z.string().describe('Project key (e.g., PROJ)'),
    summary: z.string().describe('Issue summary'),
    description: z.string().optional().describe('Issue description'),
    issuetype: z.string().describe('Issue type (e.g., Bug, Task, Story)'),
    priority: z.string().optional().describe('Priority (e.g., High, Medium, Low)'),
    assignee: z.string().optional().describe('Assignee username'),
    labels: z.array(z.string()).optional().describe('Labels'),
    components: z.array(z.string()).optional().describe('Component names'),
    customFields: z.record(z.any()).optional().describe('Custom fields'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    key: z.string().optional(),
    self: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Creating Jira issue', { 
      project: input.project,
      summary: input.summary
    });
    
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

      // Build issue object
      const issueData: any = {
        fields: {
          project: {
            key: input.project,
          },
          summary: input.summary,
          issuetype: {
            name: input.issuetype,
          },
        },
      };
      
      if (input.description) {
        issueData.fields.description = input.description;
      }
      
      if (input.priority) {
        issueData.fields.priority = { name: input.priority };
      }
      
      if (input.assignee) {
        issueData.fields.assignee = { name: input.assignee };
      }
      
      if (input.labels && input.labels.length > 0) {
        issueData.fields.labels = input.labels;
      }
      
      if (input.components && input.components.length > 0) {
        issueData.fields.components = input.components.map((name: string) => ({ name }));
      }
      
      // Add custom fields
      if (input.customFields) {
        Object.assign(issueData.fields, input.customFields);
      }

      // Create issue with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await jira.addNewIssue(issueData);
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'jira',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Jira issue creation (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Issue created successfully', { 
        issueId: result.id,
        issueKey: result.key
      });
      
      return {
        success: true,
        data: {
          success: true,
          id: result.id,
          key: result.key,
          self: result.self,
        },
      };
    } catch (error) {
      logger.error('Failed to create Jira issue', { error });
      
      return {
        success: false,
        error: {
          code: 'CREATE_ISSUE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

