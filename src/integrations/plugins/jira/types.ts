/**
 * Jira API Types
 */

export interface JiraConfig {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface JiraUser {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface JiraResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
