import { IntegrationAuth } from '../../types';

export const microsoftteamsAuth: IntegrationAuth = {
  type: 'oauth2',
  oauth2: {
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: [
      'https://graph.microsoft.com/Channel.ReadWrite.All',
      'https://graph.microsoft.com/ChannelMessage.Send',
      'https://graph.microsoft.com/Team.ReadBasic.All',
    ],
    clientId: process.env.MICROSOFT_TEAMS_CLIENT_ID!,
    clientSecret: process.env.MICROSOFT_TEAMS_CLIENT_SECRET!,
    authorizationParams: {
      response_type: 'code',
      response_mode: 'query',
    },
  },
};

