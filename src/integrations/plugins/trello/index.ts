import { Integration } from '../../types';
import * as actions from './actions';

/**
 * Trello Integration
 * 
 * Trello integration for the Rule Engine platform.
 * Provides actions and triggers for Trello API.
 * 
 * @category productivity
 * @version 1.0.0
 */
const trelloIntegration: Integration = {
  metadata: {
    id: 'trello', slug: 'trello',
    name: 'Trello',
    description: 'Connect with Trello to automate your workflows',
    category: 'productivity',
    version: '1.0.0',
    icon: '/assets/integrations/trello.png',
    website: 'https://trello.com',
    authType: 'oauth2' as const, documentation: 'https://developer.atlassian.com/cloud/trello/rest/',
  },

  auth: { type: "oauth2", config: { authorizationUrl: "", tokenUrl: "", clientId: "", clientSecret: "", scopes: [], redirectUri: "" } },

  actions: {
    create_card: actions.createCard,
    update_card: actions.updateCard,
  },

  triggers: {
    // Triggers can be added later
  },
};

export default trelloIntegration;
