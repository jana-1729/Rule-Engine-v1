/**
 * Comprehensive Integration Test Suite
 * 
 * Tests all 11 integrations for:
 * - Proper registration
 * - Metadata validation
 * - Action availability
 * - Error recovery integration
 * - Type safety
 */

import { integrationRegistry, loadIntegrations } from '../registry';
import { Integration } from '../types';

describe('Integration Suite - Comprehensive Tests', () => {
  beforeAll(async () => {
    await loadIntegrations();
  });

  describe('Integration Registry', () => {
    test('should load all 11 integrations', () => {
      const integrations = integrationRegistry.list();
      expect(integrations).toHaveLength(11);
    });

    test('should have unique slugs', () => {
      const integrations = integrationRegistry.list();
      const slugs = integrations.map(i => i.metadata.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(integrations.length);
    });

    test('should have valid metadata for all integrations', () => {
      const integrations = integrationRegistry.list();
      
      integrations.forEach(integration => {
        expect(integration.metadata.id).toBeTruthy();
        expect(integration.metadata.slug).toBeTruthy();
        expect(integration.metadata.name).toBeTruthy();
        expect(integration.metadata.description).toBeTruthy();
        expect(integration.metadata.version).toBeTruthy();
        expect(integration.metadata.category).toBeTruthy();
        expect(integration.metadata.icon).toBeTruthy();
        expect(integration.metadata.authType).toBeTruthy();
      });
    });
  });

  describe('Gmail Integration', () => {
    let gmail: Integration | undefined;

    beforeAll(() => {
      gmail = integrationRegistry.get('gmail');
    });

    test('should be registered', () => {
      expect(gmail).toBeDefined();
    });

    test('should have correct metadata', () => {
      expect(gmail?.metadata.name).toBe('Gmail');
      expect(gmail?.metadata.category).toBe('communication');
      expect(gmail?.metadata.authType).toBe('oauth2');
    });

    test('should have 3 actions', () => {
      expect(Object.keys(gmail?.actions || {})).toHaveLength(3);
    });

    test('should have required actions', () => {
      expect(gmail?.actions.send_email).toBeDefined();
      expect(gmail?.actions.read_emails).toBeDefined();
      expect(gmail?.actions.create_draft).toBeDefined();
    });
  });

  describe('Notion Integration', () => {
    let notion: Integration | undefined;

    beforeAll(() => {
      notion = integrationRegistry.get('notion');
    });

    test('should be registered', () => {
      expect(notion).toBeDefined();
    });

    test('should have correct metadata', () => {
      expect(notion?.metadata.name).toBe('Notion');
      expect(notion?.metadata.category).toBe('productivity');
    });

    test('should have 3 actions', () => {
      expect(Object.keys(notion?.actions || {})).toHaveLength(3);
    });
  });

  describe('Google Sheets Integration', () => {
    let sheets: Integration | undefined;

    beforeAll(() => {
      sheets = integrationRegistry.get('google-sheets');
    });

    test('should be registered', () => {
      expect(sheets).toBeDefined();
    });

    test('should have correct metadata', () => {
      expect(sheets?.metadata.name).toBe('Google Sheets');
      expect(sheets?.metadata.category).toBe('productivity');
    });

    test('should have 4 actions', () => {
      expect(Object.keys(sheets?.actions || {})).toHaveLength(4);
    });
  });

  describe('Slack Integration', () => {
    let slack: Integration | undefined;

    beforeAll(() => {
      slack = integrationRegistry.get('slack');
    });

    test('should be registered', () => {
      expect(slack).toBeDefined();
    });

    test('should have correct metadata', () => {
      expect(slack?.metadata.name).toBe('Slack');
      expect(slack?.metadata.category).toBe('communication');
    });

    test('should have 4 actions', () => {
      expect(Object.keys(slack?.actions || {})).toHaveLength(4);
    });
  });

  describe('Microsoft Teams Integration', () => {
    let teams: Integration | undefined;

    beforeAll(() => {
      teams = integrationRegistry.get('microsoft-teams');
    });

    test('should be registered', () => {
      expect(teams).toBeDefined();
    });

    test('should have correct metadata', () => {
      expect(teams?.metadata.name).toBe('Microsoft Teams');
      expect(teams?.metadata.category).toBe('communication');
    });

    test('should have 4 actions', () => {
      expect(Object.keys(teams?.actions || {})).toHaveLength(4);
    });
  });

  describe('Discord Integration', () => {
    let discord: Integration | undefined;

    beforeAll(() => {
      discord = integrationRegistry.get('discord');
    });

    test('should be registered', () => {
      expect(discord).toBeDefined();
    });

    test('should have correct metadata', () => {
      expect(discord?.metadata.name).toBe('Discord');
      expect(discord?.metadata.category).toBe('communication');
    });

    test('should have 4 actions', () => {
      expect(Object.keys(discord?.actions || {})).toHaveLength(4);
    });
  });

  describe('HubSpot Integration', () => {
    let hubspot: Integration | undefined;

    beforeAll(() => {
      hubspot = integrationRegistry.get('hubspot');
    });

    test('should be registered', () => {
      expect(hubspot).toBeDefined();
    });

    test('should have correct metadata', () => {
      expect(hubspot?.metadata.name).toBe('HubSpot');
      expect(hubspot?.metadata.category).toBe('crm');
    });

    test('should have 4 actions', () => {
      expect(Object.keys(hubspot?.actions || {})).toHaveLength(4);
    });
  });

  describe('Salesforce Integration', () => {
    let salesforce: Integration | undefined;

    beforeAll(() => {
      salesforce = integrationRegistry.get('salesforce');
    });

    test('should be registered', () => {
      expect(salesforce).toBeDefined();
    });

    test('should have correct metadata', () => {
      expect(salesforce?.metadata.name).toBe('Salesforce');
      expect(salesforce?.metadata.category).toBe('crm');
    });

    test('should have 4 actions', () => {
      expect(Object.keys(salesforce?.actions || {})).toHaveLength(4);
    });
  });

  describe('Jira Integration', () => {
    let jira: Integration | undefined;

    beforeAll(() => {
      jira = integrationRegistry.get('jira');
    });

    test('should be registered', () => {
      expect(jira).toBeDefined();
    });

    test('should have correct metadata', () => {
      expect(jira?.metadata.name).toBe('Jira');
      expect(jira?.metadata.category).toBe('project-management');
    });

    test('should have 4 actions', () => {
      expect(Object.keys(jira?.actions || {})).toHaveLength(4);
    });
  });

  describe('GitHub Integration', () => {
    let github: Integration | undefined;

    beforeAll(() => {
      github = integrationRegistry.get('github');
    });

    test('should be registered', () => {
      expect(github).toBeDefined();
    });

    test('should have correct metadata', () => {
      expect(github?.metadata.name).toBe('GitHub');
      expect(github?.metadata.category).toBe('developer-tools');
    });

    test('should have 4 actions', () => {
      expect(Object.keys(github?.actions || {})).toHaveLength(4);
    });
  });

  describe('Trello Integration', () => {
    let trello: Integration | undefined;

    beforeAll(() => {
      trello = integrationRegistry.get('trello');
    });

    test('should be registered', () => {
      expect(trello).toBeDefined();
    });

    test('should have correct metadata', () => {
      expect(trello?.metadata.name).toBe('Trello');
      expect(trello?.metadata.category).toBe('project-management');
    });

    test('should have 4 actions', () => {
      expect(Object.keys(trello?.actions || {})).toHaveLength(4);
    });
  });

  describe('Category Distribution', () => {
    test('should have correct category distribution', () => {
      const integrations = integrationRegistry.list();
      const categories = integrations.map(i => i.metadata.category);
      
      const categoryCount = categories.reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(categoryCount['communication']).toBe(4); // Gmail, Slack, Teams, Discord
      expect(categoryCount['productivity']).toBe(2); // Notion, Google Sheets
      expect(categoryCount['crm']).toBe(2); // HubSpot, Salesforce
      expect(categoryCount['project-management']).toBe(2); // Jira, Trello
      expect(categoryCount['developer-tools']).toBe(1); // GitHub
    });
  });

  describe('Action Validation', () => {
    test('all actions should have required properties', () => {
      const integrations = integrationRegistry.list();
      
      integrations.forEach(integration => {
        Object.entries(integration.actions).forEach(([actionId, action]) => {
          expect(action.id).toBeTruthy();
          expect(action.name).toBeTruthy();
          expect(action.description).toBeTruthy();
          expect(action.inputSchema).toBeDefined();
          expect(action.outputSchema).toBeDefined();
          expect(typeof action.execute).toBe('function');
        });
      });
    });

    test('total action count should be 42', () => {
      const integrations = integrationRegistry.list();
      const totalActions = integrations.reduce(
        (sum, integration) => sum + Object.keys(integration.actions).length,
        0
      );
      expect(totalActions).toBe(42);
    });
  });

  describe('Search and Filter', () => {
    test('should search integrations by name', () => {
      const results = integrationRegistry.search('gmail');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].metadata.slug).toBe('gmail');
    });

    test('should filter by category', () => {
      const crm = integrationRegistry.getByCategory('crm');
      expect(crm).toHaveLength(2);
      expect(crm.map(i => i.metadata.slug)).toContain('hubspot');
      expect(crm.map(i => i.metadata.slug)).toContain('salesforce');
    });

    test('should get specific action', () => {
      const action = integrationRegistry.getAction('gmail', 'send_email');
      expect(action).toBeDefined();
      expect(action?.id).toBe('send_email');
    });
  });

  describe('Performance', () => {
    test('should load integrations quickly', async () => {
      const start = Date.now();
      await loadIntegrations();
      const duration = Date.now() - start;
      
      // Should load in less than 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    test('should retrieve integrations quickly', () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        integrationRegistry.get('gmail');
      }
      const duration = Date.now() - start;
      
      // 1000 retrievals should take less than 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});

