import { IntegrationAuth } from '../../types';

export const salesforceAuth: IntegrationAuth = {
  type: 'oauth2',
  oauth2: {
    authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    scopes: [
      "api",
      "refresh_token",
      "offline_access"
],
    clientId: process.env.SALESFORCE_CLIENT_ID!,
    clientSecret: process.env.SALESFORCE_CLIENT_SECRET!,
    authorizationParams: {
      response_type: 'code',
    },
  },
};
