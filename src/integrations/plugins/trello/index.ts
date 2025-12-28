import { Integration } from '../../types';
import { trelloAuth } from './auth';
import * as actions from './actions';
import * as triggers from './triggers';

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
    slug: 'trello',
    name: 'Trello',
    description: 'Connect with Trello to automate your workflows',
    category: 'productivity',
    version: '1.0.0',
    logo: '/assets/integrations/trello.png',
    color: '#0079BF',
    website: 'https://trello.com',
    documentation: 'https://developer.atlassian.com/cloud/trello/rest/',
    requiresEndUserAuth: true,
  },

  auth: trelloAuth,

  actions: {
    create_card: actions.createCard,
    update_card: actions.updateCard,
  },

  triggers: {
    // Triggers can be added later
  },
};

export default trelloIntegration;
