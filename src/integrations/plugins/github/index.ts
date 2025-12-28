import { Integration } from '../../types';
import * as actions from './actions';

/**
 * GitHub Integration
 * 
 * GitHub integration for the Rule Engine platform.
 * Provides actions and triggers for GitHub API.
 * 
 * @category developer-tools
 * @version 1.0.0
 */
const githubIntegration: Integration = {
  metadata: {
    id: 'github', slug: 'github',
    name: 'GitHub',
    description: 'Connect with GitHub to automate your workflows',
    category: 'developer-tools',
    version: '1.0.0',
    icon: '/assets/integrations/github.png',
    website: 'https://github.com',
    authType: 'oauth2' as const, documentation: 'https://docs.github.com/en/rest',
  },

  auth: { type: "oauth2", config: { authorizationUrl: "", tokenUrl: "", clientId: "", clientSecret: "", scopes: [], redirectUri: "" } },

  actions: {
    create_issue: actions.createIssue,
    create_pr: actions.createPr,
  },

  triggers: {
    // Triggers can be added later
  },
};

export default githubIntegration;
