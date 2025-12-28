/**
 * Discord API Types
 */

export interface DiscordConfig {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
}

export interface DiscordMessage {
  id: string;
  channel_id: string;
  author: DiscordUser;
  content: string;
  timestamp: string;
}

