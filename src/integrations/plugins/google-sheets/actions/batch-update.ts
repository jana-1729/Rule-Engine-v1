import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { google } from 'googleapis';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Batch Update Action for Google Sheets
 * 
 * Updates multiple ranges in a single request using googleapis SDK
 * More efficient than multiple individual updates
 */
export const batchUpdate: IntegrationAction = {
  id: 'batch_update',
  name: 'Batch Update',
  description: 'Update multiple ranges in a Google Sheet in a single request',
  
  inputSchema: z.object({
    spreadsheetId: z.string().describe('Spreadsheet ID'),
    data: z.array(z.object({
      range: z.string().describe('Range in A1 notation'),
      values: z.array(z.array(z.any())).describe('Values to update'),
    })).describe('Array of range updates'),
  }),

  outputSchema: z.object({
    spreadsheetId: z.string(),
    totalUpdatedRows: z.number(),
    totalUpdatedColumns: z.number(),
    totalUpdatedCells: z.number(),
    responses: z.array(z.object({
      updatedRange: z.string(),
      updatedRows: z.number(),
      updatedColumns: z.number(),
    })),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Batch updating Google Sheet', { 
      spreadsheetId: input.spreadsheetId,
      rangeCount: input.data.length
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

      // Batch update with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: input.spreadsheetId,
            requestBody: {
              valueInputOption: 'USER_ENTERED',
              data: input.data.map((item: any) => ({
                range: item.range,
                values: item.values,
              })),
            },
          });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'google-sheets',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Google Sheets batch update (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      const responses = result.data.responses?.map(response => ({
        updatedRange: response.updatedRange || '',
        updatedRows: response.updatedRows || 0,
        updatedColumns: response.updatedColumns || 0,
      })) || [];

      const totalUpdatedRows = responses.reduce((sum, r) => sum + r.updatedRows, 0);
      const totalUpdatedColumns = responses.reduce((sum, r) => sum + r.updatedColumns, 0);
      const totalUpdatedCells = result.data.totalUpdatedCells || 0;
      
      logger.info('Batch update successful', { 
        totalUpdatedCells,
        rangesUpdated: responses.length
      });
      
      return {
        success: true,
        data: {
          spreadsheetId: result.data.spreadsheetId!,
          totalUpdatedRows,
          totalUpdatedColumns,
          totalUpdatedCells,
          responses,
        },
      };
    } catch (error) {
      logger.error('Failed to batch update Google Sheet', { error });
      
      return {
        success: false,
        error: {
          code: 'BATCH_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

