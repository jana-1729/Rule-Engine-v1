import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { Client } from '@microsoft/microsoft-graph-client';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Schedule Meeting Action for Microsoft Teams
 * 
 * Schedules a Teams meeting using Microsoft Graph SDK
 * Generates join link and adds participants
 */
export const scheduleMeeting: IntegrationAction = {
  id: 'schedule_meeting',
  name: 'Schedule Meeting',
  description: 'Schedule a Microsoft Teams meeting',
  
  inputSchema: z.object({
    subject: z.string().describe('Meeting subject'),
    startTime: z.string().describe('Start time (ISO 8601 format)'),
    endTime: z.string().describe('End time (ISO 8601 format)'),
    participants: z.array(z.string().email()).describe('Participant email addresses'),
    content: z.string().optional().describe('Meeting description'),
    isOnlineMeeting: z.boolean().optional().default(true).describe('Whether this is an online meeting'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    joinUrl: z.string().optional(),
    webLink: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Scheduling Microsoft Teams meeting', { 
      subject: input.subject,
      startTime: input.startTime
    });
    
    try {
      // Initialize Microsoft Graph client
      const client = Client.init({
        authProvider: (done) => {
          done(null, credentials.data.accessToken);
        },
      });

      // Schedule meeting with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await client
            .api('/me/events')
            .post({
              subject: input.subject,
              body: {
                contentType: 'HTML',
                content: input.content || '',
              },
              start: {
                dateTime: input.startTime,
                timeZone: 'UTC',
              },
              end: {
                dateTime: input.endTime,
                timeZone: 'UTC',
              },
              attendees: input.participants.map((email: string) => ({
                emailAddress: {
                  address: email,
                },
                type: 'required',
              })),
              isOnlineMeeting: input.isOnlineMeeting,
              onlineMeetingProvider: 'teamsForBusiness',
            });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'microsoft-teams',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Teams meeting schedule (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Meeting scheduled successfully', { 
        meetingId: result.id,
        joinUrl: result.onlineMeeting?.joinUrl
      });
      
      return {
        success: true,
        data: {
          success: true,
          id: result.id,
          joinUrl: result.onlineMeeting?.joinUrl,
          webLink: result.webLink,
        },
      };
    } catch (error) {
      logger.error('Failed to schedule Teams meeting', { error });
      
      return {
        success: false,
        error: {
          code: 'SCHEDULE_MEETING_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

