import { Integration } from '../../types';
import * as actions from './actions';
import axios from 'axios';

/**
 * HubSpot Integration
 * 
 * HubSpot CRM integration for the Rule Engine platform.
 * Manage contacts, deals, and lists with production-ready API implementations.
 * 
 * @category crm
 * @version 1.0.0
 */

const metadata = {
  id: 'hubspot',
  slug: 'hubspot',
  name: 'HubSpot',
  description: 'Connect with HubSpot CRM to automate your sales and marketing workflows',
  category: 'crm' as const,
  icon: '/assets/integrations/hubspot.png',
  version: '1.0.0',
  authType: 'oauth2' as const,
  website: 'https://www.hubspot.com',
  documentation: 'https://developers.hubspot.com/docs/api/overview',
};

const hubspotIntegration: Integration = {
  metadata,
  
  auth: {
    type: 'oauth2',
    config: {
      authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
      tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
      clientId: process.env.HUBSPOT_CLIENT_ID || '',
      clientSecret: process.env.HUBSPOT_CLIENT_SECRET || '',
      scopes: [
        'crm.objects.contacts.read',
        'crm.objects.contacts.write',
        'crm.objects.deals.read',
        'crm.objects.deals.write',
        'crm.lists.read',
        'crm.lists.write',
      ],
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/hubspot`,
    },
    async validate(credentials) {
      try {
        const response = await axios.get(
          'https://api.hubapi.com/oauth/v1/access-tokens/' + credentials.data.accessToken
        );
        return !!response.data.token;
      } catch {
        return false;
      }
    },
  },

  actions: {
    create_contact: actions.createContact,
    update_contact: actions.updateContact,
    create_deal: actions.createDeal,
    add_to_list: actions.addToList,
  },

  triggers: {},
};

export default hubspotIntegration;
