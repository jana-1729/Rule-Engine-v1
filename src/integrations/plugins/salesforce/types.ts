/**
 * Salesforce API Types
 */

export interface SalesforceConfig {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface SalesforceUser {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface SalesforceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
