import { describe, it, expect, beforeAll } from '@jest/globals';
import { integrationRegistry, loadIntegrations } from '../registry';

describe('Integration Registry', () => {
  beforeAll(async () => {
    await loadIntegrations();
  });

  it('should load all integrations', () => {
    const integrations = integrationRegistry.list();
    expect(integrations.length).toBeGreaterThanOrEqual(4); // Slack, Notion, Sheets, Gmail
  });

  it('should have Slack integration', () => {
    const slack = integrationRegistry.get('slack');
    expect(slack).toBeDefined();
    expect(slack?.metadata.name).toBe('Slack');
    expect(slack?.metadata.category).toBe('communication');
  });

  it('should have Notion integration', () => {
    const notion = integrationRegistry.get('notion');
    expect(notion).toBeDefined();
    expect(notion?.metadata.name).toBe('Notion');
    expect(notion?.metadata.category).toBe('productivity');
  });

  it('should have Google Sheets integration', () => {
    const sheets = integrationRegistry.get('google-sheets');
    expect(sheets).toBeDefined();
    expect(sheets?.metadata.name).toBe('Google Sheets');
    expect(sheets?.actions.append_row).toBeDefined();
    expect(sheets?.actions.read_range).toBeDefined();
  });

  it('should have Gmail integration', () => {
    const gmail = integrationRegistry.get('gmail');
    expect(gmail).toBeDefined();
    expect(gmail?.metadata.name).toBe('Gmail');
    expect(gmail?.actions.send_email).toBeDefined();
    expect(gmail?.actions.read_emails).toBeDefined();
  });

  it('should get integrations by category', () => {
    const communication = integrationRegistry.getByCategory('communication');
    expect(communication.length).toBeGreaterThan(0);
    expect(communication.some(i => i.metadata.slug === 'slack')).toBe(true);
    expect(communication.some(i => i.metadata.slug === 'gmail')).toBe(true);

    const productivity = integrationRegistry.getByCategory('productivity');
    expect(productivity.length).toBeGreaterThan(0);
    expect(productivity.some(i => i.metadata.slug === 'notion')).toBe(true);
    expect(productivity.some(i => i.metadata.slug === 'google-sheets')).toBe(true);
  });

  it('should search integrations', () => {
    const results = integrationRegistry.search('email');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(i => i.metadata.slug === 'gmail')).toBe(true);
  });

  it('should get action by integration and action ID', () => {
    const sendEmail = integrationRegistry.getAction('gmail', 'send_email');
    expect(sendEmail).toBeDefined();
    expect(sendEmail?.id).toBe('send_email');

    const appendRow = integrationRegistry.getAction('google-sheets', 'append_row');
    expect(appendRow).toBeDefined();
    expect(appendRow?.id).toBe('append_row');
  });

  it('should validate integrations', () => {
    const integrations = integrationRegistry.list();
    
    integrations.forEach(integration => {
      const validation = integrationRegistry.validateIntegration(integration);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });
  });

  it('should have required metadata fields', () => {
    const integrations = integrationRegistry.list();
    
    integrations.forEach(integration => {
      expect(integration.metadata.slug).toBeDefined();
      expect(integration.metadata.name).toBeDefined();
      expect(integration.metadata.version).toBeDefined();
      expect(integration.metadata.category).toBeDefined();
      expect(integration.auth).toBeDefined();
      expect(Object.keys(integration.actions).length).toBeGreaterThan(0);
    });
  });
});

