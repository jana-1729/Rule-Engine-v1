import { IntegrationAction } from '../../../types';
import { z } from 'zod';
import jsforce from 'jsforce';
import { errorRecovery } from '@/services/error-recovery-service';

/**
 * Create Case Action for Salesforce
 * 
 * Creates a new support case in Salesforce using jsforce SDK
 * Supports priority, status, and custom fields
 */
export const createCase: IntegrationAction = {
  id: 'create_case',
  name: 'Create Case',
  description: 'Create a new support case in Salesforce',
  
  inputSchema: z.object({
    Subject: z.string().describe('Case subject'),
    Description: z.string().optional().describe('Case description'),
    Status: z.string().optional().default('New').describe('Case status'),
    Priority: z.string().optional().default('Medium').describe('Priority (Low, Medium, High)'),
    Origin: z.string().optional().default('Web').describe('Case origin (Web, Phone, Email)'),
    Type: z.string().optional().describe('Case type'),
    ContactId: z.string().optional().describe('Associated contact ID'),
    AccountId: z.string().optional().describe('Associated account ID'),
    Reason: z.string().optional().describe('Case reason'),
    SuppliedEmail: z.string().email().optional().describe('Supplied email'),
    SuppliedName: z.string().optional().describe('Supplied name'),
    customFields: z.record(z.any()).optional().describe('Custom fields'),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
    caseNumber: z.string().optional(),
  }),

  async execute(input, credentials, context) {
    const { logger } = context;
    
    logger.info('Creating Salesforce case', { Subject: input.Subject });
    
    try {
      // Initialize Salesforce connection
      const conn = new jsforce.Connection({
        instanceUrl: credentials.data.instanceUrl || 'https://login.salesforce.com',
        accessToken: credentials.data.accessToken,
      });

      // Build case object
      const caseData: any = {
        Subject: input.Subject,
        Status: input.Status,
        Priority: input.Priority,
        Origin: input.Origin,
      };
      
      if (input.Description) caseData.Description = input.Description;
      if (input.Type) caseData.Type = input.Type;
      if (input.ContactId) caseData.ContactId = input.ContactId;
      if (input.AccountId) caseData.AccountId = input.AccountId;
      if (input.Reason) caseData.Reason = input.Reason;
      if (input.SuppliedEmail) caseData.SuppliedEmail = input.SuppliedEmail;
      if (input.SuppliedName) caseData.SuppliedName = input.SuppliedName;
      
      // Add custom fields
      if (input.customFields) {
        Object.assign(caseData, input.customFields);
      }

      // Create case with automatic retry
      const result: any = await errorRecovery.executeWithRetry(
        async () => {
          return await conn.sobject('Case').create(caseData);
        },
        {
          retryConfig: {
            maxRetries: 3,
          },
          serviceName: 'salesforce',
          onRetry: (error, attempt) => {
            logger.warn(`Retrying Salesforce case creation (attempt ${attempt})`, { error: error.message });
          },
        }
      );
      
      if (!result.success) {
        throw new Error(`Salesforce API error: ${JSON.stringify(result.errors)}`);
      }
      
      // Fetch case number
      let caseNumber;
      try {
        const caseRecord = await conn.sobject('Case').retrieve(result.id);
        caseNumber = (caseRecord as any).CaseNumber;
      } catch (e) {
        // Case number fetch failed, but case was created
        logger.warn('Failed to fetch case number', { error: e });
      }
      
      logger.info('Case created successfully', { 
        caseId: result.id,
        caseNumber
      });
      
      return {
        success: true,
        data: {
          success: true,
          id: result.id,
          caseNumber,
        },
      };
    } catch (error) {
      logger.error('Failed to create Salesforce case', { error });
      
      return {
        success: false,
        error: {
          code: 'CREATE_CASE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  },
};

