import { Integration } from '../../types';
import * as actions from './actions';
import jsforce from 'jsforce';

/**
 * Salesforce Integration
 * 
 * Salesforce CRM integration for the Rule Engine platform.
 * Manage leads, opportunities, cases, and query records with SOQL.
 * 
 * @category crm
 * @version 1.0.0
 */

const metadata = {
  id: 'salesforce',
  slug: 'salesforce',
  name: 'Salesforce',
  description: 'Connect with Salesforce CRM to automate your enterprise sales workflows',
  category: 'crm' as const,
  icon: '/assets/integrations/salesforce.png',
  version: '1.0.0',
  authType: 'oauth2' as const,
  website: 'https://www.salesforce.com',
  documentation: 'https://developer.salesforce.com/docs',
};

const salesforceIntegration: Integration = {
  metadata,
  
  auth: {
    type: 'oauth2',
    config: {
      authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
      tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
      clientId: process.env.SALESFORCE_CLIENT_ID || '',
      clientSecret: process.env.SALESFORCE_CLIENT_SECRET || '',
      scopes: [
        'api',
        'refresh_token',
        'offline_access',
      ],
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/salesforce`,
    },
    async validate(credentials) {
      try {
        const conn = new jsforce.Connection({
          instanceUrl: credentials.data.instanceUrl || 'https://login.salesforce.com',
          accessToken: credentials.data.accessToken,
        });
        
        const identity = await conn.identity();
        return !!identity.user_id;
      } catch {
        return false;
      }
    },
  },

  actions: {
    create_lead: actions.createLead,
    update_opportunity: actions.updateOpportunity,
    query_records: actions.queryRecords,
    create_case: actions.createCase,
  },

  triggers: {},
};

export default salesforceIntegration;
