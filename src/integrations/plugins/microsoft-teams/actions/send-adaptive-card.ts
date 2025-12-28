import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { Client } from '@microsoft/microsoft-graph-client';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Send Adaptive Card Action for Microsoft Teams
 * 
 * Sends an interactive Adaptive Card to a Teams channel
 * Supports buttons, forms, images, and rich interactions
 */
export const sendAdaptiveCard: IntegrationAction = {
  id: 'send_adaptive_card',
  name: 'Send Adaptive Card',
  description: 'Send an interactive Adaptive Card to a Microsoft Teams channel',
  
  inputSchema: z.object({
    teamId: z.string().describe('Team ID'),
    channelId: z.string().describe('Channel ID'),
    card: z.record(z.any()).describe('Adaptive Card JSON schema'),
    subject: z.string().optional().describe('Message subject (optional)'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    timestamp: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Sending Adaptive Card to Microsoft Teams', { 
      teamId: input.teamId,
      channelId: input.channelId
    });
    
    try {
      // Initialize Microsoft Graph client
      const client = Client.init({
        authProvider: (done) => {
          done(null, credentials.data.accessToken);
        },
      });

      // Send adaptive card with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await client
            .api(`/teams/${input.teamId}/channels/${input.channelId}/messages`)
            .post({
              body: {
                contentType: 'html',
                content: '<attachment id="1"></attachment>',
              },
              subject: input.subject,
              attachments: [
                {
                  id: '1',
                  contentType: 'application/vnd.microsoft.card.adaptive',
                  content: JSON.stringify(input.card),
                },
              ],
            });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'microsoft-teams',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Teams adaptive card send (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Adaptive Card sent successfully', { 
        messageId: result.id,
        timestamp: result.createdDateTime
      });
      
      return {
        success: true,
        data: {
          success: true,
          id: result.id,
          timestamp: result.createdDateTime || new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Failed to send Adaptive Card to Teams', { error });
      
      return {
        success: false,
        error: {
          code: 'SEND_ADAPTIVE_CARD_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

