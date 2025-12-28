import { Integration } from '../../types';
import { hubspotAuth } from './auth';
import * as actions from './actions';
import * as triggers from './triggers';

/**
 * HubSpot Integration
 * 
 * HubSpot integration for the Rule Engine platform.
 * Provides actions and triggers for HubSpot API.
 * 
 * @category crm
 * @version 1.0.0
 */
const hubspotIntegration: Integration = {
  metadata: {
    slug: 'hubspot',
    name: 'HubSpot',
    description: 'Connect with HubSpot to automate your workflows',
    category: 'crm',
    version: '1.0.0',
    logo: '/assets/integrations/hubspot.png',
    color: '#FF7A59',
    website: 'https://hubspot.com',
    documentation: 'https://developers.hubspot.com/docs/api/overview',
    requiresEndUserAuth: true,
  },

  auth: hubspotAuth,

  actions: {
    create_contact: actions.createContact,
    update_contact: actions.updateContact,
  },

  triggers: {
    // Triggers can be added later
  },
};

export default hubspotIntegration;
