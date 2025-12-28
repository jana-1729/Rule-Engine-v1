import { Integration } from '../../types';
import * as actions from './actions';
import JiraClient from 'jira-client';

/**
 * Jira Integration
 * 
 * Jira project management integration for the Rule Engine platform.
 * Manage issues, comments, and search with JQL support.
 * 
 * @category project-management
 * @version 1.0.0
 */

const metadata = {
  id: 'jira',
  slug: 'jira',
  name: 'Jira',
  description: 'Connect with Jira to automate your project management and issue tracking workflows',
  category: 'project-management' as const,
  icon: '/assets/integrations/jira-icon.png',
  version: '1.0.0',
  authType: 'oauth2' as const,
  website: 'https://www.atlassian.com/software/jira',
  documentation: 'https://developer.atlassian.com/cloud/jira/platform/rest/v2/',
};

const jiraIntegration: Integration = {
  metadata,
  
  auth: {
    type: 'oauth2',
    config: {
      authorizationUrl: 'https://auth.atlassian.com/authorize',
      tokenUrl: 'https://auth.atlassian.com/oauth/token',
      clientId: process.env.JIRA_CLIENT_ID || '',
      clientSecret: process.env.JIRA_CLIENT_SECRET || '',
      scopes: [
        'read:jira-work',
        'write:jira-work',
        'read:jira-user',
      ],
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/jira`,
    },
    async validate(credentials) {
      try {
        const jira = new JiraClient({
          protocol: 'https',
          host: credentials.data.host || 'your-domain.atlassian.net',
          username: credentials.data.username,
          password: credentials.data.apiToken || credentials.data.accessToken,
          apiVersion: '2',
          strictSSL: true,
        });
        
        const serverInfo = await jira.getServerInfo();
        return !!serverInfo.version;
      } catch {
        return false;
      }
    },
  },

  actions: {
    create_issue: actions.createIssue,
    update_issue: actions.updateIssue,
    add_comment: actions.addComment,
    search_issues: actions.searchIssues,
  },

  triggers: {},
};

export default jiraIntegration;
