/**
 * Gmail API Types
 */

export interface GmailConfig {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface GmailUser {
  id: string;
  email: string;
  name: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: {
    headers: Array<{ name: string; value: string }>;
    body?: {
      data?: string;
    };
  };
}

export interface GmailSendResponse {
  id: string;
  threadId: string;
  labelIds: string[];
}

export interface GmailResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

