import { Integration } from '../../types';
import { salesforceAuth } from './auth';
import * as actions from './actions';
import * as triggers from './triggers';

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
    slug: 'salesforce',
    name: 'Salesforce',
    description: 'Connect with Salesforce to automate your workflows',
    category: 'crm',
    version: '1.0.0',
    logo: '/assets/integrations/salesforce.png',
    color: '#00A1E0',
    website: 'https://salesforce.com',
    documentation: 'https://developer.salesforce.com/docs/apis',
    requiresEndUserAuth: true,
  },

  auth: salesforceAuth,

  actions: {
    create_lead: actions.createLead,
    update_opportunity: actions.updateOpportunity,
  },

  triggers: {
    // Triggers can be added later
  },
};

export default salesforceIntegration;
