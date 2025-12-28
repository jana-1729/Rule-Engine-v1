import { Integration } from '../../types';
import { jiraAuth } from './auth';
import * as actions from './actions';
import * as triggers from './triggers';

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
    slug: 'jira',
    name: 'Jira',
    description: 'Connect with Jira to automate your workflows',
    category: 'developer-tools',
    version: '1.0.0',
    logo: '/assets/integrations/jira.png',
    color: '#0052CC',
    website: 'https://jira.atlassian.com',
    documentation: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/',
    requiresEndUserAuth: true,
  },

  auth: jiraAuth,

  actions: {
    create_issue: actions.createIssue,
    update_issue: actions.updateIssue,
  },

  triggers: {
    // Triggers can be added later
  },
};

export default jiraIntegration;
