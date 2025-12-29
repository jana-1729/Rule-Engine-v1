'use client';

import { useState } from 'react';
import { AIMappingPanel } from '@/ui/components/ai-mapping-panel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { Code2, Database } from 'lucide-react';

// Example schemas for demo
const slackMessageSchema = {
  user: {
    type: 'string',
    description: 'User ID who sent the message',
  },
  text: {
    type: 'string',
    description: 'Message content',
  },
  channel: {
    type: 'string',
    description: 'Channel ID where message was sent',
  },
  timestamp: {
    type: 'string',
    description: 'Unix timestamp of message',
  },
  thread_ts: {
    type: 'string',
    description: 'Thread timestamp if in a thread',
  },
};

const notionPageSchema = {
  title: {
    type: 'string',
    description: 'Page title',
  },
  content: {
    type: 'string',
    description: 'Page content/body',
  },
  author: {
    type: 'string',
    description: 'Page author ID',
  },
  created_at: {
    type: 'string',
    description: 'Creation timestamp',
  },
  parent_page: {
    type: 'string',
    description: 'Parent page ID',
  },
};

export function AIMappingDemo() {
  const [appliedMappings, setAppliedMappings] = useState<any[]>([]);

  const handleApplyMappings = (mappings: any[]) => {
    setAppliedMappings(mappings);
    console.log('Applied mappings:', mappings);
  };

  return (
    <div className="space-y-6">
      {/* Source and Target Schemas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <CardTitle>Source: Slack Message</CardTitle>
            </div>
            <CardDescription>Schema from Slack integration</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
              {JSON.stringify(slackMessageSchema, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-green-600" />
              <CardTitle>Target: Notion Page</CardTitle>
            </div>
            <CardDescription>Schema from Notion integration</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
              {JSON.stringify(notionPageSchema, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* AI Mapping Panel */}
      <AIMappingPanel
        sourceIntegration="Slack"
        targetIntegration="Notion"
        sourceSchema={slackMessageSchema}
        targetSchema={notionPageSchema}
        onApplyMappings={handleApplyMappings}
      />

      {/* Applied Mappings Result */}
      {appliedMappings.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-green-600" />
              <CardTitle>Applied Mappings</CardTitle>
            </div>
            <CardDescription>
              These mappings have been applied to your workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {appliedMappings.map((mapping, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-white border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {mapping.sourceField}
                    </Badge>
                    <span className="text-gray-400">→</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {mapping.targetField}
                    </Badge>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {(mapping.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-gray-700">
            <p className="font-medium">How it works:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Click "AI Suggest Mappings" to analyze both schemas</li>
              <li>AI (Gemini) intelligently suggests field mappings</li>
              <li>Review confidence scores and warnings</li>
              <li>Click "Apply All Mappings" to use the suggestions</li>
            </ol>
            <p className="text-xs text-gray-600 mt-4">
              💡 Tip: The AI considers field names, data types, and semantic meaning to suggest the best mappings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

