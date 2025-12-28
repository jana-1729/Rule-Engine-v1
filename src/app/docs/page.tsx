'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/ui/components/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { Search, BookOpen, FileText, Code, Lightbulb, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface DocItem {
  title: string;
  description: string;
  category: string;
  url: string;
  type: 'guide' | 'integration' | 'api' | 'blog';
}

const DOCUMENTATION_ITEMS: DocItem[] = [
  // Guides
  {
    title: 'Quick Start Guide',
    description: 'Get started with Rule Engine in 5 minutes',
    category: 'Getting Started',
    url: '/docs/guides/quick-start',
    type: 'guide',
  },
  {
    title: 'Platform Overview',
    description: 'Understanding the Rule Engine platform',
    category: 'Getting Started',
    url: '/docs/guides/platform-overview',
    type: 'guide',
  },
  {
    title: 'Workflow Design Patterns',
    description: 'Best practices for designing workflows',
    category: 'Best Practices',
    url: '/docs/guides/workflow-patterns',
    type: 'guide',
  },
  {
    title: 'Error Handling',
    description: 'Implementing robust error handling',
    category: 'Best Practices',
    url: '/docs/guides/error-handling',
    type: 'guide',
  },
  {
    title: 'Performance Optimization',
    description: 'Optimizing workflow performance',
    category: 'Best Practices',
    url: '/docs/guides/performance',
    type: 'guide',
  },
  {
    title: 'Security Best Practices',
    description: 'Securing your workflows and integrations',
    category: 'Best Practices',
    url: '/docs/guides/security',
    type: 'guide',
  },
  // Integration Docs
  {
    title: 'Gmail Integration',
    description: 'Automate email workflows with Gmail',
    category: 'Communication',
    url: '/docs/integrations/gmail',
    type: 'integration',
  },
  {
    title: 'Slack Integration',
    description: 'Team communication automation',
    category: 'Communication',
    url: '/docs/integrations/slack',
    type: 'integration',
  },
  {
    title: 'Microsoft Teams Integration',
    description: 'Enterprise collaboration automation',
    category: 'Communication',
    url: '/docs/integrations/microsoft-teams',
    type: 'integration',
  },
  {
    title: 'Discord Integration',
    description: 'Community management automation',
    category: 'Communication',
    url: '/docs/integrations/discord',
    type: 'integration',
  },
  {
    title: 'Notion Integration',
    description: 'Knowledge management automation',
    category: 'Productivity',
    url: '/docs/integrations/notion',
    type: 'integration',
  },
  {
    title: 'Google Sheets Integration',
    description: 'Spreadsheet automation',
    category: 'Productivity',
    url: '/docs/integrations/google-sheets',
    type: 'integration',
  },
  {
    title: 'HubSpot Integration',
    description: 'Marketing and sales automation',
    category: 'CRM',
    url: '/docs/integrations/hubspot',
    type: 'integration',
  },
  {
    title: 'Salesforce Integration',
    description: 'Enterprise CRM automation',
    category: 'CRM',
    url: '/docs/integrations/salesforce',
    type: 'integration',
  },
  {
    title: 'Jira Integration',
    description: 'Issue tracking automation',
    category: 'Project Management',
    url: '/docs/integrations/jira',
    type: 'integration',
  },
  {
    title: 'Trello Integration',
    description: 'Visual project management',
    category: 'Project Management',
    url: '/docs/integrations/trello',
    type: 'integration',
  },
  {
    title: 'GitHub Integration',
    description: 'Code workflow automation',
    category: 'Developer Tools',
    url: '/docs/integrations/github',
    type: 'integration',
  },
  // Blogs
  {
    title: 'Gmail Automation Guide',
    description: 'Complete guide to automating Gmail',
    category: 'Tutorials',
    url: '/docs/blogs/gmail-automation-guide',
    type: 'blog',
  },
  {
    title: 'Slack Automation Guide',
    description: 'Complete guide to automating Slack',
    category: 'Tutorials',
    url: '/docs/blogs/slack-automation-guide',
    type: 'blog',
  },
  // API Docs
  {
    title: 'REST API Documentation',
    description: 'Complete REST API reference',
    category: 'API Reference',
    url: '/docs/api/rest-api',
    type: 'api',
  },
  {
    title: 'Webhook API',
    description: 'Webhook integration guide',
    category: 'API Reference',
    url: '/docs/api/webhooks',
    type: 'api',
  },
  {
    title: 'Authentication',
    description: 'API authentication methods',
    category: 'API Reference',
    url: '/docs/api/authentication',
    type: 'api',
  },
];

