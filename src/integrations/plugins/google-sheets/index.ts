import { z } from 'zod';
import { Integration, ActionResult, ConnectionCredentials, ExecutionContext } from '../../types';
import { BaseIntegration } from '../../base-integration';
import axios from 'axios';

/**
 * Google Sheets Integration
 * Supports reading/writing data to Google Sheets
 */

const metadata = BaseIntegration.prototype['createMetadata']({
  slug: 'google_sheets',
  name: 'Google Sheets',
  description: 'Read and write data to Google Sheets',
  category: 'productivity',
  icon: '/integrations/google-sheets.svg',
  version: '1.0.0',
  authType: 'oauth2',
  website: 'https://sheets.google.com',
  documentation: 'https://developers.google.com/sheets/api',
});

// ============================================
// ACTIONS
// ============================================

const appendRowAction = {
  id: 'append_row',
  name: 'Append Row',
  description: 'Append a new row to a Google Sheet',
  inputSchema: z.object({
    spreadsheetId: z.string().describe('The ID of the spreadsheet'),
    sheetName: z.string().describe('The name of the sheet (tab)'),
    values: z.array(z.any()).describe('Array of values to append'),
  }),
  outputSchema: z.object({
    updatedRange: z.string(),
    updatedRows: z.number(),
  }),
  async execute(
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      context.logger.info('Appending row to Google Sheet', { 
        spreadsheetId: input.spreadsheetId,
        sheetName: input.sheetName 
      });

      const accessToken = credentials.data.accessToken;
      const range = `${input.sheetName}!A:Z`;

      const response = await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${input.spreadsheetId}/values/${range}:append`,
        {
          values: [input.values],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            valueInputOption: 'USER_ENTERED',
          },
        }
      );

      return {
        success: true,
        data: {
          updatedRange: response.data.updates.updatedRange,
          updatedRows: response.data.updates.updatedRows,
        },
        metadata: {
          requestId: response.headers['x-request-id'],
        },
      };
    } catch (error: any) {
      context.logger.error('Failed to append row', error);
      
      return {
        success: false,
        error: {
          code: error.response?.status.toString() || 'UNKNOWN',
          message: error.response?.data?.error?.message || error.message,
          details: error.response?.data,
        },
      };
    }
  },
};

const readRowsAction = {
  id: 'read_rows',
  name: 'Read Rows',
  description: 'Read rows from a Google Sheet',
  inputSchema: z.object({
    spreadsheetId: z.string().describe('The ID of the spreadsheet'),
    sheetName: z.string().describe('The name of the sheet (tab)'),
    range: z.string().optional().describe('A1 notation range (e.g., A1:E10)'),
  }),
  outputSchema: z.object({
    values: z.array(z.array(z.any())),
    range: z.string(),
  }),
  async execute(
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      context.logger.info('Reading rows from Google Sheet', { 
        spreadsheetId: input.spreadsheetId,
        sheetName: input.sheetName 
      });

      const accessToken = credentials.data.accessToken;
      const range = input.range 
        ? `${input.sheetName}!${input.range}`
        : `${input.sheetName}!A:Z`;

      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${input.spreadsheetId}/values/${range}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return {
        success: true,
        data: {
          values: response.data.values || [],
          range: response.data.range,
        },
      };
    } catch (error: any) {
      context.logger.error('Failed to read rows', error);
      
      return {
        success: false,
        error: {
          code: error.response?.status.toString() || 'UNKNOWN',
          message: error.response?.data?.error?.message || error.message,
          details: error.response?.data,
        },
      };
    }
  },
};

const updateRowAction = {
  id: 'update_row',
  name: 'Update Row',
  description: 'Update a specific row in a Google Sheet',
  inputSchema: z.object({
    spreadsheetId: z.string().describe('The ID of the spreadsheet'),
    sheetName: z.string().describe('The name of the sheet (tab)'),
    rowNumber: z.number().describe('Row number to update (1-based)'),
    values: z.array(z.any()).describe('Array of values to update'),
  }),
  outputSchema: z.object({
    updatedRange: z.string(),
    updatedCells: z.number(),
  }),
  async execute(
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      const accessToken = credentials.data.accessToken;
      const range = `${input.sheetName}!A${input.rowNumber}:Z${input.rowNumber}`;

      const response = await axios.put(
        `https://sheets.googleapis.com/v4/spreadsheets/${input.spreadsheetId}/values/${range}`,
        {
          values: [input.values],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            valueInputOption: 'USER_ENTERED',
          },
        }
      );

      return {
        success: true,
        data: {
          updatedRange: response.data.updatedRange,
          updatedCells: response.data.updatedCells,
        },
      };
    } catch (error: any) {
      context.logger.error('Failed to update row', error);
      
      return {
        success: false,
        error: {
          code: error.response?.status.toString() || 'UNKNOWN',
          message: error.response?.data?.error?.message || error.message,
          details: error.response?.data,
        },
      };
    }
  },
};

// ============================================
// TRIGGERS
// ============================================

const newRowTrigger = {
  id: 'new_row',
  name: 'New Row Added',
  description: 'Triggers when a new row is added to a sheet',
  type: 'polling' as const,
  configSchema: z.object({
    spreadsheetId: z.string(),
    sheetName: z.string(),
    pollInterval: z.number().default(60), // seconds
  }),
  outputSchema: z.object({
    row: z.array(z.any()),
    rowNumber: z.number(),
  }),
  async poll(config: any, credentials: ConnectionCredentials, lastPollTime?: Date) {
    // Implementation would track last seen row and return new rows
    // This is a simplified version
    return [];
  },
};

// ============================================
// INTEGRATION DEFINITION
// ============================================

const googleSheetsIntegration: Integration = {
  metadata,
  auth: {
    type: 'oauth2',
    config: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/google`,
    },
    async validate(credentials: ConnectionCredentials): Promise<boolean> {
      try {
        const response = await axios.get(
          'https://www.googleapis.com/oauth2/v1/userinfo',
          {
            headers: {
              Authorization: `Bearer ${credentials.data.accessToken}`,
            },
          }
        );
        return response.status === 200;
      } catch {
        return false;
      }
    },
  },
  actions: {
    append_row: appendRowAction,
    read_rows: readRowsAction,
    update_row: updateRowAction,
  },
  triggers: {
    new_row: newRowTrigger,
  },
};

export default googleSheetsIntegration;

