/**
 * Integration Tests
 * Tests for all integration plugins
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import slackIntegration from '../integrations/plugins/slack';
import notionIntegration from '../integrations/plugins/notion';
import googleSheetsIntegration from '../integrations/plugins/google-sheets';
import { integrationRegistry, loadIntegrations } from '../integrations/registry';

describe('Integration Registry', () => {
  beforeAll(async () => {
    await loadIntegrations();
  });

  it('should load all integrations', () => {
    const integrations = integrationRegistry.list();
    expect(integrations.length).toBeGreaterThanOrEqual(3);
  });

  it('should have Slack integration', () => {
    const slack = integrationRegistry.get('slack');
    expect(slack).toBeDefined();
    expect(slack?.metadata.name).toBe('Slack');
  });

  it('should have Notion integration', () => {
    const notion = integrationRegistry.get('notion');
    expect(notion).toBeDefined();
    expect(notion?.metadata.name).toBe('Notion');
  });

  it('should have Google Sheets integration', () => {
    const sheets = integrationRegistry.get('google-sheets');
    expect(sheets).toBeDefined();
    expect(sheets?.metadata.name).toBe('Google Sheets');
  });
});

describe('Slack Integration', () => {
  it('should have correct metadata', () => {
    expect(slackIntegration.metadata.slug).toBe('slack');
    expect(slackIntegration.metadata.name).toBe('Slack');
    expect(slackIntegration.metadata.category).toBe('communication');
  });

  it('should have required actions', () => {
    expect(slackIntegration.actions.send_message).toBeDefined();
    expect(slackIntegration.actions.create_channel).toBeDefined();
    expect(slackIntegration.actions.get_user).toBeDefined();
  });

  it('should have OAuth2 auth configuration', () => {
    expect(slackIntegration.auth.type).toBe('oauth2');
    expect(slackIntegration.auth.config).toBeDefined();
  });

  it('send_message action should have valid schema', () => {
    const action = slackIntegration.actions.send_message;
    expect(action.inputSchema).toBeDefined();
    expect(action.outputSchema).toBeDefined();
    expect(action.execute).toBeDefined();
  });
});

describe('Notion Integration', () => {
  it('should have correct metadata', () => {
    expect(notionIntegration.metadata.slug).toBe('notion');
    expect(notionIntegration.metadata.name).toBe('Notion');
    expect(notionIntegration.metadata.category).toBe('productivity');
  });

  it('should have required actions', () => {
    expect(notionIntegration.actions.create_page).toBeDefined();
    expect(notionIntegration.actions.query_database).toBeDefined();
    expect(notionIntegration.actions.update_page).toBeDefined();
    expect(notionIntegration.actions.get_page).toBeDefined();
  });

  it('should have OAuth2 auth configuration', () => {
    expect(notionIntegration.auth.type).toBe('oauth2');
    expect(notionIntegration.auth.config).toBeDefined();
  });
});

describe('Google Sheets Integration', () => {
  it('should have correct metadata', () => {
    expect(googleSheetsIntegration.metadata.slug).toBe('google-sheets');
    expect(googleSheetsIntegration.metadata.name).toBe('Google Sheets');
    expect(googleSheetsIntegration.metadata.category).toBe('productivity');
  });

  it('should have required actions', () => {
    expect(googleSheetsIntegration.actions.append_row).toBeDefined();
    expect(googleSheetsIntegration.actions.read_range).toBeDefined();
    expect(googleSheetsIntegration.actions.update_cell).toBeDefined();
    expect(googleSheetsIntegration.actions.create_spreadsheet).toBeDefined();
  });

  it('should have OAuth2 auth configuration', () => {
    expect(googleSheetsIntegration.auth.type).toBe('oauth2');
    expect(googleSheetsIntegration.auth.config).toBeDefined();
  });
});

describe('Integration Actions', () => {
  it('all actions should have required properties', () => {
    const integrations = [slackIntegration, notionIntegration, googleSheetsIntegration];

    integrations.forEach((integration) => {
      Object.values(integration.actions).forEach((action: any) => {
        expect(action.id).toBeDefined();
        expect(action.name).toBeDefined();
        expect(action.description).toBeDefined();
        expect(action.inputSchema).toBeDefined();
        expect(action.outputSchema).toBeDefined();
        expect(action.execute).toBeDefined();
        expect(typeof action.execute).toBe('function');
      });
    });
  });
});

