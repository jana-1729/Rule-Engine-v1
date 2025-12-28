import { Integration } from '../../types';
import * as actions from './actions';

/**
 * Salesforce Integration
 * 
 * Salesforce integration for the Rule Engine platform.
 * Provides actions and triggers for Salesforce API.
 * 
 * @category crm
 * @version 1.0.0
 */
const salesforceIntegration: Integration = {
  metadata: {
    id: 'salesforce', slug: 'salesforce',
    name: 'Salesforce',
    description: 'Connect with Salesforce to automate your workflows',
    category: 'crm',
    version: '1.0.0',
    icon: '/assets/integrations/salesforce.png',
    website: 'https://salesforce.com',
    authType: 'oauth2' as const, documentation: 'https://developer.salesforce.com/docs/apis',
  },

  auth: { type: "oauth2", config: { authorizationUrl: "", tokenUrl: "", clientId: "", clientSecret: "", scopes: [], redirectUri: "" } },

  actions: {
    create_lead: actions.createLead,
    update_opportunity: actions.updateOpportunity,
  },

  triggers: {
    // Triggers can be added later
  },
};

export default salesforceIntegration;
