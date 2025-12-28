/**
 * Documentation Generator Script
 * 
 * Generates comprehensive documentation and blog posts for all integrations
 */

import fs from 'fs-extra';
import path from 'path';

interface IntegrationMeta {
  slug: string;
  name: string;
  category: string;
  description: string;
  actions: string[];
  useCases: string[];
  icon: string;
}

const INTEGRATIONS: IntegrationMeta[] = [
  {
    slug: 'notion',
    name: 'Notion',
    category: 'Productivity',
    description: 'Knowledge management and collaboration platform',
    actions: ['create_page', 'update_page', 'query_database'],
    useCases: ['Knowledge Base Automation', 'Project Documentation', 'Team Wiki Management'],
    icon: 'notion.svg',
  },
  {
    slug: 'google-sheets',
    name: 'Google Sheets',
    category: 'Productivity',
    description: 'Spreadsheet automation and data management',
    actions: ['append_row', 'read_range', 'update_cell', 'batch_update'],
    useCases: ['Data Logging', 'Report Generation', 'Inventory Management'],
    icon: 'google-sheets.svg',
  },
  {
    slug: 'slack',
    name: 'Slack',
    category: 'Communication',
    description: 'Team communication and collaboration',
    actions: ['send_message', 'upload_file', 'add_reaction', 'create_channel'],
    useCases: ['Team Notifications', 'Alert Systems', 'Workflow Updates'],
    icon: 'slack.svg',
  },
  {
    slug: 'microsoft-teams',
    name: 'Microsoft Teams',
    category: 'Communication',
    description: 'Enterprise collaboration platform',
    actions: ['send_message', 'send_adaptive_card', 'schedule_meeting', 'create_channel'],
    useCases: ['Enterprise Notifications', 'Meeting Automation', 'Team Collaboration'],
    icon: 'microsoft-teams.svg',
  },
  {
    slug: 'discord',
    name: 'Discord',
    category: 'Communication',
    description: 'Community communication platform',
    actions: ['send_message', 'send_embed', 'create_webhook', 'create_channel'],
    useCases: ['Community Management', 'Bot Automation', 'Event Notifications'],
    icon: 'discord.svg',
  },
  {
    slug: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    description: 'Marketing and sales automation platform',
    actions: ['create_contact', 'update_contact', 'create_deal', 'add_to_list'],
    useCases: ['Lead Management', 'Marketing Automation', 'Sales Pipeline'],
    icon: 'hubspot.svg',
  },
  {
    slug: 'salesforce',
    name: 'Salesforce',
    category: 'CRM',
    description: 'Enterprise CRM platform',
    actions: ['create_lead', 'update_opportunity', 'query_records', 'create_case'],
    useCases: ['Sales Automation', 'Customer Support', 'Enterprise CRM'],
    icon: 'salesforce.svg',
  },
  {
    slug: 'jira',
    name: 'Jira',
    category: 'Project Management',
    description: 'Issue tracking and project management',
    actions: ['create_issue', 'update_issue', 'add_comment', 'search_issues'],
    useCases: ['Bug Tracking', 'Sprint Management', 'Project Workflows'],
    icon: 'jira.svg',
  },
  {
    slug: 'github',
    name: 'GitHub',
    category: 'Developer Tools',
    description: 'Code hosting and collaboration platform',
    actions: ['create_issue', 'create_pr', 'create_branch', 'merge_pr'],
    useCases: ['CI/CD Automation', 'Code Review', 'Release Management'],
    icon: 'github.svg',
  },
  {
    slug: 'trello',
    name: 'Trello',
    category: 'Project Management',
    description: 'Visual project management platform',
    actions: ['create_card', 'update_card', 'add_checklist', 'move_card'],
    useCases: ['Task Management', 'Kanban Workflows', 'Team Collaboration'],
    icon: 'trello.svg',
  },
];

function generateDocumentation(integration: IntegrationMeta): string {
  return `# ${integration.name} Integration Guide

![${integration.name}](../../public/assets/integrations/${integration.icon})

## Overview

The ${integration.name} integration enables you to automate ${integration.description.toLowerCase()} workflows. Built with official SDKs for production-grade reliability.

**Category**: ${integration.category}  
**Authentication**: OAuth 2.0  
**Status**: ✅ Production Ready

## Features

${integration.actions.map(action => `- ✅ ${action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`).join('\n')}
- ✅ Automatic retry on failures
- ✅ Error recovery built-in

## Quick Start

### 1. Connect ${integration.name}

1. Navigate to [Integrations](/dashboard/integrations)
2. Click on **${integration.name}**
3. Click **Connect**
4. Authorize with your account
5. Grant required permissions

### 2. Create Your First Workflow

\`\`\`javascript
{
  "name": "${integration.name} Automation",
  "trigger": {
    "type": "manual"
  },
  "actions": [
    {
      "integration": "${integration.slug}",
      "action": "${integration.actions[0]}",
      "config": {
        // Your configuration here
      }
    }
  ]
}
\`\`\`

## Available Actions

${integration.actions.map((action, index) => `
### ${index + 1}. ${action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}

**Action ID**: \`${action}\`

Automate ${action.replace(/_/g, ' ')} operations.

#### Example

\`\`\`json
{
  "integration": "${integration.slug}",
  "action": "${action}",
  "config": {
    // Configuration parameters
  }
}
\`\`\`
`).join('\n')}

