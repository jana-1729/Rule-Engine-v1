import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { google } from 'googleapis';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Read Range Action for Google Sheets
 * 
 * Reads data from a range in Google Sheets using googleapis SDK
 * Supports automatic retry and error recovery
 */
export const readRange: IntegrationAction = {
  id: 'read_range',
  name: 'Read Range',
  description: 'Read data from a range in Google Sheets',
  
  inputSchema: z.object({
    spreadsheetId: z.string().describe('Spreadsheet ID'),
    range: z.string().describe('Range in A1 notation (e.g., Sheet1!A1:D10)'),
  }),

  outputSchema: z.object({
    range: z.string(),
    values: z.array(z.array(z.any())),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Reading range from Google Sheet', { 
      spreadsheetId: input.spreadsheetId,
      range: input.range 
    });
    
    try {
      // Initialize OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || process.env.NEXT_PUBLIC_APP_URL + '/api/auth/callback/google'
      );

      oauth2Client.setCredentials({
        access_token: credentials.data.accessToken,
        refresh_token: credentials.data.refreshToken,
      });

      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

      // Read range with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await sheets.spreadsheets.values.get({
            spreadsheetId: input.spreadsheetId,
            range: input.range,
          });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'google-sheets',
        }
      );
      
      logger.info('Range read successfully', { 
        range: result.data.range,
        rowCount: result.data.values?.length || 0
      });
      
      return {
        success: true,
        data: {
          range: result.data.range || input.range,
          values: result.data.values || [],
        },
      };
    } catch (error) {
      logger.error('Failed to read range from Google Sheet', { error });
      
      return {
        success: false,
        error: {
          code: 'READ_RANGE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

