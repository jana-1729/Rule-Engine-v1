import { z } from 'zod';
import { Integration, ActionResult, ConnectionCredentials, ExecutionContext } from '../../types';
import { BaseIntegration } from '../../base-integration';
import axios from 'axios';

/**
 * Notion Integration
 * Create and update pages and databases in Notion
 */

const metadata = BaseIntegration.prototype['createMetadata']({
  slug: 'notion',
  name: 'Notion',
  description: 'Create and manage pages and databases in Notion',
  category: 'productivity',
  icon: '/integrations/notion.svg',
  version: '1.0.0',
  authType: 'oauth2',
  website: 'https://notion.so',
  documentation: 'https://developers.notion.com',
});

const NOTION_VERSION = '2022-06-28';

// ============================================
// ACTIONS
// ============================================

const createPageAction = {
  id: 'create_page',
  name: 'Create Page',
  description: 'Create a new page in Notion',
  inputSchema: z.object({
    parent: z.object({
      type: z.enum(['database_id', 'page_id']),
      id: z.string(),
    }),
    properties: z.record(z.any()).describe('Page properties'),
    children: z.array(z.any()).optional().describe('Page content blocks'),
  }),
  outputSchema: z.object({
    id: z.string(),
    url: z.string(),
    created_time: z.string(),
  }),
  async execute(
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      context.logger.info('Creating Notion page');

      const accessToken = credentials.data.accessToken;

      const response = await axios.post(
        'https://api.notion.com/v1/pages',
        {
          parent: {
            [input.parent.type]: input.parent.id,
          },
          properties: input.properties,
          children: input.children || [],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': NOTION_VERSION,
          },
        }
      );

      return {
        success: true,
        data: {
          id: response.data.id,
          url: response.data.url,
          created_time: response.data.created_time,
        },
      };
    } catch (error: any) {
      context.logger.error('Failed to create Notion page', error);
      
      return {
        success: false,
        error: {
          code: error.response?.data?.code || 'UNKNOWN',
          message: error.response?.data?.message || error.message,
          details: error.response?.data,
        },
      };
    }
  },
};

const updatePageAction = {
  id: 'update_page',
  name: 'Update Page',
  description: 'Update properties of a Notion page',
  inputSchema: z.object({
    pageId: z.string().describe('ID of the page to update'),
    properties: z.record(z.any()).describe('Properties to update'),
  }),
  outputSchema: z.object({
    id: z.string(),
    last_edited_time: z.string(),
  }),
  async execute(
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      const accessToken = credentials.data.accessToken;

      const response = await axios.patch(
        `https://api.notion.com/v1/pages/${input.pageId}`,
        {
          properties: input.properties,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': NOTION_VERSION,
          },
        }
      );

      return {
        success: true,
        data: {
          id: response.data.id,
          last_edited_time: response.data.last_edited_time,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.response?.data?.code || 'UNKNOWN',
          message: error.response?.data?.message || error.message,
          details: error.response?.data,
        },
      };
    }
  },
};

const queryDatabaseAction = {
  id: 'query_database',
  name: 'Query Database',
  description: 'Query a Notion database',
  inputSchema: z.object({
    databaseId: z.string().describe('ID of the database'),
    filter: z.any().optional().describe('Filter object'),
    sorts: z.array(z.any()).optional().describe('Sort array'),
  }),
  outputSchema: z.object({
    results: z.array(z.any()),
    has_more: z.boolean(),
  }),
  async execute(
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      const accessToken = credentials.data.accessToken;

      const response = await axios.post(
        `https://api.notion.com/v1/databases/${input.databaseId}/query`,
        {
          filter: input.filter,
          sorts: input.sorts,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': NOTION_VERSION,
          },
        }
      );

      return {
        success: true,
        data: {
          results: response.data.results,
          has_more: response.data.has_more,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.response?.data?.code || 'UNKNOWN',
          message: error.response?.data?.message || error.message,
          details: error.response?.data,
        },
      };
    }
  },
};

// ============================================
// INTEGRATION DEFINITION
// ============================================

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
    async validate(credentials: ConnectionCredentials): Promise<boolean> {
      try {
        const response = await axios.get(
          'https://api.notion.com/v1/users/me',
          {
            headers: {
              Authorization: `Bearer ${credentials.data.accessToken}`,
              'Notion-Version': NOTION_VERSION,
            },
          }
        );
        return response.status === 200;
      } catch {
        return false;
      }
    },
  },
  actions: {
    create_page: createPageAction,
    update_page: updatePageAction,
    query_database: queryDatabaseAction,
  },
  triggers: {},
};

export default notionIntegration;

