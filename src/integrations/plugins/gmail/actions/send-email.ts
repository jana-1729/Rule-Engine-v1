import { IntegrationAction } from '../../../types';
import { z } from 'zod';

/**
 * Send Email Action for Gmail
 * 
 * Sends an email via Gmail API
 */
export const sendEmail: IntegrationAction = {
  id: 'send_email',
  name: 'Send Email',
  description: 'Send an email via Gmail',
  
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
    threadId: z.string(),
    labelIds: z.array(z.string()).optional(),
  }),

  async execute(input, context) {
    const { credentials, logger } = context;
    
    logger.info('Sending email via Gmail', { to: input.to, subject: input.subject });
    
    try {
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

      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raw: encodedEmail,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gmail API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      logger.info('Email sent successfully', { messageId: data.id });
      
      return {
        success: true,
        data: {
          id: data.id,
          threadId: data.threadId,
          labelIds: data.labelIds,
        },
      };
    } catch (error) {
      logger.error('Failed to send email', { error });
      
      return {
        success: false,
        error: {
          code: 'SEND_EMAIL_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

