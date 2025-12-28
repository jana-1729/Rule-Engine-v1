import { Integration } from '../../types';
import * as actions from './actions';
import axios from 'axios';

/**
 * Discord Integration
 * 
 * Discord integration for the Rule Engine platform.
 * Send messages, embeds, create webhooks, and manage channels.
 * 
 * @category communication
 * @version 1.0.0
 */

const metadata = {
  id: 'discord',
  slug: 'discord',
  name: 'Discord',
  description: 'Connect with Discord to automate your community workflows',
  category: 'communication' as const,
  icon: '/assets/integrations/discord.svg',
  version: '1.0.0',
  authType: 'oauth2' as const,
  website: 'https://discord.com',
  documentation: 'https://discord.com/developers/docs/intro',
};

const discordIntegration: Integration = {
  metadata,
  
  auth: {
    type: 'oauth2',
    config: {
      authorizationUrl: 'https://discord.com/api/oauth2/authorize',
      tokenUrl: 'https://discord.com/api/oauth2/token',
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
      scopes: [
        'bot',
        'messages.read',
        'messages.write',
        'guilds',
        'webhooks.write',
      ],
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/discord`,
    },
    async validate(credentials) {
      try {
        const response = await axios.get(
          'https://discord.com/api/v10/users/@me',
          {
            headers: {
              'Authorization': `Bot ${credentials.data.accessToken}`,
            },
          }
        );
        return !!response.data.id;
      } catch {
        return false;
      }
    },
  },

  actions: {
    send_message: actions.sendMessage,
    send_embed: actions.sendEmbed,
    create_webhook: actions.createWebhook,
    create_channel: actions.createChannel,
  },

  triggers: {},
};

export default discordIntegration;
