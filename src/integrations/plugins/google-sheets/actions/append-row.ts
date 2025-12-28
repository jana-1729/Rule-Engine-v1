import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { google } from 'googleapis';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Append Row Action for Google Sheets
 * 
 * Appends a row to a Google Sheet using googleapis SDK
 * Supports automatic retry and error recovery
 */
export const appendRow: IntegrationAction = {
  id: 'append_row',
  name: 'Append Row',
  description: 'Append a row to a Google Sheet',
  
  inputSchema: z.object({
    spreadsheetId: z.string().describe('Spreadsheet ID'),
    range: z.string().describe('Range in A1 notation (e.g., Sheet1!A:D)'),
    values: z.array(z.array(z.any())).describe('Values to append (2D array)'),
  }),

  outputSchema: z.object({
    spreadsheetId: z.string(),
    updatedRange: z.string(),
    updatedRows: z.number(),
    updatedColumns: z.number(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Appending row to Google Sheet', { 
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

      // Append row with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await sheets.spreadsheets.values.append({
            spreadsheetId: input.spreadsheetId,
            range: input.range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: input.values,
            },
          });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'google-sheets',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Google Sheets append (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Row appended successfully', { 
        updatedRange: result.data.updates?.updatedRange 
      });
      
      return {
        success: true,
        data: {
          spreadsheetId: result.data.spreadsheetId!,
          updatedRange: result.data.updates?.updatedRange || '',
          updatedRows: result.data.updates?.updatedRows || 0,
          updatedColumns: result.data.updates?.updatedColumns || 0,
        },
      };
    } catch (error) {
      logger.error('Failed to append row to Google Sheet', { error });
      
      return {
        success: false,
        error: {
          code: 'APPEND_ROW_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

