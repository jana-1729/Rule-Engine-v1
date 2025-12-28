import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { WebClient } from '@slack/web-api';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Send Message Action for Slack
 * 
 * Sends a message to a Slack channel using the official Slack SDK
 * Supports Block Kit, threads, and automatic retry
 */
export const sendMessage: IntegrationAction = {
  id: 'send_message',
  name: 'Send Message',
  description: 'Send a message to a Slack channel',
  
  inputSchema: z.object({
    channel: z.string().describe('Channel ID or name (e.g., #general or C1234567890)'),
    text: z.string().optional().describe('Message text (required if blocks not provided)'),
    blocks: z.array(z.any()).optional().describe('Block Kit blocks for rich formatting'),
    thread_ts: z.string().optional().describe('Thread timestamp for replies'),
    attachments: z.array(z.any()).optional().describe('Message attachments (legacy)'),
  }),

  outputSchema: z.object({
    ok: z.boolean(),
    channel: z.string(),
    ts: z.string(),
    message: z.any(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Sending Slack message', { channel: input.channel });
    
    try {
      // Initialize Slack client
      const slack = new WebClient(credentials.data.accessToken);

      // Send message with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await slack.chat.postMessage({
            channel: input.channel,
            text: input.text || 'Message',
            blocks: input.blocks,
            thread_ts: input.thread_ts,
            attachments: input.attachments,
          });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'slack',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Slack message send (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      if (!result.ok) {
        throw new Error(`Slack API error: ${result.error || 'Unknown error'}`);
      }
      
      logger.info('Slack message sent successfully', { 
        channel: result.channel,
        ts: result.ts
      });
      
      return {
        success: true,
        data: {
          ok: result.ok,
          channel: result.channel!,
          ts: result.ts!,
          message: result.message,
        },
      };
    } catch (error) {
      logger.error('Failed to send Slack message', { error });
      
      return {
        success: false,
        error: {
          code: 'SEND_MESSAGE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

