import { Integration } from '../../types';
import { microsoftteamsAuth } from './auth';
import * as actions from './actions';
import * as triggers from './triggers';

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
    slug: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Connect with Microsoft Teams to automate your workflows',
    category: 'communication',
    version: '1.0.0',
    logo: '/assets/integrations/teams.webp',
    color: '#0078D4',
    website: 'https://teams.microsoft.com',
    documentation: 'https://docs.microsoft.com/en-us/graph/teams-concept-overview',
    requiresEndUserAuth: true,
  },

  auth: microsoftteamsAuth,

  actions: {
    send_message: actions.sendMessage,
    create_channel: actions.createChannel,
  },

  triggers: {
    // Triggers can be added later
  },
};

export default microsoftteamsIntegration;

