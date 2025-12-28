import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { WebClient } from '@slack/web-api';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Upload File Action for Slack
 * 
 * Uploads a file to a Slack channel using the official Slack SDK
 * Supports various file types and automatic retry
 */
export const uploadFile: IntegrationAction = {
  id: 'upload_file',
  name: 'Upload File',
  description: 'Upload a file to a Slack channel',
  
  inputSchema: z.object({
    channels: z.union([z.string(), z.array(z.string())]).describe('Channel ID(s) to share the file in'),
    content: z.string().optional().describe('File content (text)'),
    file: z.string().optional().describe('File path or URL'),
    filename: z.string().optional().describe('Filename'),
    title: z.string().optional().describe('Title of the file'),
    initial_comment: z.string().optional().describe('Initial comment to add'),
    filetype: z.string().optional().describe('File type (e.g., "text", "pdf", "png")'),
  }),

  outputSchema: z.object({
    ok: z.boolean(),
    file: z.object({
      id: z.string(),
      name: z.string().optional(),
      title: z.string().optional(),
      permalink: z.string().optional(),
    }),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Uploading file to Slack', { 
      channels: input.channels,
      filename: input.filename 
    });
    
    try {
      // Initialize Slack client
      const slack = new WebClient(credentials.data.accessToken);

      // Normalize channels to array
      const channels = Array.isArray(input.channels) ? input.channels.join(',') : input.channels;

      // Upload file with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await slack.files.uploadV2({
            channels,
            content: input.content,
            file: input.file,
            filename: input.filename,
            title: input.title,
            initial_comment: input.initial_comment,
          });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'slack',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Slack file upload (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      if (!result.ok) {
        throw new Error(`Slack API error: ${(result as any).error || 'Unknown error'}`);
      }
      
      const fileData = (result as any).file;
      
      logger.info('File uploaded successfully', { 
        fileId: fileData?.id
      });
      
      return {
        success: true,
        data: {
          ok: result.ok,
          file: {
            id: fileData?.id || '',
            name: fileData?.name,
            title: fileData?.title,
            permalink: fileData?.permalink,
          },
        },
      };
    } catch (error) {
      logger.error('Failed to upload file to Slack', { error });
      
      return {
        success: false,
        error: {
          code: 'UPLOAD_FILE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

