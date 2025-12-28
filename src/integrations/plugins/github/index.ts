import { Integration } from '../../types';
import * as actions from './actions';
import { Octokit } from '@octokit/rest';

/**
 * GitHub Integration
 * 
 * GitHub developer platform integration for the Rule Engine platform.
 * Manage issues, pull requests, branches, and code workflows.
 * 
 * @category developer-tools
 * @version 1.0.0
 */

const metadata = {
  id: 'github',
  slug: 'github',
  name: 'GitHub',
  description: 'Connect with GitHub to automate your development workflows and code management',
  category: 'developer-tools' as const,
  icon: '/assets/integrations/github.svg',
  version: '1.0.0',
  authType: 'oauth2' as const,
  website: 'https://github.com',
  documentation: 'https://docs.github.com/en/rest',
};

const githubIntegration: Integration = {
  metadata,
  
  auth: {
    type: 'oauth2',
    config: {
      authorizationUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      scopes: [
        'repo',
        'user',
        'workflow',
      ],
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/github`,
    },
    async validate(credentials) {
      try {
        const octokit = new Octokit({
          auth: credentials.data.accessToken,
        });
        
        const { data } = await octokit.users.getAuthenticated();
        return !!data.login;
      } catch {
        return false;
      }
    },
  },

  actions: {
    create_issue: actions.createIssue,
    create_pr: actions.createPR,
    create_branch: actions.createBranch,
    merge_pr: actions.mergePR,
  },

  triggers: {},
};

export default githubIntegration;
