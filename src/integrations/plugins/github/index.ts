import { Integration } from '../../types';
import { githubAuth } from './auth';
import * as actions from './actions';
import * as triggers from './triggers';

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
    slug: 'github',
    name: 'GitHub',
    description: 'Connect with GitHub to automate your workflows',
    category: 'developer-tools',
    version: '1.0.0',
    logo: '/assets/integrations/github.png',
    color: '#181717',
    website: 'https://github.com',
    documentation: 'https://docs.github.com/en/rest',
    requiresEndUserAuth: true,
  },

  auth: githubAuth,

  actions: {
    create_issue: actions.createIssue,
    create_pr: actions.createPr,
  },

  triggers: {
    // Triggers can be added later
  },
};

export default githubIntegration;
