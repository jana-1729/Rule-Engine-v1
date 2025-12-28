import { Integration } from '../../types';
import * as actions from './actions';

/**
 * Microsoft Teams Integration
 * 
 * Microsoft Teams integration for the Rule Engine platform.
 * Provides actions and triggers for Microsoft Teams API.
 * 
 * @category communication
 * @version 1.0.0
 */
const microsoftteamsIntegration: Integration = {
  metadata: {
    id: 'microsoft-teams', slug: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Connect with Microsoft Teams to automate your workflows',
    category: 'communication',
    version: '1.0.0',
    icon: '/assets/integrations/teams.webp',
    website: 'https://teams.microsoft.com',
    authType: 'oauth2' as const, documentation: 'https://docs.microsoft.com/en-us/graph/teams-concept-overview',
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

export default microsoftteamsIntegration;

