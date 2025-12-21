/**
 * Swagger/OpenAPI Configuration
 * Auto-generates API documentation from JSDoc comments
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Integration Platform API',
      version: '1.0.0',
      description: `
# Integration Platform API

A comprehensive B2B2C embedded integration platform API that enables your applications to connect with 100+ third-party services.

## Features

- 🔌 **100+ Integrations**: Slack, Notion, Google Sheets, and more
- 🔐 **OAuth 2.0**: Secure authentication handling
- 🚀 **Workflow Automation**: Build complex multi-step workflows
- 📊 **Execution Logging**: Full observability and debugging
- 🔑 **API Key Management**: Secure credential storage and rotation
- 📧 **Email Notifications**: Automated alerts and updates

## Authentication

All API endpoints require authentication via API key in the \`X-API-Key\` header:

\`\`\`
X-API-Key: app_abc123xyz_...
\`\`\`

Get your API key by creating an app via \`POST /api/v1/apps\`.

## Rate Limiting

- **Default**: 100 requests per minute per API key
- **Burst**: 200 requests per minute
- Rate limit headers are included in all responses

## Error Handling

All errors follow a consistent format:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
\`\`\`

## Webhooks

Configure webhook URLs to receive real-time notifications about:
- Connection events (created, expired)
- Execution events (success, failure)
- Workflow events (started, completed)

## Support

- 📖 Documentation: https://docs.yourplatform.com
- 💬 Support: support@yourplatform.com
- 🐛 Issues: https://github.com/yourorg/platform/issues
      `,
      contact: {
        name: 'API Support',
        email: 'support@yourplatform.com',
        url: 'https://yourplatform.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for authentication. Get your key by creating an app.',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'INVALID_API_KEY',
                },
                message: {
                  type: 'string',
                  example: 'The provided API key is invalid or expired',
                },
                details: {
                  type: 'object',
                },
              },
            },
          },
        },
        Integration: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'int_slack',
            },
            slug: {
              type: 'string',
              example: 'slack',
            },
            name: {
              type: 'string',
              example: 'Slack',
            },
            description: {
              type: 'string',
              example: 'Team communication platform',
            },
            category: {
              type: 'string',
              example: 'communication',
            },
            logo: {
              type: 'string',
              example: 'https://...',
            },
            color: {
              type: 'string',
              example: '#4A154B',
            },
            website: {
              type: 'string',
              example: 'https://slack.com',
            },
            authType: {
              type: 'string',
              enum: ['oauth2', 'api_key', 'basic'],
              example: 'oauth2',
            },
            requiresEndUserAuth: {
              type: 'boolean',
              example: true,
            },
            enabled: {
              type: 'boolean',
              example: true,
            },
            actions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    example: 'send_message',
                  },
                  name: {
                    type: 'string',
                    example: 'Send Message',
                  },
                  description: {
                    type: 'string',
                    example: 'Send a message to a channel',
                  },
                },
              },
            },
          },
        },
        Execution: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'exec_xyz789',
            },
            requestId: {
              type: 'string',
              example: 'exec_xyz789',
            },
            integration: {
              type: 'string',
              example: 'slack',
            },
            action: {
              type: 'string',
              example: 'send_message',
            },
            status: {
              type: 'string',
              enum: ['pending', 'success', 'failure'],
              example: 'success',
            },
            input: {
              type: 'object',
            },
            output: {
              type: 'object',
            },
            startedAt: {
              type: 'string',
              format: 'date-time',
            },
            finishedAt: {
              type: 'string',
              format: 'date-time',
            },
            duration: {
              type: 'number',
              example: 234,
            },
            errorCode: {
              type: 'string',
              nullable: true,
            },
            errorMessage: {
              type: 'string',
              nullable: true,
            },
          },
        },
        Connection: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'conn_123',
            },
            integrationSlug: {
              type: 'string',
              example: 'slack',
            },
            endUserId: {
              type: 'string',
              example: 'user-789',
            },
            status: {
              type: 'string',
              enum: ['active', 'expired', 'revoked'],
              example: 'active',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    tags: [
      {
        name: 'Apps',
        description: 'App and API key management',
      },
      {
        name: 'Integrations',
        description: 'Available integrations and their actions',
      },
      {
        name: 'Connections',
        description: 'OAuth connections and authentication',
      },
      {
        name: 'Executions',
        description: 'Execute actions and view execution logs',
      },
      {
        name: 'Workflows',
        description: 'Workflow management and execution',
      },
    ],
  },
  apis: [
    './src/app/api/v1/**/*.ts',
    './src/app/api/public/**/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

