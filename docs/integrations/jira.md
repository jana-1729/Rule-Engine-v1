# Jira Integration Guide

![Jira](/assets/integrations/jira-icon.png)

## Overview

The Jira integration enables you to automate issue tracking and project management workflows. Built with official SDKs for production-grade reliability.

**Category**: Project Management  
**Authentication**: OAuth 2.0  
**Status**: ✅ Production Ready

## Features

- ✅ Create Issue
- ✅ Update Issue
- ✅ Add Comment
- ✅ Search Issues
- ✅ Automatic retry on failures
- ✅ Error recovery built-in

## Quick Start

### 1. Connect Jira

1. Navigate to [Integrations](/dashboard/integrations)
2. Click on **Jira**
3. Click **Connect**
4. Authorize with your account
5. Grant required permissions

### 2. Create Your First Workflow

```javascript
{
  "name": "Jira Automation",
  "trigger": {
    "type": "manual"
  },
  "actions": [
    {
      "integration": "jira",
      "action": "create_issue",
      "config": {
        // Your configuration here
      }
    }
  ]
}
```

## Available Actions


### 1. Create Issue

**Action ID**: `create_issue`

Automate create issue operations.

#### Example

```json
{
  "integration": "jira",
  "action": "create_issue",
  "config": {
    // Configuration parameters
  }
}
```


### 2. Update Issue

**Action ID**: `update_issue`

Automate update issue operations.

#### Example

```json
{
  "integration": "jira",
  "action": "update_issue",
  "config": {
    // Configuration parameters
  }
}
```


### 3. Add Comment

**Action ID**: `add_comment`

Automate add comment operations.

#### Example

```json
{
  "integration": "jira",
  "action": "add_comment",
  "config": {
    // Configuration parameters
  }
}
```


### 4. Search Issues

**Action ID**: `search_issues`

Automate search issues operations.

#### Example

```json
{
  "integration": "jira",
  "action": "search_issues",
  "config": {
    // Configuration parameters
  }
}
```


## Use Cases


### 1. Bug Tracking

Automate bug tracking with Jira.

```javascript
{
  "name": "Bug Tracking",
  "trigger": {
    "type": "webhook"
  },
  "actions": [
    {
      "integration": "jira",
      "action": "create_issue",
      "config": {
        // Your configuration
      }
    }
  ]
}
```


### 2. Sprint Management

Automate sprint management with Jira.

```javascript
{
  "name": "Sprint Management",
  "trigger": {
    "type": "webhook"
  },
  "actions": [
    {
      "integration": "jira",
      "action": "create_issue",
      "config": {
        // Your configuration
      }
    }
  ]
}
```


### 3. Project Workflows

Automate project workflows with Jira.

```javascript
{
  "name": "Project Workflows",
  "trigger": {
    "type": "webhook"
  },
  "actions": [
    {
      "integration": "jira",
      "action": "create_issue",
      "config": {
        // Your configuration
      }
    }
  ]
}
```


## Best Practices

1. **Start Simple** - Begin with basic workflows
2. **Test Thoroughly** - Always test before production
3. **Monitor Performance** - Check execution logs regularly
4. **Handle Errors** - Implement proper error handling

## Support

- 📧 Email: support@ruleengine.com
- 💬 Slack: [Join our community](https://slack.ruleengine.com)
- 📖 API Docs: [Jira API Reference](/docs/api/jira)

## Related Integrations

- [Trello](/docs/integrations/trello)

---

**Last Updated**: December 28, 2025  
**Integration Version**: 1.0.0
