import { IntegrationAuth } from '../../types';

export const jiraAuth: IntegrationAuth = {
  type: 'oauth2',
  oauth2: {
    authorizationUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    scopes: [
      "read:jira-work",
      "write:jira-work",
      "read:jira-user"
],
    clientId: process.env.JIRA_CLIENT_ID!,
    clientSecret: process.env.JIRA_CLIENT_SECRET!,
    authorizationParams: {
      response_type: 'code',
    },
  },
};
