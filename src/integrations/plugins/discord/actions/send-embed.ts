import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { errorRecovery } from '@/services/error-recovery-service';
import axios from 'axios';

/**
 * Send Embed Action for Discord
 * 
 * Sends a rich embedded message to a Discord channel
 * Supports colors, images, fields, and more
 */
export const sendEmbed: IntegrationAction = {
  id: 'send_embed',
  name: 'Send Embed',
  description: 'Send a rich embedded message to a Discord channel',
  
  inputSchema: z.object({
    channelId: z.string().describe('Channel ID'),
    title: z.string().optional().describe('Embed title'),
    description: z.string().optional().describe('Embed description'),
    color: z.number().optional().describe('Embed color (decimal)'),
    url: z.string().url().optional().describe('Embed URL'),
    thumbnail: z.string().url().optional().describe('Thumbnail image URL'),
    image: z.string().url().optional().describe('Main image URL'),
    author: z.object({
      name: z.string(),
      url: z.string().url().optional(),
      icon_url: z.string().url().optional(),
    }).optional().describe('Author information'),
    fields: z.array(z.object({
      name: z.string(),
      value: z.string(),
      inline: z.boolean().optional(),
    })).optional().describe('Embed fields'),
    footer: z.object({
      text: z.string(),
      icon_url: z.string().url().optional(),
    }).optional().describe('Footer information'),
    timestamp: z.string().optional().describe('Timestamp (ISO 8601)'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    timestamp: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Sending embed to Discord', { channelId: input.channelId });
    
    try {
      // Build embed object
      const embed: any = {};
      
      if (input.title) embed.title = input.title;
      if (input.description) embed.description = input.description;
      if (input.color) embed.color = input.color;
      if (input.url) embed.url = input.url;
      if (input.thumbnail) embed.thumbnail = { url: input.thumbnail };
      if (input.image) embed.image = { url: input.image };
      if (input.author) embed.author = input.author;
      if (input.fields) embed.fields = input.fields;
      if (input.footer) embed.footer = input.footer;
      if (input.timestamp) embed.timestamp = input.timestamp;

      // Send embed with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await axios.post(
            `https://discord.com/api/v10/channels/${input.channelId}/messages`,
            {
              embeds: [embed],
            },
            {
              headers: {
                'Authorization': `Bot ${credentials.data.accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'discord',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Discord embed send (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Embed sent successfully', { 
        messageId: result.data.id,
        timestamp: result.data.timestamp
      });
      
      return {
        success: true,
        data: {
          success: true,
          id: result.data.id,
          timestamp: result.data.timestamp,
        },
      };
    } catch (error) {
      logger.error('Failed to send embed to Discord', { error });
      
      return {
        success: false,
        error: {
          code: 'SEND_EMBED_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

