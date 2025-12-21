import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/components/tabs';
import Link from 'next/link';
import { Code, Download, BookOpen, ExternalLink } from 'lucide-react';

export default function SdkDocsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">SDK Documentation</h1>
        <p className="text-gray-600 mt-2">
          Official SDKs and code examples for the Integration Platform
        </p>
      </div>

      {/* Available SDKs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-200 hover:border-blue-400 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">JavaScript / TypeScript</CardTitle>
              <Badge>Official</Badge>
            </div>
            <CardDescription>For Node.js and browser applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <code className="px-2 py-1 bg-gray-100 rounded text-xs">npm install @your-org/integration-sdk</code>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                View on npm
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 hover:border-green-400 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Python</CardTitle>
              <Badge>Official</Badge>
            </div>
            <CardDescription>For Python 3.7+ applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <code className="px-2 py-1 bg-gray-100 rounded text-xs">pip install integration-platform</code>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                View on PyPI
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 hover:border-purple-400 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">REST API</CardTitle>
              <Badge variant="outline">Universal</Badge>
            </div>
            <CardDescription>For any language or platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Use standard HTTP requests
              </div>
              <Link href="/dashboard/docs/api">
                <Button variant="outline" size="sm" className="w-full">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View API Docs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
          <CardDescription>Get started with the SDK in minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="javascript" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
            </TabsList>

            <TabsContent value="javascript" className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">1. Install the SDK</h3>
                <div className="bg-gray-900 rounded-lg p-4">
                  <code className="text-sm text-green-400">
                    npm install @your-org/integration-sdk
                  </code>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">2. Initialize the client</h3>
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm text-gray-300">
{`import { IntegrationClient } from '@your-org/integration-sdk';

const client = new IntegrationClient({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://your-domain.com'
});`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">3. List integrations</h3>
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm text-gray-300">
{`const integrations = await client.integrations.list();
console.log(integrations);`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">4. Execute a workflow</h3>
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm text-gray-300">
{`const result = await client.workflows.execute({
  workflowId: 'workflow_123',
  endUserId: 'user_456',
  data: {
    message: 'Hello World!',
    channel: '#general'
  }
});`}
                  </pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="python" className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">1. Install the SDK</h3>
                <div className="bg-gray-900 rounded-lg p-4">
                  <code className="text-sm text-green-400">
                    pip install integration-platform
                  </code>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">2. Initialize the client</h3>
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm text-gray-300">
{`from integration_platform import Client

client = Client(
    api_key="YOUR_API_KEY",
    base_url="https://your-domain.com"
)`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">3. List integrations</h3>
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm text-gray-300">
{`integrations = client.integrations.list()
print(integrations)`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">4. Execute a workflow</h3>
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm text-gray-300">
{`result = client.workflows.execute(
    workflow_id="workflow_123",
    end_user_id="user_456",
    data={
        "message": "Hello World!",
        "channel": "#general"
    }
)`}
                  </pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="curl" className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">1. List integrations</h3>
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm text-gray-300">
{`curl https://your-domain.com/api/public/v1/integrations \\
  -H "x-api-key: YOUR_API_KEY"`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">2. Execute a workflow</h3>
                <div className="bg-gray-900 rounded-lg p-4">
                  <pre className="text-sm text-gray-300">
{`curl -X POST https://your-domain.com/api/public/v1/workflows/execute \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "workflowId": "workflow_123",
    "endUserId": "user_456",
    "data": {
      "message": "Hello World!",
      "channel": "#general"
    }
  }'`}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Common Use Cases</CardTitle>
          <CardDescription>Example code for common integration scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Connect a user to Slack</h3>
              <p className="text-sm text-gray-600 mb-3">
                Initiate OAuth flow for an end-user to connect their Slack account
              </p>
              <div className="bg-gray-900 rounded-lg p-4">
                <pre className="text-sm text-gray-300">
{`const connection = await client.connections.connect({
  integrationId: 'slack_id',
  endUserId: 'user_123',
  redirectUri: 'https://your-app.com/callback'
});

// Redirect user to connection.authUrl
window.location.href = connection.authUrl;`}
                </pre>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Send a Slack message</h3>
              <p className="text-sm text-gray-600 mb-3">
                Execute a workflow to send a message to a Slack channel
              </p>
              <div className="bg-gray-900 rounded-lg p-4">
                <pre className="text-sm text-gray-300">
{`const result = await client.workflows.execute({
  workflowId: 'slack_message_workflow',
  endUserId: 'user_123',
  data: {
    channel: '#leads',
    message: 'New lead: John Doe (john@example.com)'
  }
});`}
                </pre>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Get execution logs</h3>
              <p className="text-sm text-gray-600 mb-3">
                Retrieve execution logs for debugging and monitoring
              </p>
              <div className="bg-gray-900 rounded-lg p-4">
                <pre className="text-sm text-gray-300">
{`const logs = await client.executions.logs({
  workflowId: 'workflow_123',
  endUserId: 'user_456',
  limit: 10
});`}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Need More Examples?
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                Check out our integration guides for step-by-step tutorials and advanced use cases.
              </p>
              <Link href="/dashboard/docs/guides">
                <Button variant="outline" className="gap-2">
                  View Integration Guides
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

