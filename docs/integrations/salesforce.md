# Salesforce Integration Guide

![Salesforce](/assets/integrations/salesforce.png)

## Overview

The Salesforce integration enables you to automate enterprise crm platform workflows. Built with official SDKs for production-grade reliability.

**Category**: CRM  
**Authentication**: OAuth 2.0  
**Status**: ✅ Production Ready

## Features

- ✅ Create Lead
- ✅ Update Opportunity
- ✅ Query Records
- ✅ Create Case
- ✅ Automatic retry on failures
- ✅ Error recovery built-in

## Quick Start

### 1. Connect Salesforce

1. Navigate to [Integrations](/dashboard/integrations)
2. Click on **Salesforce**
3. Click **Connect**
4. Authorize with your account
5. Grant required permissions

### 2. Create Your First Workflow

```javascript
{
  "name": "Salesforce Automation",
  "trigger": {
    "type": "manual"
  },
  "actions": [
    {
      "integration": "salesforce",
      "action": "create_lead",
      "config": {
        // Your configuration here
      }
    }
  ]
}
```

## Available Actions


### 1. Create Lead

**Action ID**: `create_lead`

Automate create lead operations.

#### Example

```json
{
  "integration": "salesforce",
  "action": "create_lead",
  "config": {
    // Configuration parameters
  }
}
```


### 2. Update Opportunity

**Action ID**: `update_opportunity`

Automate update opportunity operations.

#### Example

```json
{
  "integration": "salesforce",
  "action": "update_opportunity",
  "config": {
    // Configuration parameters
  }
}
```


### 3. Query Records

**Action ID**: `query_records`

Automate query records operations.

#### Example

```json
{
  "integration": "salesforce",
  "action": "query_records",
  "config": {
    // Configuration parameters
  }
}
```


### 4. Create Case

**Action ID**: `create_case`

Automate create case operations.

#### Example

```json
{
  "integration": "salesforce",
  "action": "create_case",
  "config": {
    // Configuration parameters
  }
}
```


## Use Cases


### 1. Sales Automation

Automate sales automation with Salesforce.

```javascript
{
  "name": "Sales Automation",
  "trigger": {
    "type": "webhook"
  },
  "actions": [
    {
      "integration": "salesforce",
      "action": "create_lead",
      "config": {
        // Your configuration
      }
    }
  ]
}
```


### 2. Customer Support

Automate customer support with Salesforce.

```javascript
{
  "name": "Customer Support",
  "trigger": {
    "type": "webhook"
  },
  "actions": [
    {
      "integration": "salesforce",
      "action": "create_lead",
      "config": {
        // Your configuration
      }
    }
  ]
}
```


### 3. Enterprise CRM

Automate enterprise crm with Salesforce.

```javascript
{
  "name": "Enterprise CRM",
  "trigger": {
    "type": "webhook"
  },
  "actions": [
    {
      "integration": "salesforce",
      "action": "create_lead",
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
- 📖 API Docs: [Salesforce API Reference](/docs/api/salesforce)

## Related Integrations

- [HubSpot](/docs/integrations/hubspot)

---

**Last Updated**: December 28, 2025  
**Integration Version**: 1.0.0
