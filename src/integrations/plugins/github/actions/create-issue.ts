import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Create Issue Action for GitHub
 * 
 * Creates a new issue in a GitHub repository using Octokit SDK
 * Supports labels, assignees, and milestones
 */
export const createIssue: IntegrationAction = {
  id: 'create_issue',
  name: 'Create Issue',
  description: 'Create a new issue in a GitHub repository',
  
  inputSchema: z.object({
    owner: z.string().describe('Repository owner (username or organization)'),
    repo: z.string().describe('Repository name'),
    title: z.string().describe('Issue title'),
    body: z.string().optional().describe('Issue body (supports Markdown)'),
    labels: z.array(z.string()).optional().describe('Labels'),
    assignees: z.array(z.string()).optional().describe('Assignee usernames'),
    milestone: z.number().optional().describe('Milestone number'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    number: z.number().optional(),
    id: z.number().optional(),
    url: z.string().optional(),
    html_url: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Creating GitHub issue', { 
      owner: input.owner,
      repo: input.repo,
      title: input.title
    });
    
    try {
      // Initialize Octokit client
      const octokit = new Octokit({
        auth: credentials.data.accessToken,
      });

      // Build issue data
      const issueData: any = {
        owner: input.owner,
        repo: input.repo,
        title: input.title,
      };
      
      if (input.body) issueData.body = input.body;
      if (input.labels && input.labels.length > 0) issueData.labels = input.labels;
      if (input.assignees && input.assignees.length > 0) issueData.assignees = input.assignees;
      if (input.milestone) issueData.milestone = input.milestone;

      // Create issue with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await octokit.issues.create(issueData);
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'github',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying GitHub issue creation (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Issue created successfully', { 
        issueNumber: result.data.number,
        issueUrl: result.data.html_url
      });
      
      return {
        success: true,
        data: {
          success: true,
          number: result.data.number,
          id: result.data.id,
          url: result.data.url,
          html_url: result.data.html_url,
        },
      };
    } catch (error) {
      logger.error('Failed to create GitHub issue', { error });
      
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

