import { z } from 'zod';
import { Integration, ActionResult, ConnectionCredentials, ExecutionContext } from '../../types';
import { BaseIntegration } from '../../base-integration';
import axios from 'axios';

/**
 * Slack Integration
 * Send messages, create channels, and manage Slack workspaces
 */

const metadata = BaseIntegration.prototype['createMetadata']({
  slug: 'slack',
  name: 'Slack',
  description: 'Send messages and manage Slack workspaces',
  category: 'communication',
  icon: '/integrations/slack.svg',
  version: '1.0.0',
  authType: 'oauth2',
  website: 'https://slack.com',
  documentation: 'https://api.slack.com',
});

// ============================================
// ACTIONS
// ============================================

const sendMessageAction = {
  id: 'send_message',
  name: 'Send Message',
  description: 'Send a message to a Slack channel',
  inputSchema: z.object({
    channel: z.string().describe('Channel ID or name'),
    text: z.string().optional().describe('Message text'),
    blocks: z.array(z.any()).optional().describe('Block Kit blocks'),
    thread_ts: z.string().optional().describe('Thread timestamp for replies'),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    channel: z.string(),
    ts: z.string(),
    message: z.any(),
  }),
  async execute(
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      context.logger.info('Sending Slack message', { channel: input.channel });

      const accessToken = credentials.data.accessToken;

      const response = await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: input.channel,
          text: input.text,
          blocks: input.blocks,
          thread_ts: input.thread_ts,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.ok) {
        return {
          success: false,
          error: {
            code: response.data.error,
            message: `Slack API error: ${response.data.error}`,
            details: response.data,
          },
        };
      }

      return {
        success: true,
        data: {
          ok: response.data.ok,
          channel: response.data.channel,
          ts: response.data.ts,
          message: response.data.message,
        },
      };
    } catch (error: any) {
      context.logger.error('Failed to send Slack message', error);
      
      return {
        success: false,
        error: {
          code: error.response?.data?.error || 'UNKNOWN',
          message: error.response?.data?.error || error.message,
          details: error.response?.data,
        },
      };
    }
  },
};

const createChannelAction = {
  id: 'create_channel',
  name: 'Create Channel',
  description: 'Create a new Slack channel',
  inputSchema: z.object({
    name: z.string().describe('Channel name'),
    is_private: z.boolean().optional().default(false),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    channel: z.any(),
  }),
  async execute(
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      const accessToken = credentials.data.accessToken;

      const response = await axios.post(
        'https://slack.com/api/conversations.create',
        {
          name: input.name,
          is_private: input.is_private,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.ok) {
        return {
          success: false,
          error: {
            code: response.data.error,
            message: `Slack API error: ${response.data.error}`,
            details: response.data,
          },
        };
      }

      return {
        success: true,
        data: {
          ok: response.data.ok,
          channel: response.data.channel,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.response?.data?.error || 'UNKNOWN',
          message: error.response?.data?.error || error.message,
          details: error.response?.data,
        },
      };
    }
  },
};

const getUserAction = {
  id: 'get_user',
  name: 'Get User Info',
  description: 'Get information about a Slack user',
  inputSchema: z.object({
    user: z.string().describe('User ID'),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
    user: z.any(),
  }),
  async execute(
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      const accessToken = credentials.data.accessToken;

      const response = await axios.get(
        'https://slack.com/api/users.info',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            user: input.user,
          },
        }
      );

      if (!response.data.ok) {
        return {
          success: false,
          error: {
            code: response.data.error,
            message: `Slack API error: ${response.data.error}`,
            details: response.data,
          },
        };
      }

      return {
        success: true,
        data: {
          ok: response.data.ok,
          user: response.data.user,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.response?.data?.error || 'UNKNOWN',
          message: error.response?.data?.error || error.message,
          details: error.response?.data,
        },
      };
    }
  },
};

// ============================================
// INTEGRATION DEFINITION
// ============================================

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
      ],
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/slack`,
    },
    async validate(credentials: ConnectionCredentials): Promise<boolean> {
      try {
        const response = await axios.post(
          'https://slack.com/api/auth.test',
          {},
          {
            headers: {
              Authorization: `Bearer ${credentials.data.accessToken}`,
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
    send_message: sendMessageAction,
    create_channel: createChannelAction,
    get_user: getUserAction,
  },
  triggers: {},
};

export default slackIntegration;

