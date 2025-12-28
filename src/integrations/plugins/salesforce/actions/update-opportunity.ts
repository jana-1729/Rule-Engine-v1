import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import jsforce from 'jsforce';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Update Opportunity Action for Salesforce
 * 
 * Updates an existing opportunity in Salesforce using jsforce SDK
 * Supports stage updates and custom fields
 */
export const updateOpportunity: IntegrationAction = {
  id: 'update_opportunity',
  name: 'Update Opportunity',
  description: 'Update an existing opportunity in Salesforce',
  
  inputSchema: z.object({
    opportunityId: z.string().describe('Opportunity ID'),
    Name: z.string().optional().describe('Opportunity name'),
    StageName: z.string().optional().describe('Stage name'),
    Amount: z.number().optional().describe('Amount'),
    CloseDate: z.string().optional().describe('Close date (YYYY-MM-DD)'),
    Probability: z.number().min(0).max(100).optional().describe('Probability (0-100)'),
    Description: z.string().optional().describe('Description'),
    NextStep: z.string().optional().describe('Next step'),
    Type: z.string().optional().describe('Opportunity type'),
    LeadSource: z.string().optional().describe('Lead source'),
    customFields: z.record(z.any()).optional().describe('Custom fields'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Updating Salesforce opportunity', { opportunityId: input.opportunityId });
    
    try {
      // Initialize Salesforce connection
      const conn = new jsforce.Connection({
        instanceUrl: credentials.data.instanceUrl || 'https://login.salesforce.com',
        accessToken: credentials.data.accessToken,
      });

      // Build opportunity update object (only include provided fields)
      const opportunityData: any = {
        Id: input.opportunityId,
      };
      
      if (input.Name) opportunityData.Name = input.Name;
      if (input.StageName) opportunityData.StageName = input.StageName;
      if (input.Amount !== undefined) opportunityData.Amount = input.Amount;
      if (input.CloseDate) opportunityData.CloseDate = input.CloseDate;
      if (input.Probability !== undefined) opportunityData.Probability = input.Probability;
      if (input.Description) opportunityData.Description = input.Description;
      if (input.NextStep) opportunityData.NextStep = input.NextStep;
      if (input.Type) opportunityData.Type = input.Type;
      if (input.LeadSource) opportunityData.LeadSource = input.LeadSource;
      
      // Add custom fields
      if (input.customFields) {
        Object.assign(opportunityData, input.customFields);
      }

      // Update opportunity with automatic retry
      const result: any = await errorRecovery.executeWithRetry(
        async () => {
          return await conn.sobject('Opportunity').update(opportunityData);
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'salesforce',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Salesforce opportunity update (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      if (!result.success) {
        throw new Error(`Salesforce API error: ${JSON.stringify(result.errors)}`);
      }
      
      logger.info('Opportunity updated successfully', { opportunityId: result.id });
      
      return {
        success: true,
        data: {
          success: true,
          id: result.id,
        },
      };
    } catch (error) {
      logger.error('Failed to update Salesforce opportunity', { error });
      
      return {
        success: false,
        error: {
          code: 'UPDATE_OPPORTUNITY_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

