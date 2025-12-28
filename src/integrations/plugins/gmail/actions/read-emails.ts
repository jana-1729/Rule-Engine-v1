import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { google } from 'googleapis';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Read Emails Action for Gmail
 * 
 * Retrieves emails from Gmail inbox using googleapis SDK
 * Supports search queries, label filtering, and pagination
 */
export const readEmails: IntegrationAction = {
  id: 'read_emails',
  name: 'Read Emails',
  description: 'Read emails from Gmail inbox',
  
  inputSchema: z.object({
    maxResults: z.number().min(1).max(100).optional().default(10).describe('Maximum number of emails to retrieve'),
    query: z.string().optional().describe('Gmail search query (e.g., "is:unread", "from:example@gmail.com")'),
    labelIds: z.array(z.string()).optional().describe('Filter by label IDs'),
  }),

  outputSchema: z.object({
    messages: z.array(z.object({
      id: z.string(),
      threadId: z.string(),
      snippet: z.string(),
      from: z.string().optional(),
      subject: z.string().optional(),
      date: z.string().optional(),
      body: z.string().optional(),
    })),
    resultSizeEstimate: z.number(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Reading emails from Gmail', { query: input.query, maxResults: input.maxResults });
    
    try {
      // Initialize OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI || process.env.NEXT_PUBLIC_APP_URL + '/api/auth/callback/gmail'
      );

      oauth2Client.setCredentials({
        access_token: credentials.data.accessToken,
        refresh_token: credentials.data.refreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // List messages with automatic retry
      const listResult = await errorRecovery.executeWithRetry(
        async () => {
          return await gmail.users.messages.list({
            userId: 'me',
            maxResults: input.maxResults || 10,
            q: input.query,
            labelIds: input.labelIds,
          });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'gmail',
        }
      );
      
      if (!listResult.data.messages || listResult.data.messages.length === 0) {
        return {
          success: true,
          data: {
            messages: [],
            resultSizeEstimate: 0,
          },
        };
      }

      // Fetch full message details
      const messages = await Promise.all(
        listResult.data.messages.map(async (msg) => {
          try {
            const msgResult = await gmail.users.messages.get({
              userId: 'me',
              id: msg.id!,
              format: 'full',
            });

            const msgData = msgResult.data;
            const headers = msgData.payload?.headers || [];
            
            const getHeader = (name: string) => {
              const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
              return header?.value;
            };

            // Extract body
            let body = '';
            if (msgData.payload?.parts) {
              const textPart = msgData.payload.parts.find(part => part.mimeType === 'text/plain');
              if (textPart?.body?.data) {
                body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
              }
            } else if (msgData.payload?.body?.data) {
              body = Buffer.from(msgData.payload.body.data, 'base64').toString('utf-8');
            }

            return {
              id: msgData.id!,
              threadId: msgData.threadId!,
              snippet: msgData.snippet || '',
              from: getHeader('From'),
              subject: getHeader('Subject'),
              date: getHeader('Date'),
              body: body.substring(0, 1000), // Limit body to 1000 chars
            };
          } catch (error) {
            logger.warn(`Failed to fetch message ${msg.id}`, { error });
            return null;
          }
        })
      );

      const validMessages = messages.filter((m): m is NonNullable<typeof m> => m !== null);
      
      logger.info('Emails retrieved successfully', { count: validMessages.length });
      
      return {
        success: true,
        data: {
          messages: validMessages,
          resultSizeEstimate: listResult.data.resultSizeEstimate || validMessages.length,
        },
      };
    } catch (error) {
      logger.error('Failed to read emails', { error });
      
      return {
        success: false,
        error: {
          code: 'READ_EMAILS_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

