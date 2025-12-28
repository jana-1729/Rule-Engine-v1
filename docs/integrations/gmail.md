# Gmail Integration Guide

![Gmail](/assets/integrations/gmail.jpg)

## Overview

The Gmail integration enables you to automate email workflows, send automated emails, read incoming messages, and create drafts programmatically. Built with the official Google APIs SDK for production-grade reliability.

**Category**: Communication  
**Authentication**: OAuth 2.0  
**Rate Limits**: 250 quota units per user per second  
**Status**: ✅ Production Ready

## Features

- ✅ Send emails with attachments
- ✅ Read and filter emails
- ✅ Create drafts
- ✅ Full HTML email support
- ✅ Automatic retry on failures
- ✅ Error recovery built-in

## Quick Start

### 1. Connect Gmail

1. Navigate to [Integrations](/dashboard/integrations)
2. Click on **Gmail**
3. Click **Connect**
4. Authorize with your Google account
5. Grant required permissions

### 2. Create Your First Workflow

```javascript
// Example: Auto-respond to emails
{
  "trigger": "gmail.new_email",
  "actions": [
    {
      "integration": "gmail",
      "action": "send_email",
      "config": {
        "to": "{{trigger.from}}",
        "subject": "Re: {{trigger.subject}}",
        "body": "Thank you for your email. We'll respond within 24 hours."
      }
    }
  ]
}
```

## Available Actions

### 1. Send Email

Send emails with full HTML support and attachments.

**Action ID**: `send_email`

#### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | string | Yes | Recipient email address |
| `subject` | string | Yes | Email subject |
| `body` | string | Yes | Email body (HTML supported) |
| `cc` | string | No | CC recipients (comma-separated) |
| `bcc` | string | No | BCC recipients (comma-separated) |
| `attachments` | array | No | File attachments |

#### Example

```json
{
  "to": "customer@example.com",
  "subject": "Welcome to Our Platform",
  "body": "<h1>Welcome!</h1><p>Thank you for signing up.</p>",
  "cc": "team@example.com"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "18c1f2a3b4d5e6f7",
    "threadId": "18c1f2a3b4d5e6f7",
    "labelIds": ["SENT"]
  }
}
```

### 2. Read Emails

Fetch and filter emails from your inbox.

**Action ID**: `read_emails`

#### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | No | Gmail search query (e.g., "is:unread") |
| `maxResults` | number | No | Maximum emails to fetch (default: 10) |
| `labelIds` | array | No | Filter by labels |

#### Example

```json
{
  "query": "is:unread from:important@example.com",
  "maxResults": 5
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "18c1f2a3b4d5e6f7",
        "threadId": "18c1f2a3b4d5e6f7",
        "from": "sender@example.com",
        "subject": "Important Message",
        "snippet": "This is the email preview...",
        "date": "2025-12-28T10:30:00Z"
      }
    ],
    "resultSizeEstimate": 5
  }
}
```

### 3. Create Draft

Create email drafts for later sending.

**Action ID**: `create_draft`

#### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | string | Yes | Recipient email address |
| `subject` | string | Yes | Email subject |
| `body` | string | Yes | Email body |

#### Example

```json
{
  "to": "client@example.com",
  "subject": "Proposal Draft",
  "body": "Here's our proposal..."
}
```

## Use Cases

### 1. Customer Support Automation

Automatically respond to support emails and create tickets.

```javascript
{
  "trigger": "gmail.new_email",
  "filter": "subject contains 'support'",
  "actions": [
    {
      "integration": "gmail",
      "action": "send_email",
      "config": {
        "to": "{{trigger.from}}",
        "subject": "Ticket Created: {{trigger.subject}}",
        "body": "Your support ticket #{{ticket.id}} has been created."
      }
    },
    {
      "integration": "jira",
      "action": "create_issue",
      "config": {
        "project": "SUPPORT",
        "summary": "{{trigger.subject}}",
        "description": "{{trigger.body}}"
      }
    }
  ]
}
```

### 2. Sales Lead Notification

