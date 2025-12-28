import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Create Pull Request Action for GitHub
 * 
 * Creates a new pull request in a GitHub repository using Octokit SDK
 * Supports draft PRs, reviewers, and auto-merge
 */
export const createPR: IntegrationAction = {
  id: 'create_pr',
  name: 'Create Pull Request',
  description: 'Create a new pull request in a GitHub repository',
  
  inputSchema: z.object({
    owner: z.string().describe('Repository owner (username or organization)'),
    repo: z.string().describe('Repository name'),
    title: z.string().describe('Pull request title'),
    head: z.string().describe('Branch name containing changes'),
    base: z.string().describe('Branch name to merge into (e.g., main)'),
    body: z.string().optional().describe('Pull request body (supports Markdown)'),
    draft: z.boolean().optional().default(false).describe('Create as draft PR'),
    maintainer_can_modify: z.boolean().optional().default(true).describe('Allow maintainers to modify'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    number: z.number().optional(),
    id: z.number().optional(),
    url: z.string().optional(),
    html_url: z.string().optional(),
    state: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Creating GitHub pull request', { 
      owner: input.owner,
      repo: input.repo,
      title: input.title,
      head: input.head,
      base: input.base
    });
    
    try {
      // Initialize Octokit client
      const octokit = new Octokit({
        auth: credentials.data.accessToken,
      });

      // Build PR data
      const prData: any = {
        owner: input.owner,
        repo: input.repo,
        title: input.title,
        head: input.head,
        base: input.base,
        draft: input.draft,
        maintainer_can_modify: input.maintainer_can_modify,
      };
      
      if (input.body) prData.body = input.body;

      // Create pull request with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await octokit.pulls.create(prData);
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'github',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying GitHub PR creation (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Pull request created successfully', { 
        prNumber: result.data.number,
        prUrl: result.data.html_url
      });
      
      return {
        success: true,
        data: {
          success: true,
          number: result.data.number,
          id: result.data.id,
          url: result.data.url,
          html_url: result.data.html_url,
          state: result.data.state,
        },
      };
    } catch (error) {
      logger.error('Failed to create GitHub pull request', { error });
      
      return {
        success: false,
        error: {
          code: 'CREATE_PR_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

