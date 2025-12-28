import { Integration } from '../../types';
import * as actions from './actions';
import axios from 'axios';

/**
 * Slack Integration
 * 
 * Slack integration for the Rule Engine platform.
 * Send messages, upload files, manage channels with production-ready API implementations.
 * 
 * @category communication
 * @version 1.0.0
 */

const metadata = {
  id: 'slack',
  slug: 'slack',
  name: 'Slack',
  description: 'Send messages and manage Slack workspaces',
  category: 'communication' as const,
  icon: '/assets/integrations/slack.jpeg',
  version: '1.0.0',
  authType: 'oauth2' as const,
  website: 'https://slack.com',
  documentation: 'https://api.slack.com',
};

const slackIntegration: Integration = {
  metadata,
  
  auth: {
    type: 'oauth2',
    config: {
      authorizationUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      clientId: process.env.SLACK_CLIENT_ID || '',
      clientSecret: process.env.SLACK_CLIENT_SECRET || '',
      scopes: [
        'chat:write',
        'channels:read',
        'channels:manage',
        'users:read',
        'files:write',
        'reactions:write',
      ],
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/slack`,
    },
    async validate(credentials) {
      try {
        const response = await axios.post(
          'https://slack.com/api/auth.test',
          {},
          {
            headers: {
              'Authorization': `Bearer ${credentials.data.accessToken}`,
            },
          }
        );
        return response.data.ok;
      } catch {
        return false;
      }
    },
  },

  actions: {
    send_message: actions.sendMessage,
    upload_file: actions.uploadFile,
    add_reaction: actions.addReaction,
    create_channel: actions.createChannel,
  },

  triggers: {},
};

export default slackIntegration;
