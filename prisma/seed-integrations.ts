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

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\nIntegrations added:');
  console.log('  - Slack (communication)');
  console.log('  - Google Sheets (productivity)');
  console.log('  - Notion (productivity)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
