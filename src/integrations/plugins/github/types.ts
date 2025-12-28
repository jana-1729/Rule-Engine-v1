/**
 * GitHub API Types
 */

export interface GitHubConfig {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface GitHubUser {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface GitHubResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
