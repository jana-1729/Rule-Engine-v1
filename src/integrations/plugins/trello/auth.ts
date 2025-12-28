import { IntegrationAuth } from '../../types';

export const trelloAuth: IntegrationAuth = {
  type: 'oauth2',
  oauth2: {
    authorizationUrl: 'https://trello.com/1/authorize',
    tokenUrl: 'https://trello.com/1/OAuthGetAccessToken',
    scopes: [
      "read",
      "write"
],
    clientId: process.env.TRELLO_CLIENT_ID!,
    clientSecret: process.env.TRELLO_CLIENT_SECRET!,
    authorizationParams: {
      response_type: 'code',
    },
  },
};
