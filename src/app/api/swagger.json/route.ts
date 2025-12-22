import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const swaggerSpec = {
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

## Base URL

\`\`\`
https://your-domain.com/api/public/v1
\`\`\`
      `,
      contact: {
        name: 'API Support',
        email: 'support@yourplatform.com',
      },
    },
    servers: [
      {
        url: '/api/public/v1',
        description: 'Production API',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key',
          description: 'Enter your API key from the dashboard',
        },
      },
      schemas: {
        Integration: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            slug: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            logo: { type: 'string' },
            authType: { type: 'string' },
          },
        },
        Workflow: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            integrationId: { type: 'string' },
            enabled: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Execution: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            workflowId: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'running', 'success', 'failed'] },
            input: { type: 'object' },
            output: { type: 'object' },
            error: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'object' },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    paths: {
      '/integrations': {
        get: {
          summary: 'List all available integrations',
          description: 'Get a list of all integrations available in your account',
          tags: ['Integrations'],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      integrations: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Integration' },
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/connections/connect': {
        post: {
          summary: 'Initiate OAuth connection',
          description: 'Start the OAuth flow for an end-user to connect an integration',
          tags: ['Connections'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['integrationSlug', 'endUserId'],
                  properties: {
                    integrationSlug: {
                      type: 'string',
                      description: 'The slug of the integration (e.g., "slack", "notion")',
                    },
                    endUserId: {
                      type: 'string',
                      description: 'Your end-user\'s unique identifier',
                    },
                    redirectUrl: {
                      type: 'string',
                      description: 'URL to redirect after OAuth completion',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'OAuth URL generated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      authUrl: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/connections/list': {
        get: {
          summary: 'List user connections',
          description: 'Get all active connections for an end-user',
          tags: ['Connections'],
          parameters: [
            {
              name: 'endUserId',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'The end-user ID to fetch connections for',
            },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      connections: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            integrationId: { type: 'string' },
                            integrationName: { type: 'string' },
                            status: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/connections/disconnect': {
        post: {
          summary: 'Disconnect integration',
          description: 'Remove an end-user\'s connection to an integration',
          tags: ['Connections'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['connectionId'],
                  properties: {
                    connectionId: {
                      type: 'string',
                      description: 'The connection ID to disconnect',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Connection disconnected',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/workflows/list': {
        get: {
          summary: 'List workflows',
          description: 'Get all workflows configured in your app',
          tags: ['Workflows'],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      workflows: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Workflow' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/workflows/execute': {
        post: {
          summary: 'Execute workflow',
          description: 'Run a workflow for an end-user with dynamic data',
          tags: ['Workflows'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['workflowId', 'endUserId', 'data'],
                  properties: {
                    workflowId: {
                      type: 'string',
                      description: 'The workflow ID to execute',
                    },
                    endUserId: {
                      type: 'string',
                      description: 'The end-user ID',
                    },
                    data: {
                      type: 'object',
                      description: 'Dynamic data for field mapping',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Workflow executed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      executionId: { type: 'string' },
                      result: { type: 'object' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Workflow execution failed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/executions/logs': {
        get: {
          summary: 'Get execution logs',
          description: 'Retrieve detailed logs for workflow executions',
          tags: ['Executions'],
          parameters: [
            {
              name: 'workflowId',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by workflow ID',
            },
            {
              name: 'endUserId',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by end-user ID',
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: ['pending', 'running', 'success', 'failed'] },
              description: 'Filter by execution status',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 50 },
              description: 'Number of results to return',
            },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      executions: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Execution' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Integrations',
        description: 'Manage available integrations',
      },
      {
        name: 'Connections',
        description: 'Handle end-user OAuth connections',
      },
      {
        name: 'Workflows',
        description: 'Create and execute workflows',
      },
      {
        name: 'Executions',
        description: 'Monitor workflow executions',
      },
    ],
  };

  return NextResponse.json(swaggerSpec);
}

