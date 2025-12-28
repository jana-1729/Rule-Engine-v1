import { Integration } from '../../types';
import * as actions from './actions';

/**
 * Discord Integration
 * 
 * Discord integration for the Rule Engine platform.
 * Provides actions and triggers for Discord API.
 * 
 * @category communication
 * @version 1.0.0
 */
const discordIntegration: Integration = {
  metadata: {
    id: 'discord', slug: 'discord',
    name: 'Discord',
    description: 'Connect with Discord to automate your workflows',
    category: 'communication',
    version: '1.0.0',
    icon: '/assets/integrations/discord.webp',
    website: 'https://discord.com',
    authType: 'oauth2' as const, documentation: 'https://discord.com/developers/docs/intro',
  },

  auth: { type: "oauth2", config: { authorizationUrl: "", tokenUrl: "", clientId: "", clientSecret: "", scopes: [], redirectUri: "" } },

  actions: {
    send_message: actions.sendMessage,
    create_channel: actions.createChannel,
  },

  triggers: {
    // Triggers can be added later
  },
};

export default discordIntegration;

