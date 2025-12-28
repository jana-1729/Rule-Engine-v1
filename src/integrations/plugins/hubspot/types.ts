/**
 * HubSpot API Types
 */

export interface HubSpotConfig {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface HubSpotUser {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface HubSpotResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
