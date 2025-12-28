import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { google } from 'googleapis';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Create Draft Action for Gmail
 * 
 * Creates an email draft in Gmail using googleapis SDK
 * Useful for preparing emails that need review before sending
 */
export const createDraft: IntegrationAction = {
  id: 'create_draft',
  name: 'Create Draft',
  description: 'Create an email draft in Gmail',
  
  inputSchema: z.object({
    to: z.string().email().describe('Recipient email address'),
    subject: z.string().describe('Email subject'),
    body: z.string().describe('Email body (plain text or HTML)'),
    cc: z.string().email().optional().describe('CC email address'),
    bcc: z.string().email().optional().describe('BCC email address'),
    isHtml: z.boolean().optional().default(false).describe('Whether body is HTML'),
  }),

  outputSchema: z.object({
    id: z.string(),
    messageId: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Creating email draft in Gmail', { to: input.to, subject: input.subject });
    
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

      // Create email in RFC 2822 format
      const emailLines = [
        `To: ${input.to}`,
        input.cc ? `Cc: ${input.cc}` : '',
        input.bcc ? `Bcc: ${input.bcc}` : '',
        `Subject: ${input.subject}`,
        input.isHtml ? 'Content-Type: text/html; charset=utf-8' : 'Content-Type: text/plain; charset=utf-8',
        '',
        input.body,
      ].filter(Boolean);

      const email = emailLines.join('\r\n');

      // Base64url encode
      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Create draft with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await gmail.users.drafts.create({
            userId: 'me',
            requestBody: {
              message: {
                raw: encodedEmail,
              },
            },
          });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'gmail',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Gmail draft creation (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Draft created successfully', { draftId: result.data.id });
      
      return {
        success: true,
        data: {
          id: result.data.id!,
          messageId: result.data.message?.id,
        },
      };
    } catch (error) {
      logger.error('Failed to create draft', { error });
      
      return {
        success: false,
        error: {
          code: 'CREATE_DRAFT_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

