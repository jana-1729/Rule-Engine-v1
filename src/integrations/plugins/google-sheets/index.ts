import { z } from 'zod';
import { Integration, ActionResult, ConnectionCredentials, ExecutionContext } from '../../types';
import { BaseIntegration } from '../../base-integration';
import axios from 'axios';

/**
 * Google Sheets Integration
 * Read, write, and manage Google Sheets
 */

const metadata = {
  id: 'google-sheets',
  slug: 'google-sheets',
  name: 'Google Sheets',
  description: 'Read, write, and manage Google Sheets',
  category: 'productivity' as const,
  icon: '/integrations/google-sheets.svg',
  version: '1.0.0',
  authType: 'oauth2' as const,
  website: 'https://sheets.google.com',
  documentation: 'https://developers.google.com/sheets/api',
};

// ============================================
// ACTIONS
// ============================================

const appendRowAction = {
  id: 'append_row',
  name: 'Append Row',
  description: 'Append a row to a Google Sheet',
  inputSchema: z.object({
    spreadsheetId: z.string().describe('Spreadsheet ID'),
    range: z.string().describe('Range in A1 notation (e.g., Sheet1!A:D)'),
    values: z.array(z.array(z.any())).describe('Values to append'),
  }),
  outputSchema: z.object({
    spreadsheetId: z.string(),
    updatedRange: z.string(),
    updatedRows: z.number(),
    updatedColumns: z.number(),
  }),
  async execute(
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      context.logger.info('Appending row to Google Sheet', { 
        spreadsheetId: input.spreadsheetId,
        range: input.range 
      });

      const accessToken = credentials.data.accessToken;

      const response = await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${input.spreadsheetId}/values/${input.range}:append`,
        {
          values: input.values,
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
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
          spreadsheetId: response.data.spreadsheetId,
          updatedRange: response.data.updates.updatedRange,
          updatedRows: response.data.updates.updatedRows,
          updatedColumns: response.data.updates.updatedColumns,
        },
      };
    } catch (error: any) {
      context.logger.error('Failed to append row to Google Sheet', error);
      
      return {
        success: false,
        error: {
          code: error.response?.data?.error?.code || 'UNKNOWN',
          message: error.response?.data?.error?.message || error.message,
          details: error.response?.data,
        },
      };
    }
  },
};

const readRangeAction = {
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
  async execute(
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      context.logger.info('Reading range from Google Sheet', { 
        spreadsheetId: input.spreadsheetId,
        range: input.range 
      });

      const accessToken = credentials.data.accessToken;

      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${input.spreadsheetId}/values/${input.range}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return {
        success: true,
        data: {
          range: response.data.range,
          values: response.data.values || [],
        },
      };
    } catch (error: any) {
      context.logger.error('Failed to read range from Google Sheet', error);
      
      return {
        success: false,
        error: {
          code: error.response?.data?.error?.code || 'UNKNOWN',
          message: error.response?.data?.error?.message || error.message,
          details: error.response?.data,
        },
      };
    }
  },
};

const updateCellAction = {
  id: 'update_cell',
  name: 'Update Cell',
  description: 'Update a cell or range in Google Sheets',
  inputSchema: z.object({
    spreadsheetId: z.string().describe('Spreadsheet ID'),
    range: z.string().describe('Range in A1 notation (e.g., Sheet1!A1)'),
    values: z.array(z.array(z.any())).describe('Values to update'),
  }),
  outputSchema: z.object({
    spreadsheetId: z.string(),
    updatedRange: z.string(),
    updatedRows: z.number(),
    updatedColumns: z.number(),
  }),
  async execute(
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      context.logger.info('Updating cell in Google Sheet', { 
        spreadsheetId: input.spreadsheetId,
        range: input.range 
      });

      const accessToken = credentials.data.accessToken;

      const response = await axios.put(
        `https://sheets.googleapis.com/v4/spreadsheets/${input.spreadsheetId}/values/${input.range}`,
        {
          values: input.values,
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
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
          spreadsheetId: response.data.spreadsheetId,
          updatedRange: response.data.updatedRange,
          updatedRows: response.data.updatedRows,
          updatedColumns: response.data.updatedColumns,
        },
      };
    } catch (error: any) {
      context.logger.error('Failed to update cell in Google Sheet', error);
      
      return {
        success: false,
        error: {
          code: error.response?.data?.error?.code || 'UNKNOWN',
          message: error.response?.data?.error?.message || error.message,
          details: error.response?.data,
        },
      };
    }
  },
};

const createSpreadsheetAction = {
  id: 'create_spreadsheet',
  name: 'Create Spreadsheet',
  description: 'Create a new Google Spreadsheet',
  inputSchema: z.object({
    title: z.string().describe('Spreadsheet title'),
    sheets: z.array(z.object({
      title: z.string(),
      rowCount: z.number().optional(),
      columnCount: z.number().optional(),
    })).optional().describe('Initial sheets'),
  }),
  outputSchema: z.object({
    spreadsheetId: z.string(),
    spreadsheetUrl: z.string(),
    title: z.string(),
  }),
  async execute(
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      context.logger.info('Creating Google Spreadsheet', { title: input.title });

      const accessToken = credentials.data.accessToken;

      const response = await axios.post(
        'https://sheets.googleapis.com/v4/spreadsheets',
        {
          properties: {
            title: input.title,
          },
          sheets: input.sheets?.map((sheet: any) => ({
            properties: {
              title: sheet.title,
              gridProperties: {
                rowCount: sheet.rowCount || 1000,
                columnCount: sheet.columnCount || 26,
              },
            },
          })),
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        data: {
          spreadsheetId: response.data.spreadsheetId,
          spreadsheetUrl: response.data.spreadsheetUrl,
          title: response.data.properties.title,
        },
      };
    } catch (error: any) {
      context.logger.error('Failed to create Google Spreadsheet', error);
      
      return {
        success: false,
        error: {
          code: error.response?.data?.error?.code || 'UNKNOWN',
          message: error.response?.data?.error?.message || error.message,
          details: error.response?.data,
        },
      };
    }
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
        'https://www.googleapis.com/auth/drive.file',
      ],
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/google-sheets`,
    },
    async validate(credentials: ConnectionCredentials): Promise<boolean> {
      try {
        const response = await axios.get(
          'https://www.googleapis.com/oauth2/v1/userinfo',
          {
            headers: {
              'Authorization': `Bearer ${credentials.data.accessToken}`,
            },
          }
        );
        return !!response.data.id;
      } catch {
        return false;
      }
    },
  },
  actions: {
    append_row: appendRowAction,
    read_range: readRangeAction,
    update_cell: updateCellAction,
    create_spreadsheet: createSpreadsheetAction,
  },
  triggers: {},
};

export default googleSheetsIntegration;

