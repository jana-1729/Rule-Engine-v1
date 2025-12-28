import { IntegrationAuth } from '../../types';

export const githubAuth: IntegrationAuth = {
  type: 'oauth2',
  oauth2: {
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: [
      "repo",
      "user",
      "workflow"
],
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    authorizationParams: {
      response_type: 'code',
    },
  },
};
