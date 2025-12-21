export default function SDKDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">SDK Documentation</h1>
          <p className="text-purple-100 text-lg">
            Official SDKs and code examples for the Rule Engine
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-6 text-sm">
            <a href="/docs" className="text-gray-600 hover:text-gray-900">
              ← Back to API Docs
            </a>
            <a href="#nodejs" className="text-purple-600 hover:text-purple-800 font-medium">
              Node.js
            </a>
            <a href="#python" className="text-purple-600 hover:text-purple-800 font-medium">
              Python
            </a>
            <a href="#examples" className="text-purple-600 hover:text-purple-800 font-medium">
              Examples
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Quick Start */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
          <p className="text-gray-600 mb-6">
            Get started with the Rule Engine in minutes using our official SDKs.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Prerequisites:</strong> You'll need an API key. Get one by creating an app in the{' '}
              <a href="/dashboard/apps/new" className="underline">
                dashboard
              </a>
              .
            </p>
          </div>
        </section>

        {/* Node.js SDK */}
        <section id="nodejs" className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Node.js SDK</h2>

          <h3 className="text-lg font-semibold mb-3">Installation</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6 overflow-x-auto">
            <code>npm install @yourplatform/sdk</code>
          </pre>

          <h3 className="text-lg font-semibold mb-3">Basic Usage</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6 overflow-x-auto">
            <code>{`import { IntegrationPlatform } from '@yourplatform/sdk';

const client = new IntegrationPlatform({
  apiKey: process.env.INTEGRATION_PLATFORM_API_KEY,
});

// List available integrations
const integrations = await client.integrations.list();

// Execute an action
const result = await client.integrations.execute({
  integration: 'slack',
  action: 'send_message',
  endUserId: 'user-123',
  input: {
    channel: '#general',
    text: 'Hello from the SDK!',
  },
});

console.log('Message sent:', result.data);`}</code>
          </pre>

          <h3 className="text-lg font-semibold mb-3">OAuth Connection Flow</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6 overflow-x-auto">
            <code>{`// Step 1: Initiate OAuth flow
const authUrl = await client.connections.authorize({
  integration: 'slack',
  endUserId: 'user-123',
  redirectUri: 'https://yourapp.com/callback',
  metadata: {
    email: 'user@example.com',
    name: 'John Doe',
  },
});

// Redirect user to authUrl.url

// Step 2: Handle callback (in your callback route)
app.get('/callback', async (req, res) => {
  const { success, connectionId } = req.query;
  
  if (success) {
    // Connection established!
    console.log('Connection ID:', connectionId);
    res.redirect('/dashboard?connected=true');
  } else {
    res.redirect('/dashboard?error=connection_failed');
  }
});`}</code>
          </pre>

          <h3 className="text-lg font-semibold mb-3">Workflow Execution</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6 overflow-x-auto">
            <code>{`// Create a workflow
const workflow = await client.workflows.create({
  name: 'Slack to Notion',
  trigger: {
    integration: 'slack',
    event: 'message.channels',
  },
  actions: [
    {
      integration: 'notion',
      action: 'create_page',
      input: {
        parent: { database_id: '{{env.NOTION_DB_ID}}' },
        properties: {
          Name: { title: [{ text: { content: '{{trigger.text}}' } }] },
        },
      },
    },
  ],
});

// Execute workflow
const execution = await client.workflows.execute({
  workflowId: workflow.id,
  endUserId: 'user-123',
  input: {
    text: 'New idea from Slack',
  },
});`}</code>
          </pre>

          <h3 className="text-lg font-semibold mb-3">Error Handling</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6 overflow-x-auto">
            <code>{`try {
  const result = await client.integrations.execute({
    integration: 'slack',
    action: 'send_message',
    endUserId: 'user-123',
    input: { channel: '#general', text: 'Hello!' },
  });
} catch (error) {
  if (error.code === 'CONNECTION_NOT_FOUND') {
    // User hasn't connected Slack yet
    console.log('Please connect Slack first');
  } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Rate limit hit
    console.log('Too many requests, try again later');
  } else {
    // Other error
    console.error('Execution failed:', error.message);
  }
}`}</code>
          </pre>
        </section>

        {/* Python SDK */}
        <section id="python" className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Python SDK</h2>

          <h3 className="text-lg font-semibold mb-3">Installation</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6 overflow-x-auto">
            <code>pip install integration-platform-sdk</code>
          </pre>

          <h3 className="text-lg font-semibold mb-3">Basic Usage</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6 overflow-x-auto">
            <code>{`from integration_platform import IntegrationPlatform

client = IntegrationPlatform(
    api_key=os.environ['INTEGRATION_PLATFORM_API_KEY']
)

# List integrations
integrations = client.integrations.list()

# Execute action
result = client.integrations.execute(
    integration='slack',
    action='send_message',
    end_user_id='user-123',
    input={
        'channel': '#general',
        'text': 'Hello from Python!'
    }
)

print(f"Message sent: {result['data']}")`}</code>
          </pre>

          <h3 className="text-lg font-semibold mb-3">Async Support</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6 overflow-x-auto">
            <code>{`from integration_platform import AsyncIntegrationPlatform
import asyncio

async def main():
    client = AsyncIntegrationPlatform(
        api_key=os.environ['INTEGRATION_PLATFORM_API_KEY']
    )
    
    # Execute multiple actions concurrently
    results = await asyncio.gather(
        client.integrations.execute(
            integration='slack',
            action='send_message',
            end_user_id='user-1',
            input={'channel': '#general', 'text': 'Message 1'}
        ),
        client.integrations.execute(
            integration='slack',
            action='send_message',
            end_user_id='user-2',
            input={'channel': '#random', 'text': 'Message 2'}
        )
    )
    
    return results

asyncio.run(main())`}</code>
          </pre>
        </section>

        {/* Common Examples */}
        <section id="examples" className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Common Examples</h2>

          <div className="space-y-6">
            {/* Example 1 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                1. Send Slack Message When User Signs Up
              </h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <code>{`// In your signup handler
app.post('/api/signup', async (req, res) => {
  const user = await createUser(req.body);
  
  // Send Slack notification
  await client.integrations.execute({
    integration: 'slack',
    action: 'send_message',
    endUserId: 'admin-user',
    input: {
      channel: '#new-users',
      text: \`🎉 New user signed up: \${user.email}\`,
    },
  });
  
  res.json({ success: true, user });
});`}</code>
              </pre>
            </div>

            {/* Example 2 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                2. Sync Notion Database with Google Sheets
              </h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <code>{`// Query Notion database
const notionData = await client.integrations.execute({
  integration: 'notion',
  action: 'query_database',
  endUserId: 'user-123',
  input: {
    database_id: 'notion-db-id',
  },
});

// Convert to rows
const rows = notionData.data.results.map(page => [
  page.properties.Name.title[0].text.content,
  page.properties.Status.select.name,
  page.properties.Date.date.start,
]);

// Append to Google Sheets
await client.integrations.execute({
  integration: 'google-sheets',
  action: 'append_row',
  endUserId: 'user-123',
  input: {
    spreadsheetId: 'sheet-id',
    range: 'Sheet1!A:C',
    values: rows,
  },
});`}</code>
              </pre>
            </div>

            {/* Example 3 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                3. Monitor Execution Logs
              </h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <code>{`// Get recent executions
const executions = await client.executions.list({
  limit: 10,
  status: 'failure',
});

// Check for failures
executions.data.forEach(execution => {
  console.log(\`Failed execution: \${execution.id}\`);
  console.log(\`Error: \${execution.errorMessage}\`);
  console.log(\`Integration: \${execution.integration}\`);
  console.log(\`Action: \${execution.action}\`);
  console.log('---');
});

// Get specific execution details
const execution = await client.executions.get('exec_xyz789');
console.log('Input:', execution.input);
console.log('Output:', execution.output);
console.log('Duration:', execution.duration, 'ms');`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Webhooks */}
        <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Webhooks</h2>
          <p className="text-gray-600 mb-4">
            Receive real-time notifications about events in your Rule Engine.
          </p>

          <h3 className="text-lg font-semibold mb-3">Setup</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6 overflow-x-auto">
            <code>{`// Configure webhook URL in dashboard or via API
await client.apps.update({
  webhookUrl: 'https://yourapp.com/webhooks/integrations',
});

// Handle webhook events
app.post('/webhooks/integrations', async (req, res) => {
  const event = req.body;
  
  // Verify webhook signature
  const signature = req.headers['x-webhook-signature'];
  if (!client.webhooks.verify(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Handle event
  switch (event.type) {
    case 'execution.success':
      console.log('Execution succeeded:', event.data.executionId);
      break;
    case 'execution.failure':
      console.log('Execution failed:', event.data.errorMessage);
      // Send alert to your team
      break;
    case 'connection.expired':
      console.log('Connection expired:', event.data.integrationSlug);
      // Notify user to reconnect
      break;
  }
  
  res.status(200).send('OK');
});`}</code>
          </pre>
        </section>

        {/* Support */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">📖 Documentation</h3>
              <p className="text-gray-600 text-sm mb-2">
                Complete API reference and guides
              </p>
              <a href="/docs" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View API Docs →
              </a>
            </div>
            <div>
              <h3 className="font-semibold mb-2">💬 Support</h3>
              <p className="text-gray-600 text-sm mb-2">
                Get help from our team
              </p>
              <a
                href="mailto:support@yourplatform.com"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Contact Support →
              </a>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🐛 Issues</h3>
              <p className="text-gray-600 text-sm mb-2">
                Report bugs and request features
              </p>
              <a
                href="https://github.com/yourorg/platform/issues"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                GitHub Issues →
              </a>
            </div>
            <div>
              <h3 className="font-semibold mb-2">💡 Examples</h3>
              <p className="text-gray-600 text-sm mb-2">
                Browse code examples and templates
              </p>
              <a
                href="https://github.com/yourorg/platform-examples"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Examples →
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

