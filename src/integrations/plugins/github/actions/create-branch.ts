import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Create Branch Action for GitHub
 * 
 * Creates a new branch in a GitHub repository using Octokit SDK
 * Branches from any existing ref (branch, tag, or commit)
 */
export const createBranch: IntegrationAction = {
  id: 'create_branch',
  name: 'Create Branch',
  description: 'Create a new branch in a GitHub repository',
  
  inputSchema: z.object({
    owner: z.string().describe('Repository owner (username or organization)'),
    repo: z.string().describe('Repository name'),
    branch: z.string().describe('New branch name'),
    from_branch: z.string().optional().default('main').describe('Source branch to create from'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    ref: z.string().optional(),
    sha: z.string().optional(),
    url: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Creating GitHub branch', { 
      owner: input.owner,
      repo: input.repo,
      branch: input.branch,
      from: input.from_branch
    });
    
    try {
      // Initialize Octokit client
      const octokit = new Octokit({
        auth: credentials.data.accessToken,
      });

      // Create branch with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          // First, get the SHA of the source branch
          const sourceRef = await octokit.git.getRef({
            owner: input.owner,
            repo: input.repo,
            ref: `heads/${input.from_branch}`,
          });
          
          const sourceSha = sourceRef.data.object.sha;
          
          // Create the new branch
          return await octokit.git.createRef({
            owner: input.owner,
            repo: input.repo,
            ref: `refs/heads/${input.branch}`,
            sha: sourceSha,
          });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'github',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying GitHub branch creation (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Branch created successfully', { 
        branch: input.branch,
        ref: result.data.ref,
        sha: result.data.object.sha
      });
      
      return {
        success: true,
        data: {
          success: true,
          ref: result.data.ref,
          sha: result.data.object.sha,
          url: result.data.url,
        },
      };
    } catch (error) {
      logger.error('Failed to create GitHub branch', { error });
      
      return {
        success: false,
        error: {
          code: 'CREATE_BRANCH_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

