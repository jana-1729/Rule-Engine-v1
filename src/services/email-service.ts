/**
 * Email Service
 * Handles email delivery for notifications, alerts, and user communications
 * Supports multiple providers: SMTP, SendGrid, AWS SES
 */

import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  variables: Record<string, any>;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private provider: 'smtp' | 'sendgrid' | 'ses';

  constructor() {
    this.provider = (process.env.EMAIL_PROVIDER as any) || 'smtp';
    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (this.provider === 'smtp') {
      // SMTP Configuration
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else if (this.provider === 'sendgrid') {
      // SendGrid Configuration
      this.transporter = nodemailer.createTransporter({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    } else if (this.provider === 'ses') {
      // AWS SES Configuration
      this.transporter = nodemailer.createTransporter({
        host: `email-smtp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`,
        port: 587,
        auth: {
          user: process.env.AWS_SES_ACCESS_KEY,
          pass: process.env.AWS_SES_SECRET_KEY,
        },
      });
    }
  }

  /**
   * Send a single email
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const from = options.from || process.env.EMAIL_FROM || 'noreply@yourdomain.com';

      const info = await this.transporter.sendMail({
        from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      });

      // Log email delivery
      await this.logEmail({
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        status: 'sent',
        messageId: info.messageId,
        provider: this.provider,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      console.error('Failed to send email:', error);

      // Log failed email
      await this.logEmail({
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        status: 'failed',
        error: error.message,
        provider: this.provider,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send email using a template
   */
  async sendTemplateEmail(
    templateName: string,
    to: string | string[],
    variables: Record<string, any>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const template = await this.getTemplate(templateName);
    
    if (!template) {
      return {
        success: false,
        error: `Template '${templateName}' not found`,
      };
    }

    // Replace variables in template
    let html = template.html;
    let subject = template.subject;

    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, variables[key]);
      subject = subject.replace(regex, variables[key]);
    });

    return this.sendEmail({
      to,
      subject,
      html,
    });
  }

  /**
   * Send bulk emails (with rate limiting)
   */
  async sendBulkEmails(
    emails: EmailOptions[],
    options?: {
      batchSize?: number;
      delayMs?: number;
    }
  ): Promise<{
    total: number;
    sent: number;
    failed: number;
    results: Array<{ email: string; success: boolean; error?: string }>;
  }> {
    const batchSize = options?.batchSize || 10;
    const delayMs = options?.delayMs || 1000;

    const results: Array<{ email: string; success: boolean; error?: string }> = [];
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (email) => {
          const result = await this.sendEmail(email);
          const emailAddress = Array.isArray(email.to) ? email.to[0] : email.to;
          
          if (result.success) {
            sent++;
          } else {
            failed++;
          }

          return {
            email: emailAddress,
            success: result.success,
            error: result.error,
          };
        })
      );

      results.push(...batchResults);

      // Delay between batches to avoid rate limits
      if (i + batchSize < emails.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return {
      total: emails.length,
      sent,
      failed,
      results,
    };
  }

  /**
   * Get email template
   */
  private async getTemplate(name: string): Promise<EmailTemplate | null> {
    // In a real implementation, this would fetch from database
    // For now, return built-in templates
    const templates: Record<string, EmailTemplate> = {
      'welcome': {
        name: 'welcome',
        subject: 'Welcome to {{appName}}!',
        html: `
          <h1>Welcome to {{appName}}!</h1>
          <p>Hi {{userName}},</p>
          <p>Thank you for signing up. We're excited to have you on board!</p>
          <p>Get started by connecting your first integration.</p>
          <a href="{{dashboardUrl}}" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a>
        `,
        variables: {},
      },
      'api_key_created': {
        name: 'api_key_created',
        subject: 'New API Key Created',
        html: `
          <h1>New API Key Created</h1>
          <p>Hi {{userName}},</p>
          <p>A new API key was created for your account:</p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; font-family: monospace;">
            {{apiKey}}
          </div>
          <p style="color: #e00; font-weight: bold;">⚠️ This is the only time you'll see this key. Please save it securely.</p>
          <p>If you didn't create this key, please contact support immediately.</p>
        `,
        variables: {},
      },
      'execution_failed': {
        name: 'execution_failed',
        subject: 'Workflow Execution Failed',
        html: `
          <h1>Workflow Execution Failed</h1>
          <p>Hi {{userName}},</p>
          <p>Your workflow "{{workflowName}}" failed to execute:</p>
          <div style="background: #fff5f5; border-left: 4px solid #e00; padding: 16px; margin: 16px 0;">
            <strong>Error:</strong> {{errorMessage}}
          </div>
          <p><strong>Execution ID:</strong> {{executionId}}</p>
          <p><strong>Time:</strong> {{timestamp}}</p>
          <a href="{{executionUrl}}" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a>
        `,
        variables: {},
      },
      'connection_expired': {
        name: 'connection_expired',
        subject: 'Integration Connection Expired',
        html: `
          <h1>Integration Connection Expired</h1>
          <p>Hi {{userName}},</p>
          <p>Your {{integrationName}} connection has expired and needs to be reconnected.</p>
          <p>This may cause your workflows to fail until you reconnect.</p>
          <a href="{{reconnectUrl}}" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reconnect Now</a>
        `,
        variables: {},
      },
    };

    return templates[name] || null;
  }

  /**
   * Log email delivery
   */
  private async logEmail(data: {
    to: string;
    subject: string;
    status: 'sent' | 'failed';
    messageId?: string;
    error?: string;
    provider: string;
  }) {
    try {
      // In a real implementation, save to database
      console.log('Email log:', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log email:', error);
    }
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      await this.transporter.verify();

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(to: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      to,
      subject: 'Test Email from Integration Platform',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from your integration platform.</p>
        <p>If you received this, your email configuration is working correctly!</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
    });
  }
}

// Singleton instance
export const emailService = new EmailService();

