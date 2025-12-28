import { Integration } from '../../types';
import { discordAuth } from './auth';
import * as actions from './actions';
import * as triggers from './triggers';

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
    slug: 'discord',
    name: 'Discord',
    description: 'Connect with Discord to automate your workflows',
    category: 'communication',
    version: '1.0.0',
    logo: '/assets/integrations/discord.webp',
    color: '#5865F2',
    website: 'https://discord.com',
    documentation: 'https://discord.com/developers/docs/intro',
    requiresEndUserAuth: true,
  },

  auth: discordAuth,

  actions: {
    send_message: actions.sendMessage,
    create_channel: actions.createChannel,
  },

  triggers: {
    // Triggers can be added later
  },
};

export default discordIntegration;

