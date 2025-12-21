import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import Link from 'next/link';
import { BookOpen, Zap, Code, CheckCircle } from 'lucide-react';

export default function GuidesPage() {
  const guides = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of the Integration Platform',
      icon: <BookOpen className="h-6 w-6" />,
      color: 'blue',
      articles: [
        { title: 'Platform Overview', time: '5 min read' },
        { title: 'Creating Your First App', time: '10 min read' },
        { title: 'Understanding Workflows', time: '8 min read' },
        { title: 'Managing API Keys', time: '5 min read' },
      ],
    },
    {
      title: 'Integration Guides',
      description: 'Step-by-step guides for each integration',
      icon: <Zap className="h-6 w-6" />,
      color: 'purple',
      articles: [
        { title: 'Slack Integration Guide', time: '15 min read' },
        { title: 'Google Sheets Integration Guide', time: '12 min read' },
        { title: 'Notion Integration Guide', time: '15 min read' },
        { title: 'OAuth Flow Best Practices', time: '10 min read' },
      ],
    },
    {
      title: 'Workflow Building',
      description: 'Master workflow creation and field mapping',
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'green',
      articles: [
        { title: 'Creating Your First Workflow', time: '12 min read' },
        { title: 'Advanced Field Mapping', time: '15 min read' },
        { title: 'Using Template Variables', time: '8 min read' },
        { title: 'Workflow Testing & Debugging', time: '10 min read' },
      ],
    },
    {
      title: 'Developer Resources',
      description: 'Advanced topics and best practices',
      icon: <Code className="h-6 w-6" />,
      color: 'orange',
      articles: [
        { title: 'Webhook Configuration', time: '10 min read' },
        { title: 'Error Handling', time: '8 min read' },
        { title: 'Rate Limiting', time: '5 min read' },
        { title: 'Security Best Practices', time: '12 min read' },
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integration Guides</h1>
        <p className="text-gray-600 mt-2">
          Step-by-step tutorials and best practices for building integrations
        </p>
      </div>

      {/* Popular Guides */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            <CardTitle>Popular Guides</CardTitle>
          </div>
          <CardDescription>Most viewed guides this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Link
              href="#"
              className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <div>
                <div className="font-medium text-gray-900">Creating Your First Workflow</div>
                <div className="text-sm text-gray-600">Learn how to build and deploy a workflow</div>
              </div>
              <Badge>New</Badge>
            </Link>
            <Link
              href="#"
              className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <div>
                <div className="font-medium text-gray-900">Slack Integration Guide</div>
                <div className="text-sm text-gray-600">Complete guide to Slack integration</div>
              </div>
              <Badge variant="outline">Popular</Badge>
            </Link>
            <Link
              href="#"
              className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <div>
                <div className="font-medium text-gray-900">OAuth Flow Best Practices</div>
                <div className="text-sm text-gray-600">Security and UX best practices</div>
              </div>
              <Badge variant="outline">Essential</Badge>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Guide Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {guides.map((guide) => {
          const colors = getColorClasses(guide.color);
          return (
            <Card key={guide.title} className={`${colors.border} hover:shadow-lg transition-shadow`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text}`}>
                    {guide.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{guide.title}</CardTitle>
                    <CardDescription>{guide.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {guide.articles.map((article, index) => (
                    <Link
                      key={index}
                      href="#"
                      className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors group"
                    >
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">
                        {article.title}
                      </span>
                      <span className="text-xs text-gray-500">{article.time}</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-200 hover:border-blue-400 transition-colors">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">API Reference</h3>
              <p className="text-sm text-gray-600 mb-4">
                Complete API documentation
              </p>
              <Link href="/dashboard/docs/api" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View API Docs →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 hover:border-purple-400 transition-colors">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                <Code className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">SDK Documentation</h3>
              <p className="text-sm text-gray-600 mb-4">
                Official SDKs and examples
              </p>
              <Link href="/dashboard/docs/sdk" className="text-sm font-medium text-purple-600 hover:text-purple-700">
                View SDK Docs →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 hover:border-green-400 transition-colors">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Integrations</h3>
              <p className="text-sm text-gray-600 mb-4">
                Browse available integrations
              </p>
              <Link href="/dashboard/integrations" className="text-sm font-medium text-green-600 hover:text-green-700">
                View Integrations →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support */}
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can't find what you're looking for?
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                Our support team is here to help. Contact us with any questions or feedback.
              </p>
              <div className="flex gap-3">
                <Link href="mailto:support@example.com" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Contact Support →
                </Link>
                <Link href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Community Forum →
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

