import { Integration } from '../../types';
import * as actions from './actions';
import axios from 'axios';

/**
 * Google Sheets Integration
 * 
 * Google Sheets integration for the Rule Engine platform.
 * Read, write, and manage Google Sheets with production-ready API implementations.
 * 
 * @category productivity
 * @version 1.0.0
 */

const metadata = {
  id: 'google-sheets',
  slug: 'google-sheets',
  name: 'Google Sheets',
  description: 'Read, write, and manage Google Sheets',
  category: 'productivity' as const,
  icon: '/assets/integrations/google-sheets.webp',
  version: '1.0.0',
  authType: 'oauth2' as const,
  website: 'https://sheets.google.com',
  documentation: 'https://developers.google.com/sheets/api',
};

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
    async validate(credentials) {
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
    append_row: actions.appendRow,
    read_range: actions.readRange,
    update_cell: actions.updateCell,
    batch_update: actions.batchUpdate,
  },

  triggers: {},
};

export default googleSheetsIntegration;