## Use Cases

${integration.useCases.map((useCase, index) => `
### ${index + 1}. ${useCase}

Automate ${useCase.toLowerCase()} with ${integration.name}.

\`\`\`javascript
{
  "name": "${useCase}",
  "trigger": {
    "type": "webhook"
  },
  "actions": [
    {
      "integration": "${integration.slug}",
      "action": "${integration.actions[0]}",
      "config": {
        // Your configuration
      }
    }
  ]
}
\`\`\`
`).join('\n')}

## Best Practices

1. **Start Simple** - Begin with basic workflows
2. **Test Thoroughly** - Always test before production
3. **Monitor Performance** - Check execution logs regularly
4. **Handle Errors** - Implement proper error handling

## Support

- 📧 Email: support@ruleengine.com
- 💬 Slack: [Join our community](https://slack.ruleengine.com)
- 📖 API Docs: [${integration.name} API Reference](/docs/api/${integration.slug})

## Related Integrations

${INTEGRATIONS.filter(i => i.category === integration.category && i.slug !== integration.slug).map(i => `- [${i.name}](/docs/integrations/${i.slug})`).join('\n')}

---

**Last Updated**: December 28, 2025  
**Integration Version**: 1.0.0
`;
}

function generateBlog(integration: IntegrationMeta): string {
  return `# How to Automate ${integration.name}: Complete Guide

**Published**: December 28, 2025  
**Author**: Rule Engine Team  
**Reading Time**: 10 minutes  
**Category**: Integration Guides

![${integration.name}](../../public/assets/integrations/${integration.icon})

## Introduction

${integration.name} automation can transform how you work. This comprehensive guide shows you how to automate ${integration.name} using Rule Engine's production-ready integration.

## What You'll Learn

- ✅ How to connect ${integration.name} to Rule Engine
- ✅ Building your first automation
- ✅ Advanced workflow patterns
- ✅ Real-world use cases
- ✅ Best practices and tips

## Why Automate ${integration.name}?

### Time Savings

Automation can save hours of manual work every day.

### Consistency

Automated workflows ensure consistent execution every time.

### Scalability

Handle growing workloads without adding resources.

## Getting Started

### Prerequisites

- Rule Engine account ([Sign up free](https://ruleengine.com/signup))
- ${integration.name} account
- 10 minutes to set up

### Step 1: Connect ${integration.name}

1. Log into your Rule Engine dashboard
2. Go to **Integrations**
3. Find **${integration.name}**
4. Click **Connect**
5. Authorize access

## Use Cases

${integration.useCases.map((useCase, index) => `
### ${index + 1}. ${useCase}

${useCase} automation with ${integration.name}.

#### Implementation

\`\`\`javascript
{
  "name": "${useCase}",
  "trigger": {
    "type": "schedule",
    "cron": "0 9 * * *"
  },
  "actions": [
    {
      "integration": "${integration.slug}",
      "action": "${integration.actions[0]}",
      "config": {
        // Configuration
      }
    }
  ]
}
\`\`\`

#### Results

- ⚡ Faster execution
- 📊 Better tracking
- 😊 Improved efficiency
`).join('\n')}

## Best Practices

1. Start with simple workflows
2. Test thoroughly before production
3. Monitor performance regularly
4. Handle errors gracefully

## Conclusion

${integration.name} automation with Rule Engine opens endless possibilities. Start simple and build complexity as needed.

**Ready to get started?** [Connect ${integration.name} now →](/dashboard/integrations/${integration.slug})

---

**Tags**: #${integration.slug} #automation #productivity #workflow  
**Related**: [${integration.name} Documentation](/docs/integrations/${integration.slug})
`;
}

async function generateAllDocs() {
  console.log('🚀 Generating documentation for all integrations...\n');

  const docsDir = path.join(process.cwd(), 'docs', 'integrations');
  const blogsDir = path.join(process.cwd(), 'docs', 'blogs');

  await fs.ensureDir(docsDir);
  await fs.ensureDir(blogsDir);

  for (const integration of INTEGRATIONS) {
    // Generate documentation
    const docContent = generateDocumentation(integration);
    const docPath = path.join(docsDir, `${integration.slug}.md`);
    await fs.writeFile(docPath, docContent);
    console.log(`✓ Generated docs: ${integration.slug}.md`);

    // Generate blog
    const blogContent = generateBlog(integration);
    const blogPath = path.join(blogsDir, `${integration.slug}-automation-guide.md`);
    await fs.writeFile(blogPath, blogContent);
    console.log(`✓ Generated blog: ${integration.slug}-automation-guide.md`);
  }

  console.log(`\n✅ Generated documentation for ${INTEGRATIONS.length} integrations!`);
}

// Run if executed directly
if (require.main === module) {
  generateAllDocs().catch(console.error);
}

export { generateAllDocs, INTEGRATIONS };

