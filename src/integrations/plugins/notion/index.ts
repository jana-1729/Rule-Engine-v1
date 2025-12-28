import { Integration } from '../../types';
import * as actions from './actions';
import axios from 'axios';

/**
 * Notion Integration
 * 
 * Notion integration for the Rule Engine platform.
 * Create pages, query databases, and manage Notion workspaces.
 * 
 * @category productivity
 * @version 1.0.0
 */

const metadata = {
  id: 'notion',
  slug: 'notion',
  name: 'Notion',
  description: 'Create pages, query databases, and manage Notion workspaces',
  category: 'productivity' as const,
  icon: '/assets/integrations/notion.png',
  version: '1.0.0',
  authType: 'oauth2' as const,
  website: 'https://notion.so',
  documentation: 'https://developers.notion.com',
};

const notionIntegration: Integration = {
  metadata,
  
  auth: {
    type: 'oauth2',
    config: {
      authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
      tokenUrl: 'https://api.notion.com/v1/oauth/token',
      clientId: process.env.NOTION_CLIENT_ID || '',
      clientSecret: process.env.NOTION_CLIENT_SECRET || '',
      scopes: [],
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/notion`,
    },
    async validate(credentials) {
      try {
        const response = await axios.get(
          'https://api.notion.com/v1/users/me',
          {
            headers: {
              'Authorization': `Bearer ${credentials.data.accessToken}`,
              'Notion-Version': '2022-06-28',
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
    create_page: actions.createPage,
    update_page: actions.updatePage,
    query_database: actions.queryDatabase,
  },

  triggers: {},
};

export default notionIntegration;
