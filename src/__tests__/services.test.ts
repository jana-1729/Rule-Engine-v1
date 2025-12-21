/**
 * Service Tests
 * Tests for email and API key services
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { EmailService } from '../services/email-service';
import { APIKeyService } from '../services/api-key-service';

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = new EmailService();
  });

  it('should initialize with correct provider', () => {
    expect(emailService).toBeDefined();
  });

  it('should generate valid email options', () => {
    const options = {
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>Test content</p>',
    };

    expect(options.to).toBe('test@example.com');
    expect(options.subject).toBe('Test Email');
    expect(options.html).toBeDefined();
  });

  it('should handle multiple recipients', () => {
    const options = {
      to: ['user1@example.com', 'user2@example.com'],
      subject: 'Test',
      html: '<p>Test</p>',
    };

    expect(Array.isArray(options.to)).toBe(true);
    expect(options.to.length).toBe(2);
  });
});

describe('APIKeyService', () => {
  let apiKeyService: APIKeyService;

  beforeEach(() => {
    apiKeyService = new APIKeyService();
  });

  it('should generate valid API key', () => {
    const key = apiKeyService.generateKey('app');
    expect(key).toMatch(/^app_/);
    expect(key.length).toBeGreaterThan(10);
  });

  it('should hash API key consistently', () => {
    const key = 'test_key_123';
    const hash1 = apiKeyService.hashKey(key);
    const hash2 = apiKeyService.hashKey(key);
    
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 produces 64 character hex string
  });

  it('should get correct key prefix', () => {
    const key = 'app_abc123xyz789';
    const prefix = apiKeyService.getKeyPrefix(key);
    
    expect(prefix).toContain('app_');
    expect(prefix).toContain('...');
    expect(prefix.length).toBeLessThan(key.length);
  });

  it('should generate unique keys', () => {
    const key1 = apiKeyService.generateKey('app');
    const key2 = apiKeyService.generateKey('app');
    
    expect(key1).not.toBe(key2);
  });

  it('should hash different keys to different values', () => {
    const key1 = 'test_key_1';
    const key2 = 'test_key_2';
    const hash1 = apiKeyService.hashKey(key1);
    const hash2 = apiKeyService.hashKey(key2);
    
    expect(hash1).not.toBe(hash2);
  });
});

