import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import jsforce from 'jsforce';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Create Lead Action for Salesforce
 * 
 * Creates a new lead in Salesforce using jsforce SDK
 * Supports custom fields and automatic retry
 */
export const createLead: IntegrationAction = {
  id: 'create_lead',
  name: 'Create Lead',
  description: 'Create a new lead in Salesforce',
  
  inputSchema: z.object({
    LastName: z.string().describe('Last name (required)'),
    FirstName: z.string().optional().describe('First name'),
    Company: z.string().describe('Company name (required)'),
    Email: z.string().email().optional().describe('Email address'),
    Phone: z.string().optional().describe('Phone number'),
    Title: z.string().optional().describe('Job title'),
    Status: z.string().optional().default('Open - Not Contacted').describe('Lead status'),
    LeadSource: z.string().optional().describe('Lead source'),
    Industry: z.string().optional().describe('Industry'),
    Website: z.string().url().optional().describe('Website'),
    Description: z.string().optional().describe('Description'),
    customFields: z.record(z.any()).optional().describe('Custom fields'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Creating Salesforce lead', { 
      LastName: input.LastName,
      Company: input.Company
    });
    
    try {
      // Initialize Salesforce connection
      const conn = new jsforce.Connection({
        instanceUrl: credentials.data.instanceUrl || 'https://login.salesforce.com',
        accessToken: credentials.data.accessToken,
      });

      // Build lead object
      const leadData: any = {
        LastName: input.LastName,
        Company: input.Company,
        Status: input.Status,
      };
      
      if (input.FirstName) leadData.FirstName = input.FirstName;
      if (input.Email) leadData.Email = input.Email;
      if (input.Phone) leadData.Phone = input.Phone;
      if (input.Title) leadData.Title = input.Title;
      if (input.LeadSource) leadData.LeadSource = input.LeadSource;
      if (input.Industry) leadData.Industry = input.Industry;
      if (input.Website) leadData.Website = input.Website;
      if (input.Description) leadData.Description = input.Description;
      
      // Add custom fields
      if (input.customFields) {
        Object.assign(leadData, input.customFields);
      }

      // Create lead with automatic retry
      const result: any = await errorRecovery.executeWithRetry(
        async () => {
          return await conn.sobject('Lead').create(leadData);
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'salesforce',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Salesforce lead creation (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      if (!result.success) {
        throw new Error(`Salesforce API error: ${JSON.stringify(result.errors)}`);
      }
      
      logger.info('Lead created successfully', { leadId: result.id });
      
      return {
        success: true,
        data: {
          success: true,
          id: result.id,
        },
      };
    } catch (error) {
      logger.error('Failed to create Salesforce lead', { error });
      
      return {
        success: false,
        error: {
          code: 'CREATE_LEAD_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

