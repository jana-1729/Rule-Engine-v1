import { Integration } from '../../types';
import { gmailAuth } from './auth';
import * as actions from './actions';

/**
 * Gmail Integration
 * 
 * Gmail integration for the Rule Engine platform.
 * Provides actions for sending and reading emails via Gmail API.
 * 
 * @category communication
 * @version 1.0.0
 */
const gmailIntegration: Integration = {
  metadata: {
    slug: 'gmail',
    name: 'Gmail',
    description: 'Send and read emails via Gmail',
    category: 'communication',
    version: '1.0.0',
    logo: '/assets/integrations/gmail.png',
    color: '#EA4335',
    website: 'https://gmail.com',
    documentation: 'https://developers.google.com/gmail/api',
    requiresEndUserAuth: true,
  },

  auth: gmailAuth,

  actions: {
    send_email: actions.sendEmail,
    read_emails: actions.readEmails,
  },

  triggers: {
    // Triggers can be added later
  },
};

export default gmailIntegration;

