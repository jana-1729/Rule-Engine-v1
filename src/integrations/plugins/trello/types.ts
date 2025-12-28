/**
 * Trello API Types
 */

export interface TrelloConfig {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface TrelloUser {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface TrelloResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
