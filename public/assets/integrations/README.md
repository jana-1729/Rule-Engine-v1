# Integration Logos

This directory contains logo files for all integrations.

## Available Logos

### Communication
- ✅ `slack.jpeg` - Slack
- ✅ `gmail.jpg` - Gmail
- ✅ `teams.webp` - Microsoft Teams
- ✅ `discord.webp` - Discord

### Productivity
- ✅ `notion.png` - Notion
- ✅ `google-sheets.webp` - Google Sheets
- ⚠️ `trello.png` - Trello (placeholder needed)

### CRM
- ✅ `hubspot.png` - HubSpot
- ⚠️ `salesforce.png` - Salesforce (placeholder needed)

### Developer Tools
- ⚠️ `jira.png` - Jira (placeholder needed)
- ⚠️ `github.png` - GitHub (placeholder needed)

## Adding New Logos

1. Download the official logo from the integration's brand assets page
2. Resize to 512x512px (or maintain aspect ratio)
3. Save as PNG, JPEG, or WebP format
4. Name the file using the integration slug (e.g., `slack.jpeg`)
5. Place in this directory
6. Update the integration metadata in:
   - `src/integrations/plugins/{integration-slug}/index.ts`
   - `prisma/seed-integrations.ts`

## Logo Requirements

- **Size**: Minimum 256x256px, recommended 512x512px
- **Format**: PNG (preferred), JPEG, or WebP
- **Background**: Transparent PNG preferred, or white background
- **Quality**: High resolution for retina displays
- **Naming**: Use integration slug (lowercase, hyphenated)

## Brand Guidelines

Always follow the official brand guidelines for each integration:
- **Slack**: https://slack.com/media-kit
- **Notion**: https://www.notion.so/brand
- **Google**: https://about.google/brand-resource-center/
- **Microsoft**: https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks
- **Discord**: https://discord.com/branding
- **HubSpot**: https://www.hubspot.com/brand-guidelines
- **Salesforce**: https://www.salesforce.com/company/legal/intellectual/
- **Atlassian** (Jira/Trello): https://atlassian.design/foundations/logos
- **GitHub**: https://github.com/logos

