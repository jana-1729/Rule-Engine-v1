import { Integration } from '../../types';
import * as actions from './actions';

/**
 * Jira Integration
 * 
 * Jira integration for the Rule Engine platform.
 * Provides actions and triggers for Jira API.
 * 
 * @category developer-tools
 * @version 1.0.0
 */
const jiraIntegration: Integration = {
  metadata: {
    id: 'jira', slug: 'jira',
    name: 'Jira',
    description: 'Connect with Jira to automate your workflows',
    category: 'developer-tools',
    version: '1.0.0',
    icon: '/assets/integrations/jira.png',
    website: 'https://jira.atlassian.com',
    authType: 'oauth2' as const, documentation: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/',
  },

  auth: { type: "oauth2", config: { authorizationUrl: "", tokenUrl: "", clientId: "", clientSecret: "", scopes: [], redirectUri: "" } },

  actions: {
    create_issue: actions.createIssue,
    update_issue: actions.updateIssue,
  },

  triggers: {
    // Triggers can be added later
  },
};

export default jiraIntegration;
