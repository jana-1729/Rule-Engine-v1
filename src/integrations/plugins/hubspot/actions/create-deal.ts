import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import { Client } from '@hubspot/api-client';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Create Deal Action for HubSpot
 * 
 * Creates a new deal in HubSpot CRM using the official SDK
 * Supports pipeline stages and custom fields
 */
export const createDeal: IntegrationAction = {
  id: 'create_deal',
  name: 'Create Deal',
  description: 'Create a new deal in HubSpot CRM',
  
  inputSchema: z.object({
    dealname: z.string().describe('Deal name'),
    amount: z.number().optional().describe('Deal amount'),
    closedate: z.string().optional().describe('Close date (YYYY-MM-DD)'),
    pipeline: z.string().optional().describe('Pipeline ID'),
    dealstage: z.string().optional().describe('Deal stage ID'),
    dealtype: z.string().optional().describe('Deal type'),
    description: z.string().optional().describe('Deal description'),
    associatedContactId: z.string().optional().describe('Associated contact ID'),
    associatedCompanyId: z.string().optional().describe('Associated company ID'),
    customProperties: z.record(z.any()).optional().describe('Custom properties'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    properties: z.record(z.any()).optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Creating HubSpot deal', { dealname: input.dealname });
    
    try {
      // Initialize HubSpot client
      const hubspotClient = new Client({ accessToken: credentials.data.accessToken });

      // Build properties object
      const properties: any = {
        dealname: input.dealname,
      };
      
      if (input.amount) properties.amount = input.amount.toString();
      if (input.closedate) properties.closedate = input.closedate;
      if (input.pipeline) properties.pipeline = input.pipeline;
      if (input.dealstage) properties.dealstage = input.dealstage;
      if (input.dealtype) properties.dealtype = input.dealtype;
      if (input.description) properties.description = input.description;
      
      // Add custom properties
      if (input.customProperties) {
        Object.assign(properties, input.customProperties);
      }

      // Build associations
      const associations: any[] = [];
      if (input.associatedContactId) {
        associations.push({
          to: { id: input.associatedContactId },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }], // Deal to Contact
        });
      }
      if (input.associatedCompanyId) {
        associations.push({
          to: { id: input.associatedCompanyId },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 5 }], // Deal to Company
        });
      }

      // Create deal with automatic retry
      const result = await errorRecovery.executeWithRetry(
        async () => {
          return await hubspotClient.crm.deals.basicApi.create({
            properties,
            associations,
          });
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'hubspot',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying HubSpot deal creation (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      logger.info('Deal created successfully', { 
        dealId: result.id,
        dealname: result.properties.dealname
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
      logger.error('Failed to create HubSpot deal', { error });
      
      return {
        success: false,
        error: {
          code: 'CREATE_DEAL_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

