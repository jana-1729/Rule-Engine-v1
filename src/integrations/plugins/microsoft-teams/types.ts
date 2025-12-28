/**
 * Microsoft Teams API Types
 * 
 * Type definitions for Microsoft Teams API responses and requests.
 */

export interface MicrosoftTeamsConfig {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface MicrosoftTeamsUser {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface MicrosoftTeamsResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface MicrosoftTeamsMessage {
  id: string;
  body: {
    content: string;
    contentType: string;
  };
  from: {
    user: {
      id: string;
      displayName: string;
    };
  };
  createdDateTime: string;
}

