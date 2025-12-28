import { Integration } from '../../types';
import * as actions from './actions';
import axios from 'axios';

/**
 * Microsoft Teams Integration
 * 
 * Microsoft Teams integration for the Rule Engine platform.
 * Send messages, adaptive cards, schedule meetings, and manage channels.
 * 
 * @category communication
 * @version 1.0.0
 */

const metadata = {
  id: 'microsoft-teams',
  slug: 'microsoft-teams',
  name: 'Microsoft Teams',
  description: 'Connect with Microsoft Teams to automate your workflows',
  category: 'communication' as const,
  icon: '/assets/integrations/teams.webp',
  version: '1.0.0',
  authType: 'oauth2' as const,
  website: 'https://teams.microsoft.com',
  documentation: 'https://docs.microsoft.com/en-us/graph/teams-concept-overview',
};

const microsoftTeamsIntegration: Integration = {
  metadata,
  
  auth: {
    type: 'oauth2',
    config: {
      authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      scopes: [
        'https://graph.microsoft.com/Channel.ReadWrite.All',
        'https://graph.microsoft.com/ChannelMessage.Send',
        'https://graph.microsoft.com/OnlineMeetings.ReadWrite',
        'https://graph.microsoft.com/Calendars.ReadWrite',
        'https://graph.microsoft.com/Team.ReadBasic.All',
      ],
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/microsoft-teams`,
    },
    async validate(credentials) {
      try {
        const response = await axios.get(
          'https://graph.microsoft.com/v1.0/me',
          {
            headers: {
              'Authorization': `Bearer ${credentials.data.accessToken}`,
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
    send_adaptive_card: actions.sendAdaptiveCard,
    schedule_meeting: actions.scheduleMeeting,
    create_channel: actions.createChannel,
  },

  triggers: {},
};

export default microsoftTeamsIntegration;