Get instant Slack notifications for important emails.

```javascript
{
  "trigger": "gmail.new_email",
  "filter": "from contains '@enterprise-client.com'",
  "actions": [
    {
      "integration": "slack",
      "action": "send_message",
      "config": {
        "channel": "#sales",
        "text": "🔥 New email from {{trigger.from}}: {{trigger.subject}}"
      }
    }
  ]
}
```

### 3. Email to Spreadsheet

Log all emails to a Google Sheet for tracking.

```javascript
{
  "trigger": "gmail.new_email",
  "actions": [
    {
      "integration": "google-sheets",
      "action": "append_row",
      "config": {
        "spreadsheetId": "your-sheet-id",
        "range": "Emails!A:D",
        "values": [
          "{{trigger.from}}",
          "{{trigger.subject}}",
          "{{trigger.date}}",
          "{{trigger.snippet}}"
        ]
      }
    }
  ]
}
```

## Authentication Setup

### OAuth 2.0 Configuration

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable Gmail API

2. **Configure OAuth Consent Screen**
   - Set application name
   - Add authorized domains
   - Configure scopes

3. **Create OAuth 2.0 Credentials**
   - Application type: Web application
   - Authorized redirect URIs: `https://your-domain.com/api/integrations/callback/gmail`

4. **Add Credentials to Platform**
   - Navigate to Settings > Integrations
   - Add Gmail credentials
   - Save Client ID and Client Secret

### Required Scopes

```
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.compose
```

## Error Handling

The Gmail integration includes automatic error recovery:

- **Rate Limiting**: Automatic exponential backoff
- **Network Errors**: 3 automatic retries
- **Authentication**: Token refresh handling
- **Quota Exceeded**: Graceful degradation

### Common Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry automatically |
| `INVALID_CREDENTIALS` | OAuth token expired | Reconnect integration |
| `INSUFFICIENT_PERMISSIONS` | Missing scopes | Re-authorize with correct scopes |
| `MESSAGE_NOT_FOUND` | Email doesn't exist | Check message ID |

## Best Practices

### 1. Use Filters Effectively

```javascript
// Good: Specific filter
{ "query": "is:unread from:important@example.com after:2025/12/01" }

// Bad: Too broad
{ "query": "is:unread" }
```

### 2. Handle Large Volumes

```javascript
// Use pagination for large result sets
{
  "maxResults": 100,
  "pageToken": "{{previous.nextPageToken}}"
}
```

### 3. Secure Sensitive Data

```javascript
// Never log email content in production
{
  "logLevel": "info",  // Don't use "debug" for emails
  "maskFields": ["body", "attachments"]
}
```

## Rate Limits

| Operation | Limit | Per |
|-----------|-------|-----|
| Send Email | 100 | Day (free), 2000 (paid) |
| Read Emails | 250 quota units | Second per user |
| API Requests | 1,000,000,000 | Day |

## Troubleshooting

### Connection Issues

**Problem**: "Failed to connect Gmail"

**Solutions**:
1. Check OAuth credentials
2. Verify redirect URI
3. Ensure Gmail API is enabled
4. Check user permissions

### Email Not Sending

**Problem**: Emails stuck in queue

**Solutions**:
1. Check rate limits
2. Verify recipient email
3. Check spam filters
4. Review email content for spam triggers

## Support

- 📧 Email: support@ruleengine.com
- 💬 Slack: [Join our community](https://slack.ruleengine.com)
- 📖 API Docs: [Gmail API Reference](/docs/api/gmail)
- 🐛 Report Issues: [GitHub Issues](https://github.com/ruleengine/issues)

## Related Integrations

- [Slack](/docs/integrations/slack) - Send email notifications to Slack
- [Google Sheets](/docs/integrations/google-sheets) - Log emails to spreadsheets
- [Jira](/docs/integrations/jira) - Create tickets from emails

---

**Last Updated**: December 28, 2025  
**Integration Version**: 1.0.0  
**SDK**: googleapis v118.0.0

