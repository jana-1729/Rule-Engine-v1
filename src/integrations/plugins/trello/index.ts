import { Integration } from '../../types';
import * as actions from './actions';
import Trello from 'trello';

/**
 * Trello Integration
 * 
 * Trello project management integration for the Rule Engine platform.
 * Manage cards, checklists, and boards with production-ready API implementations.
 * 
 * @category project-management
 * @version 1.0.0
 */

const metadata = {
  id: 'trello',
  slug: 'trello',
  name: 'Trello',
  description: 'Connect with Trello to automate your project management and task tracking workflows',
  category: 'project-management' as const,
  icon: '/assets/integrations/trello.svg',
  version: '1.0.0',
  authType: 'oauth2' as const,
  website: 'https://trello.com',
  documentation: 'https://developer.atlassian.com/cloud/trello/rest/',
};

const trelloIntegration: Integration = {
  metadata,
  
  auth: {
    type: 'oauth2',
    config: {
      authorizationUrl: 'https://trello.com/1/authorize',
      tokenUrl: 'https://trello.com/1/OAuthGetAccessToken',
      clientId: process.env.TRELLO_API_KEY || '',
      clientSecret: process.env.TRELLO_API_SECRET || '',
      scopes: [
        'read',
        'write',
      ],
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/trello`,
    },
    async validate(credentials) {
      try {
        const trello = new Trello(
          credentials.data.apiKey || process.env.TRELLO_API_KEY,
          credentials.data.token || credentials.data.accessToken
        );
        
        // Validate by fetching member info
        const member = await trello.makeRequest('get', '/1/members/me');
        return !!member.id;
      } catch {
        return false;
      }
    },
  },

  actions: {
    create_card: actions.createCard,
    update_card: actions.updateCard,
    add_checklist: actions.addChecklist,
    move_card: actions.moveCard,
  },

  triggers: {},
};

export default trelloIntegration;
