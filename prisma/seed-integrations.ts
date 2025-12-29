import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding integrations...');

  // Slack Integration
  const slack = await prisma.integration.upsert({
    where: { slug: 'slack' },
    update: {
      name: 'Slack',
      description: 'Send messages and manage Slack workspaces',
      category: 'communication',
      logo: '/assets/integrations/slack.jpeg',
      color: '#4A154B',
      website: 'https://slack.com',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://slack.com/oauth/v2/authorize',
        tokenUrl: 'https://slack.com/api/oauth.v2.access',
        scopes: ['chat:write', 'channels:read', 'channels:manage', 'users:read'],
      },
      actions: {
        send_message: {
          id: 'send_message',
          name: 'Send Message',
          description: 'Send a message to a Slack channel',
        },
        create_channel: {
          id: 'create_channel',
          name: 'Create Channel',
          description: 'Create a new Slack channel',
        },
        get_user: {
          id: 'get_user',
          name: 'Get User Info',
          description: 'Get information about a Slack user',
        },
      },
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
    create: {
      slug: 'slack',
      name: 'Slack',
      description: 'Send messages and manage Slack workspaces',
      category: 'communication',
      logo: '/assets/integrations/slack.jpeg',
      color: '#4A154B',
      website: 'https://slack.com',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://slack.com/oauth/v2/authorize',
        tokenUrl: 'https://slack.com/api/oauth.v2.access',
        scopes: ['chat:write', 'channels:read', 'channels:manage', 'users:read'],
      },
      actions: {
        send_message: {
          id: 'send_message',
          name: 'Send Message',
          description: 'Send a message to a Slack channel',
        },
        create_channel: {
          id: 'create_channel',
          name: 'Create Channel',
          description: 'Create a new Slack channel',
        },
        get_user: {
          id: 'get_user',
          name: 'Get User Info',
          description: 'Get information about a Slack user',
        },
      },
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
  });

  console.log('✅ Slack integration created/updated:', slack.id);

  // Google Sheets Integration
  const googleSheets = await prisma.integration.upsert({
    where: { slug: 'google-sheets' },
    update: {
      name: 'Google Sheets',
      description: 'Read, write, and manage Google Sheets',
      category: 'productivity',
      logo: '/assets/integrations/google-sheets.webp',
      color: '#0F9D58',
      website: 'https://sheets.google.com',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'],
      },
      actions: {
        append_row: {
          id: 'append_row',
          name: 'Append Row',
          description: 'Append a row to a Google Sheet',
        },
        read_range: {
          id: 'read_range',
          name: 'Read Range',
          description: 'Read data from a range in Google Sheets',
        },
        update_cell: {
          id: 'update_cell',
          name: 'Update Cell',
          description: 'Update a cell or range in Google Sheets',
        },
        create_spreadsheet: {
          id: 'create_spreadsheet',
          name: 'Create Spreadsheet',
          description: 'Create a new Google Spreadsheet',
        },
      },
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
    create: {
      slug: 'google-sheets',
      name: 'Google Sheets',
      description: 'Read, write, and manage Google Sheets',
      category: 'productivity',
      logo: '/assets/integrations/google-sheets.webp',
      color: '#0F9D58',
      website: 'https://sheets.google.com',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'],
      },
      actions: {
        append_row: {
          id: 'append_row',
          name: 'Append Row',
          description: 'Append a row to a Google Sheet',
        },
        read_range: {
          id: 'read_range',
          name: 'Read Range',
          description: 'Read data from a range in Google Sheets',
        },
        update_cell: {
          id: 'update_cell',
          name: 'Update Cell',
          description: 'Update a cell or range in Google Sheets',
        },
        create_spreadsheet: {
          id: 'create_spreadsheet',
          name: 'Create Spreadsheet',
          description: 'Create a new Google Spreadsheet',
        },
      },
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
  });

  console.log('✅ Google Sheets integration created/updated:', googleSheets.id);

  // Notion Integration
  const notion = await prisma.integration.upsert({
    where: { slug: 'notion' },
    update: {
      name: 'Notion',
      description: 'Create pages, query databases, and manage Notion workspaces',
      category: 'productivity',
      logo: '/assets/integrations/notion.png',
      color: '#000000',
      website: 'https://notion.so',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
        tokenUrl: 'https://api.notion.com/v1/oauth/token',
        scopes: [],
      },
      actions: {
        create_page: {
          id: 'create_page',
          name: 'Create Page',
          description: 'Create a new page in Notion',
        },
        query_database: {
          id: 'query_database',
          name: 'Query Database',
          description: 'Query a Notion database',
        },
        update_page: {
          id: 'update_page',
          name: 'Update Page',
          description: 'Update a Notion page properties',
        },
        get_page: {
          id: 'get_page',
          name: 'Get Page',
          description: 'Retrieve a Notion page',
        },
      },
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
    create: {
      slug: 'notion',
      name: 'Notion',
      description: 'Create pages, query databases, and manage Notion workspaces',
      category: 'productivity',
      logo: '/assets/integrations/notion.png',
      color: '#000000',
      website: 'https://notion.so',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
        tokenUrl: 'https://api.notion.com/v1/oauth/token',
        scopes: [],
      },
      actions: {
        create_page: {
          id: 'create_page',
          name: 'Create Page',
          description: 'Create a new page in Notion',
        },
        query_database: {
          id: 'query_database',
          name: 'Query Database',
          description: 'Query a Notion database',
        },
        update_page: {
          id: 'update_page',
          name: 'Update Page',
          description: 'Update a Notion page properties',
        },
        get_page: {
          id: 'get_page',
          name: 'Get Page',
          description: 'Retrieve a Notion page',
        },
      },
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
  });

  console.log('✅ Notion integration created/updated:', notion.id);

  // Gmail Integration
  const gmail = await prisma.integration.upsert({
    where: { slug: 'gmail' },
    update: {
      name: 'Gmail',
      description: 'Send and read emails via Gmail',
      category: 'communication',
      logo: '/assets/integrations/gmail.jpg',
      color: '#EA4335',
      website: 'https://gmail.com',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
      },
      actions: {
        send_email: {
          id: 'send_email',
          name: 'Send Email',
          description: 'Send an email via Gmail',
        },
        read_emails: {
          id: 'read_emails',
          name: 'Read Emails',
          description: 'Read emails from Gmail inbox',
        },
      },
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
    create: {
      slug: 'gmail',
      name: 'Gmail',
      description: 'Send and read emails via Gmail',
      category: 'communication',
      logo: '/assets/integrations/gmail.jpg',
      color: '#EA4335',
      website: 'https://gmail.com',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
      },
      actions: {
        send_email: {
          id: 'send_email',
          name: 'Send Email',
          description: 'Send an email via Gmail',
        },
        read_emails: {
          id: 'read_emails',
          name: 'Read Emails',
          description: 'Read emails from Gmail inbox',
        },
      },
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
  });

  console.log('✅ Gmail integration created/updated:', gmail.id);

  // Microsoft Teams Integration
  const microsoftTeams = await prisma.integration.upsert({
    where: { slug: 'microsoft-teams' },
    update: {
      name: 'Microsoft Teams',
      description: 'Connect with Microsoft Teams to automate your workflows',
      category: 'communication',
      logo: '/assets/integrations/teams.webp',
      color: '#0078D4',
      website: 'https://teams.microsoft.com',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        scopes: ['https://graph.microsoft.com/Channel.ReadWrite.All', 'https://graph.microsoft.com/ChannelMessage.Send'],
      },
      actions: {
        send_message: {
          id: 'send_message',
          name: 'Send Message',
          description: 'Send a message to a Microsoft Teams channel',
        },
        create_channel: {
          id: 'create_channel',
          name: 'Create Channel',
          description: 'Create a new channel in a Microsoft Teams team',
        },
      },
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
    create: {
      slug: 'microsoft-teams',
      name: 'Microsoft Teams',
      description: 'Connect with Microsoft Teams to automate your workflows',
      category: 'communication',
      logo: '/assets/integrations/teams.webp',
      color: '#0078D4',
      website: 'https://teams.microsoft.com',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        scopes: ['https://graph.microsoft.com/Channel.ReadWrite.All', 'https://graph.microsoft.com/ChannelMessage.Send'],
      },
      actions: {
        send_message: {
          id: 'send_message',
          name: 'Send Message',
          description: 'Send a message to a Microsoft Teams channel',
        },
        create_channel: {
          id: 'create_channel',
          name: 'Create Channel',
          description: 'Create a new channel in a Microsoft Teams team',
        },
      },
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
  });

  console.log('✅ Microsoft Teams integration created/updated:', microsoftTeams.id);

  // Discord Integration
  const discord = await prisma.integration.upsert({
    where: { slug: 'discord' },
    update: {
      name: 'Discord',
      description: 'Connect with Discord to automate your workflows',
      category: 'communication',
      logo: '/assets/integrations/discord.webp',
      color: '#5865F2',
      website: 'https://discord.com',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://discord.com/api/oauth2/authorize',
        tokenUrl: 'https://discord.com/api/oauth2/token',
        scopes: ['bot', 'messages.read', 'messages.write'],
      },
      actions: {
        send_message: {
          id: 'send_message',
          name: 'Send Message',
          description: 'Send a message to a Discord channel',
        },
        create_channel: {
          id: 'create_channel',
          name: 'Create Channel',
          description: 'Create a new channel in a Discord server',
        },
      },
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
    create: {
      slug: 'discord',
      name: 'Discord',
      description: 'Connect with Discord to automate your workflows',
      category: 'communication',
      logo: '/assets/integrations/discord.webp',
      color: '#5865F2',
      website: 'https://discord.com',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://discord.com/api/oauth2/authorize',
        tokenUrl: 'https://discord.com/api/oauth2/token',
        scopes: ['bot', 'messages.read', 'messages.write'],
      },
      actions: {
        send_message: {
          id: 'send_message',
          name: 'Send Message',
          description: 'Send a message to a Discord channel',
        },
        create_channel: {
          id: 'create_channel',
          name: 'Create Channel',
          description: 'Create a new channel in a Discord server',
        },
      },
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
  });

  console.log('✅ Discord integration created/updated:', discord.id);

  // HubSpot Integration
  const hubspot = await prisma.integration.upsert({
    where: { slug: 'hubspot' },
    update: {
      name: 'HubSpot',
      description: 'Connect with HubSpot to automate your workflows',
      category: 'crm',
      logo: '/assets/integrations/hubspot.png',
      color: '#FF7A59',
      website: 'https://hubspot.com',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
        tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
        scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write'],
      },
      actions: {
        create_contact: {
          id: 'create_contact',
          name: 'Create Contact',
          description: 'Create a new contact in HubSpot',
        },
        update_contact: {
          id: 'update_contact',
          name: 'Update Contact',
          description: 'Update an existing contact',
        },
      },
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
    create: {
      slug: 'hubspot',
      name: 'HubSpot',
      description: 'Connect with HubSpot to automate your workflows',
      category: 'crm',
      logo: '/assets/integrations/hubspot.png',
      color: '#FF7A59',
      website: 'https://hubspot.com',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
        tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
        scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write'],
      },
      actions: {
        create_contact: {
          id: 'create_contact',
          name: 'Create Contact',
          description: 'Create a new contact in HubSpot',
        },
        update_contact: {
          id: 'update_contact',
          name: 'Update Contact',
          description: 'Update an existing contact',
        },
      },
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
  });

  console.log('✅ HubSpot integration created/updated:', hubspot.id);

  // Salesforce Integration
  const salesforce = await prisma.integration.upsert({
    where: { slug: 'salesforce' },
    update: {
      name: 'Salesforce',
      description: 'Connect with Salesforce CRM to automate your workflows',
      category: 'crm',
      logo: '/assets/integrations/salesforce.png',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
        tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
        scopes: ['api', 'refresh_token'],
      },
      
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
    create: {
      slug: 'salesforce',
      name: 'Salesforce',
      description: 'Connect with Salesforce CRM to automate your workflows',
      category: 'crm',
      logo: '/assets/integrations/salesforce.png',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
        tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
        scopes: ['api', 'refresh_token'],
      },
      actions: {
        create_lead: { id: 'create_lead', name: 'Create Lead', description: 'Create a new lead in Salesforce' },
        update_opportunity: { id: 'update_opportunity', name: 'Update Opportunity', description: 'Update an opportunity' },
        query_records: { id: 'query_records', name: 'Query Records', description: 'Query Salesforce records' },
        create_case: { id: 'create_case', name: 'Create Case', description: 'Create a support case' },
      },
      
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
  });

  console.log('✅ Salesforce integration created/updated:', salesforce.id);

  // Jira Integration
  const jira = await prisma.integration.upsert({
    where: { slug: 'jira' },
    update: {
      name: 'Jira',
      description: 'Connect with Jira to automate your project management',
      category: 'project-management',
      logo: '/assets/integrations/jira-icon.png',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://auth.atlassian.com/authorize',
        tokenUrl: 'https://auth.atlassian.com/oauth/token',
        scopes: ['read:jira-work', 'write:jira-work'],
      },
      
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
    create: {
      slug: 'jira',
      name: 'Jira',
      description: 'Connect with Jira to automate your project management',
      category: 'project-management',
      logo: '/assets/integrations/jira-icon.png',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://auth.atlassian.com/authorize',
        tokenUrl: 'https://auth.atlassian.com/oauth/token',
        scopes: ['read:jira-work', 'write:jira-work'],
      },
      actions: {
        create_issue: { id: 'create_issue', name: 'Create Issue', description: 'Create a new Jira issue' },
        update_issue: { id: 'update_issue', name: 'Update Issue', description: 'Update an existing issue' },
        add_comment: { id: 'add_comment', name: 'Add Comment', description: 'Add a comment to an issue' },
        search_issues: { id: 'search_issues', name: 'Search Issues', description: 'Search for issues using JQL' },
      },
      
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
  });

  console.log('✅ Jira integration created/updated:', jira.id);

  // GitHub Integration
  const github = await prisma.integration.upsert({
    where: { slug: 'github' },
    update: {
      name: 'GitHub',
      description: 'Connect with GitHub to automate your development workflows',
      category: 'developer-tools',
      logo: '/assets/integrations/notion.png',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        scopes: ['repo', 'user'],
      },
      
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
    create: {
      slug: 'github',
      name: 'GitHub',
      description: 'Connect with GitHub to automate your development workflows',
      category: 'developer-tools',
      logo: '/assets/integrations/notion.png',
      authType: 'oauth2',
      authConfig: {
        type: 'oauth2',
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        scopes: ['repo', 'user'],
      },
      actions: {
        create_issue: { id: 'create_issue', name: 'Create Issue', description: 'Create a new GitHub issue' },
        create_pr: { id: 'create_pr', name: 'Create Pull Request', description: 'Create a pull request' },
        create_branch: { id: 'create_branch', name: 'Create Branch', description: 'Create a new branch' },
        merge_pr: { id: 'merge_pr', name: 'Merge Pull Request', description: 'Merge a pull request' },
      },
      
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
  });

  console.log('✅ GitHub integration created/updated:', github.id);

  // Trello Integration
  const trello = await prisma.integration.upsert({
    where: { slug: 'trello' },
    update: {
      name: 'Trello',
      description: 'Connect with Trello to automate your project management',
      category: 'project-management',
      logo: '/assets/integrations/trello.png',
      authType: 'api_key',
      authConfig: {
        type: 'api_key',
        fields: ['apiKey', 'apiToken'],
      },
      
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
    create: {
      slug: 'trello',
      name: 'Trello',
      description: 'Connect with Trello to automate your project management',
      category: 'project-management',
      logo: '/assets/integrations/trello.png',
      authType: 'api_key',
      authConfig: {
        type: 'api_key',
        fields: ['apiKey', 'apiToken'],
      },
      actions: {
        create_card: { id: 'create_card', name: 'Create Card', description: 'Create a new Trello card' },
        update_card: { id: 'update_card', name: 'Update Card', description: 'Update a card' },
        add_checklist: { id: 'add_checklist', name: 'Add Checklist', description: 'Add a checklist to a card' },
        move_card: { id: 'move_card', name: 'Move Card', description: 'Move a card to another list' },
      },
      
      status: 'available',
      version: '1.0.0',
      requiresEndUserAuth: true,
      requiresAppAuth: false,
    },
  });

  console.log('✅ Trello integration created/updated:', trello.id);

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\nIntegrations added:');
  console.log('  - Slack (communication)');
  console.log('  - Google Sheets (productivity)');
  console.log('  - Notion (productivity)');
  console.log('  - Gmail (communication)');
  console.log('  - Microsoft Teams (communication)');
  console.log('  - Discord (communication)');
  console.log('  - HubSpot (crm)');
  console.log('  - Salesforce (crm)');
  console.log('  - Jira (project-management)');
  console.log('  - GitHub (developer-tools)');
  console.log('  - Trello (project-management)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
