import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Merge Pull Request Action for GitHub
 * 
 * Merges a pull request in a GitHub repository using Octokit SDK
 * Supports different merge methods (merge, squash, rebase)
 */
export const mergePR: IntegrationAction = {
  id: 'merge_pr',
  name: 'Merge Pull Request',
  description: 'Merge a pull request in a GitHub repository',
  
  inputSchema: z.object({
    owner: z.string().describe('Repository owner (username or organization)'),
    repo: z.string().describe('Repository name'),
    pull_number: z.number().describe('Pull request number'),
    commit_title: z.string().optional().describe('Title for the merge commit'),
    commit_message: z.string().optional().describe('Message for the merge commit'),
    merge_method: z.enum(['merge', 'squash', 'rebase']).optional().default('merge').describe('Merge method'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    sha: z.string().optional(),
    merged: z.boolean().optional(),
    message: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Merging GitHub pull request', { 
      owner: input.owner,
      repo: input.repo,
      pull_number: input.pull_number,
      merge_method: input.merge_method
    });
    
    try {
      // Initialize Octokit client
      const octokit = new Octokit({
        auth: credentials.data.accessToken,
      });

      // Build merge data
      const mergeData: any = {
        owner: input.owner,
        repo: input.repo,
        pull_number: input.pull_number,
        merge_method: input.merge_method,
      };
      
      if (input.commit_title) mergeData.commit_title = input.commit_title;
      if (input.commit_message) mergeData.commit_message = input.commit_message;

      // Merge pull request with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await octokit.pulls.merge(mergeData);
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'github',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying GitHub PR merge (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Pull request merged successfully', { 
        pull_number: input.pull_number,
        sha: result.data.sha,
        merged: result.data.merged
      });
      
      return {
        success: true,
        data: {
          success: true,
          sha: result.data.sha,
          merged: result.data.merged,
          message: result.data.message,
        },
      };
    } catch (error) {
      logger.error('Failed to merge GitHub pull request', { error });
      
      return {
        success: false,
        error: {
          code: 'MERGE_PR_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

