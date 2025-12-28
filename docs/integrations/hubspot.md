# HubSpot Integration Guide

![HubSpot](/assets/integrations/hubspot.png)

## Overview

The HubSpot integration enables you to automate marketing and sales automation platform workflows. Built with official SDKs for production-grade reliability.

**Category**: CRM  
**Authentication**: OAuth 2.0  
**Status**: ✅ Production Ready

## Features

- ✅ Create Contact
- ✅ Update Contact
- ✅ Create Deal
- ✅ Add To List
- ✅ Automatic retry on failures
- ✅ Error recovery built-in

## Quick Start

### 1. Connect HubSpot

1. Navigate to [Integrations](/dashboard/integrations)
2. Click on **HubSpot**
3. Click **Connect**
4. Authorize with your account
5. Grant required permissions

### 2. Create Your First Workflow

```javascript
{
  "name": "HubSpot Automation",
  "trigger": {
    "type": "manual"
  },
  "actions": [
    {
      "integration": "hubspot",
      "action": "create_contact",
      "config": {
        // Your configuration here
      }
    }
  ]
}
```

## Available Actions


### 1. Create Contact

**Action ID**: `create_contact`

Automate create contact operations.

#### Example

```json
{
  "integration": "hubspot",
  "action": "create_contact",
  "config": {
    // Configuration parameters
  }
}
```


### 2. Update Contact

**Action ID**: `update_contact`

Automate update contact operations.

#### Example

```json
{
  "integration": "hubspot",
  "action": "update_contact",
  "config": {
    // Configuration parameters
  }
}
```


### 3. Create Deal

**Action ID**: `create_deal`

Automate create deal operations.

#### Example

```json
{
  "integration": "hubspot",
  "action": "create_deal",
  "config": {
    // Configuration parameters
  }
}
```


### 4. Add To List

**Action ID**: `add_to_list`

Automate add to list operations.

#### Example

```json
{
  "integration": "hubspot",
  "action": "add_to_list",
  "config": {
    // Configuration parameters
  }
}
```


## Use Cases


### 1. Lead Management

Automate lead management with HubSpot.

```javascript
{
  "name": "Lead Management",
  "trigger": {
    "type": "webhook"
  },
  "actions": [
    {
      "integration": "hubspot",
      "action": "create_contact",
      "config": {
        // Your configuration
      }
    }
  ]
}
```


### 2. Marketing Automation

Automate marketing automation with HubSpot.

```javascript
{
  "name": "Marketing Automation",
  "trigger": {
    "type": "webhook"
  },
  "actions": [
    {
      "integration": "hubspot",
      "action": "create_contact",
      "config": {
        // Your configuration
      }
    }
  ]
}
```


### 3. Sales Pipeline

Automate sales pipeline with HubSpot.

```javascript
{
  "name": "Sales Pipeline",
  "trigger": {
    "type": "webhook"
  },
  "actions": [
    {
      "integration": "hubspot",
      "action": "create_contact",
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
- 📖 API Docs: [HubSpot API Reference](/docs/api/hubspot)

## Related Integrations

- [Salesforce](/docs/integrations/salesforce)

---

**Last Updated**: December 28, 2025  
**Integration Version**: 1.0.0
