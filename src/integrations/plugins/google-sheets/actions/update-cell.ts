import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { google } from 'googleapis';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Update Cell Action for Google Sheets
 * 
 * Updates a cell or range in Google Sheets using googleapis SDK
 * Supports automatic retry and error recovery
 */
export const updateCell: IntegrationAction = {
  id: 'update_cell',
  name: 'Update Cell',
  description: 'Update a cell or range in Google Sheets',
  
  inputSchema: z.object({
    spreadsheetId: z.string().describe('Spreadsheet ID'),
    range: z.string().describe('Range in A1 notation (e.g., Sheet1!A1 or Sheet1!A1:B2)'),
    values: z.array(z.array(z.any())).describe('Values to update (2D array)'),
  }),

  outputSchema: z.object({
    spreadsheetId: z.string(),
    updatedRange: z.string(),
    updatedRows: z.number(),
    updatedColumns: z.number(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Updating cell in Google Sheet', { 
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

      // Update cell with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await sheets.spreadsheets.values.update({
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
            logger.warn(`Retrying Google Sheets update (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Cell updated successfully', { 
        updatedRange: result.data.updatedRange 
      });
      
      return {
        success: true,
        data: {
          spreadsheetId: result.data.spreadsheetId!,
          updatedRange: result.data.updatedRange || '',
          updatedRows: result.data.updatedRows || 0,
          updatedColumns: result.data.updatedColumns || 0,
        },
      };
    } catch (error) {
      logger.error('Failed to update cell in Google Sheet', { error });
      
      return {
        success: false,
        error: {
          code: 'UPDATE_CELL_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

