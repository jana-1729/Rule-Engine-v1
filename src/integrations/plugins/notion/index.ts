import { z } from 'zod';
import { Integration, ActionResult, ConnectionCredentials, ExecutionContext } from '../../types';
import { BaseIntegration } from '../../base-integration';
import axios from 'axios';

/**
 * Notion Integration
 * Create pages, query databases, and manage Notion workspaces
 */

const metadata = BaseIntegration.prototype['createMetadata']({
  slug: 'notion',
  name: 'Notion',
  description: 'Create pages, query databases, and manage Notion workspaces',
  category: 'productivity',
  icon: '/integrations/notion.svg',
  version: '1.0.0',
  authType: 'oauth2',
  website: 'https://notion.so',
  documentation: 'https://developers.notion.com',
});

// ============================================
// ACTIONS
// ============================================

const createPageAction = {
  id: 'create_page',
  name: 'Create Page',
  description: 'Create a new page in Notion',
  inputSchema: z.object({
    parent: z.object({
      database_id: z.string().optional(),
      page_id: z.string().optional(),
    }).describe('Parent database or page ID'),
    properties: z.record(z.any()).describe('Page properties'),
    children: z.array(z.any()).optional().describe('Page content blocks'),
  }),
  outputSchema: z.object({
    id: z.string(),
    url: z.string(),
    created_time: z.string(),
    properties: z.any(),
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
          parent: input.parent,
          properties: input.properties,
          children: input.children || [],
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
        }
      );

      return {
        success: true,
        data: {
          id: response.data.id,
          url: response.data.url,
          created_time: response.data.created_time,
          properties: response.data.properties,
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

const queryDatabaseAction = {
  id: 'query_database',
  name: 'Query Database',
  description: 'Query a Notion database',
  inputSchema: z.object({
    database_id: z.string().describe('Database ID'),
    filter: z.any().optional().describe('Filter object'),
    sorts: z.array(z.any()).optional().describe('Sort configuration'),
    page_size: z.number().max(100).optional().describe('Number of results (max 100)'),
  }),
  outputSchema: z.object({
    results: z.array(z.any()),
    has_more: z.boolean(),
    next_cursor: z.string().nullable(),
  }),
  async execute(
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      context.logger.info('Querying Notion database', { database_id: input.database_id });

      const accessToken = credentials.data.accessToken;

      const response = await axios.post(
        `https://api.notion.com/v1/databases/${input.database_id}/query`,
        {
          filter: input.filter,
          sorts: input.sorts,
          page_size: input.page_size || 100,
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
        }
      );

      return {
        success: true,
        data: {
          results: response.data.results,
          has_more: response.data.has_more,
          next_cursor: response.data.next_cursor,
        },
      };
    } catch (error: any) {
      context.logger.error('Failed to query Notion database', error);
      
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
  description: 'Update a Notion page properties',
  inputSchema: z.object({
    page_id: z.string().describe('Page ID'),
    properties: z.record(z.any()).describe('Properties to update'),
  }),
  outputSchema: z.object({
    id: z.string(),
    properties: z.any(),
    last_edited_time: z.string(),
  }),
  async execute(
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      context.logger.info('Updating Notion page', { page_id: input.page_id });

      const accessToken = credentials.data.accessToken;

      const response = await axios.patch(
        `https://api.notion.com/v1/pages/${input.page_id}`,
        {
          properties: input.properties,
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
        }
      );

      return {
        success: true,
        data: {
          id: response.data.id,
          properties: response.data.properties,
          last_edited_time: response.data.last_edited_time,
        },
      };
    } catch (error: any) {
      context.logger.error('Failed to update Notion page', error);
      
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

const getPageAction = {
  id: 'get_page',
  name: 'Get Page',
  description: 'Retrieve a Notion page',
  inputSchema: z.object({
    page_id: z.string().describe('Page ID'),
  }),
  outputSchema: z.object({
    id: z.string(),
    properties: z.any(),
    url: z.string(),
  }),
  async execute(
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      const accessToken = credentials.data.accessToken;

      const response = await axios.get(
        `https://api.notion.com/v1/pages/${input.page_id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Notion-Version': '2022-06-28',
          },
        }
      );

      return {
        success: true,
        data: {
          id: response.data.id,
          properties: response.data.properties,
          url: response.data.url,
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
    create_page: createPageAction,
    query_database: queryDatabaseAction,
    update_page: updatePageAction,
    get_page: getPageAction,
  },
  triggers: {},
};

export default notionIntegration;

