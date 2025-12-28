import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { Client } from '@hubspot/api-client';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Update Contact Action for HubSpot
 * 
 * Updates an existing contact in HubSpot CRM using the official SDK
 * Supports custom fields and automatic retry
 */
export const updateContact: IntegrationAction = {
  id: 'update_contact',
  name: 'Update Contact',
  description: 'Update an existing contact in HubSpot CRM',
  
  inputSchema: z.object({
    contactId: z.string().describe('Contact ID'),
    email: z.string().email().optional().describe('Contact email address'),
    firstname: z.string().optional().describe('First name'),
    lastname: z.string().optional().describe('Last name'),
    phone: z.string().optional().describe('Phone number'),
    company: z.string().optional().describe('Company name'),
    website: z.string().url().optional().describe('Website URL'),
    lifecyclestage: z.string().optional().describe('Lifecycle stage'),
    customProperties: z.record(z.any()).optional().describe('Custom properties'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    properties: z.record(z.any()).optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Updating HubSpot contact', { contactId: input.contactId });
    
    try {
      // Initialize HubSpot client
      const hubspotClient = new Client({ accessToken: credentials.data.accessToken });

      // Build properties object (only include provided fields)
      const properties: any = {};
      
      if (input.email) properties.email = input.email;
      if (input.firstname) properties.firstname = input.firstname;
      if (input.lastname) properties.lastname = input.lastname;
      if (input.phone) properties.phone = input.phone;
      if (input.company) properties.company = input.company;
      if (input.website) properties.website = input.website;
      if (input.lifecyclestage) properties.lifecyclestage = input.lifecyclestage;
      
      // Add custom properties
      if (input.customProperties) {
        Object.assign(properties, input.customProperties);
      }

      // Update contact with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await hubspotClient.crm.contacts.basicApi.update(
            input.contactId,
            { properties }
          );
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'hubspot',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying HubSpot contact update (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Contact updated successfully', { 
        contactId: result.id
      });
      
      return {
        success: true,
        data: {
          success: true,
          id: result.id,
          properties: result.properties,
        },
      };
    } catch (error) {
      logger.error('Failed to update HubSpot contact', { error });
      
      return {
        success: false,
        error: {
          code: 'UPDATE_CONTACT_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

