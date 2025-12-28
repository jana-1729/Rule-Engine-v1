import { Integration } from '../../types';
import * as actions from './actions';
import axios from 'axios';

/**
 * Gmail Integration
 * 
 * Gmail integration for the Rule Engine platform.
 * Provides actions for sending and reading emails via Gmail API.
 * 
 * @category communication
 * @version 1.0.0
 */

const metadata = {
  id: 'gmail',
  slug: 'gmail',
  name: 'Gmail',
  description: 'Send and read emails via Gmail',
  category: 'communication' as const,
  icon: '/assets/integrations/gmail.jpg',
  version: '1.0.0',
  authType: 'oauth2' as const,
  website: 'https://gmail.com',
  documentation: 'https://developers.google.com/gmail/api',
};

const gmailIntegration: Integration = {
  metadata,
  
  auth: {
    type: 'oauth2',
    config: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      scopes: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.compose',
      ],
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/gmail`,
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
    send_email: actions.sendEmail,
    read_emails: actions.readEmails,
    create_draft: actions.createDraft,
  },

  triggers: {},
};

export default gmailIntegration;

