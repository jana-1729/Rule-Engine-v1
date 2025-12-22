import { IntegrationAction } from '../../../types';
import { z } from 'zod';

/**
 * Read Emails Action for Gmail
 * 
 * Retrieves emails from Gmail inbox
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
    })),
    resultSizeEstimate: z.number(),
  }),

  async execute(input, context) {
    const { credentials, logger } = context;
    
    logger.info('Reading emails from Gmail', { query: input.query, maxResults: input.maxResults });
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        maxResults: input.maxResults?.toString() || '10',
      });
      
      if (input.query) {
        params.append('q', input.query);
      }
      
      if (input.labelIds && input.labelIds.length > 0) {
        input.labelIds.forEach(labelId => params.append('labelIds', labelId));
      }

      // List messages
      const listResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
          },
        }
      );

      if (!listResponse.ok) {
        const error = await listResponse.json();
        throw new Error(`Gmail API error: ${error.error?.message || listResponse.statusText}`);
      }

      const listData = await listResponse.json();
      
      if (!listData.messages || listData.messages.length === 0) {
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
        listData.messages.map(async (msg: { id: string }) => {
          const msgResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
            {
              headers: {
                'Authorization': `Bearer ${credentials.accessToken}`,
              },
            }
          );

          if (!msgResponse.ok) {
            return null;
          }

          const msgData = await msgResponse.json();
          const headers = msgData.payload?.headers || [];
          
          const getHeader = (name: string) => {
            const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
            return header?.value;
          };

          return {
            id: msgData.id,
            threadId: msgData.threadId,
            snippet: msgData.snippet,
            from: getHeader('From'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
          };
        })
      );

      const validMessages = messages.filter(m => m !== null);
      
      logger.info('Emails retrieved successfully', { count: validMessages.length });
      
      return {
        success: true,
        data: {
          messages: validMessages,
          resultSizeEstimate: listData.resultSizeEstimate || validMessages.length,
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

