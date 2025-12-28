import { describe, it, expect } from '@jest/globals';
import gmailIntegration from '../plugins/gmail';

describe('Gmail Integration', () => {
  it('should have correct metadata', () => {
    expect(gmailIntegration.metadata.slug).toBe('gmail');
    expect(gmailIntegration.metadata.name).toBe('Gmail');
    expect(gmailIntegration.metadata.category).toBe('communication');
    expect(gmailIntegration.metadata.version).toBe('1.0.0');
  });

  it('should have OAuth2 auth configuration', () => {
    expect(gmailIntegration.auth).toBeDefined();
    expect(gmailIntegration.auth.type).toBe('oauth2');
    expect(gmailIntegration.auth.config).toBeDefined();
    expect((gmailIntegration.auth.config as any).scopes).toContain('https://www.googleapis.com/auth/gmail.send');
  });

  it('should have send_email action', () => {
    const action = gmailIntegration.actions.send_email;
    expect(action).toBeDefined();
    expect(action.id).toBe('send_email');
    expect(action.name).toBe('Send Email');
    expect(action.inputSchema).toBeDefined();
    expect(action.outputSchema).toBeDefined();
    expect(action.execute).toBeDefined();
  });

  it('should have read_emails action', () => {
    const action = gmailIntegration.actions.read_emails;
    expect(action).toBeDefined();
    expect(action.id).toBe('read_emails');
    expect(action.name).toBe('Read Emails');
    expect(action.inputSchema).toBeDefined();
    expect(action.outputSchema).toBeDefined();
    expect(action.execute).toBeDefined();
  });

  it('should validate send_email input schema', () => {
    const action = gmailIntegration.actions.send_email;
    
    // Valid input
    const validInput = {
      to: 'test@example.com',
      subject: 'Test Subject',
      body: 'Test Body',
    };
    expect(() => action.inputSchema.parse(validInput)).not.toThrow();

    // Invalid email
    expect(() => {
      action.inputSchema.parse({
        to: 'invalid-email',
        subject: 'Test',
        body: 'Test',
      });
    }).toThrow();
  });

  it('should validate read_emails input schema', () => {
    const action = gmailIntegration.actions.read_emails;
    
    // Valid input with defaults
    const validInput = {};
    expect(() => action.inputSchema.parse(validInput)).not.toThrow();

    // Valid input with query
    const validInputWithQuery = {
      maxResults: 20,
      query: 'is:unread',
    };
    expect(() => action.inputSchema.parse(validInputWithQuery)).not.toThrow();
  });
});