const TYPE_ICONS = {
  guide: BookOpen,
  integration: Code,
  api: FileText,
  blog: Lightbulb,
};

const TYPE_COLORS = {
  guide: 'bg-blue-100 text-blue-700',
  integration: 'bg-green-100 text-green-700',
  api: 'bg-purple-100 text-purple-700',
  blog: 'bg-yellow-100 text-yellow-700',
};

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocs, setFilteredDocs] = useState<DocItem[]>(DOCUMENTATION_ITEMS);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    filterDocs();
  }, [searchQuery, selectedType]);

  const filterDocs = () => {
    let filtered = DOCUMENTATION_ITEMS;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((doc) => doc.type === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.description.toLowerCase().includes(query) ||
          doc.category.toLowerCase().includes(query)
      );
    }

    setFilteredDocs(filtered);
  };

  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, DocItem[]>);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to build powerful automations with Rule Engine
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {/* Type Filters */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedType === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedType('guide')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedType === 'guide'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Guides
                </button>
                <button
                  onClick={() => setSelectedType('integration')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedType === 'integration'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Integrations
                </button>
                <button
                  onClick={() => setSelectedType('blog')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedType === 'blog'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Blogs
                </button>
                <button
                  onClick={() => setSelectedType('api')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedType === 'api'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  API
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredDocs.length}</span> of{' '}
            <span className="font-semibold">{DOCUMENTATION_ITEMS.length}</span> documents
          </p>
        </div>

        {/* Documentation Grid */}
        <div className="space-y-8">
          {Object.entries(groupedDocs).map(([category, docs]) => (
            <div key={category}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {docs.map((doc) => {
                  const Icon = TYPE_ICONS[doc.type];
                  return (
                    <Link key={doc.url} href={doc.url}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-2">{doc.title}</CardTitle>
                              <p className="text-sm text-gray-600">{doc.description}</p>
                            </div>
                            <Icon className="w-5 h-5 text-gray-400 ml-2" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <Badge className={TYPE_COLORS[doc.type]}>
                              {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                            </Badge>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDocs.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">No documentation found</p>
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/docs/guides/quick-start" className="text-blue-600 hover:underline">
                    Quick Start Guide
                  </Link>
                </li>
                <li>
                  <Link href="/docs/guides/platform-overview" className="text-blue-600 hover:underline">
                    Platform Overview
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/integrations" className="text-blue-600 hover:underline">
                    Browse Integrations
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                API Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/docs/api/rest-api" className="text-blue-600 hover:underline">
                    REST API
                  </Link>
                </li>
                <li>
                  <Link href="/docs/api/webhooks" className="text-blue-600 hover:underline">
                    Webhooks
                  </Link>
                </li>
                <li>
                  <Link href="/docs/api/authentication" className="text-blue-600 hover:underline">
                    Authentication
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/docs/blogs" className="text-blue-600 hover:underline">
                    Blog & Tutorials
                  </Link>
                </li>
                <li>
                  <Link href="/docs/guides/workflow-patterns" className="text-blue-600 hover:underline">
                    Workflow Patterns
                  </Link>
                </li>
                <li>
                  <Link href="/docs/guides/best-practices" className="text-blue-600 hover:underline">
                    Best Practices
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
