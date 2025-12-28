import { Integration } from '../../types';
import * as actions from './actions';

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
    id: 'hubspot', slug: 'hubspot',
    name: 'HubSpot',
    description: 'Connect with HubSpot to automate your workflows',
    category: 'crm',
    version: '1.0.0',
    icon: '/assets/integrations/hubspot.png',
    website: 'https://hubspot.com',
    authType: 'oauth2' as const, documentation: 'https://developers.hubspot.com/docs/api/overview',
  },

  auth: { type: "oauth2", config: { authorizationUrl: "", tokenUrl: "", clientId: "", clientSecret: "", scopes: [], redirectUri: "" } },

  actions: {
    create_contact: actions.createContact,
    update_contact: actions.updateContact,
  },

  triggers: {
    // Triggers can be added later
  },
};

export default hubspotIntegration;
