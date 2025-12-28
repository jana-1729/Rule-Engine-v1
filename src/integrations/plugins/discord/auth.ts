import { IntegrationAuth } from '../../types';

export const discordAuth: IntegrationAuth = {
  type: 'oauth2',
  oauth2: {
    authorizationUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    scopes: [
      'bot',
      'messages.read',
      'messages.write',
      'guilds',
    ],
    clientId: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    authorizationParams: {
      response_type: 'code',
    },
  },
};

