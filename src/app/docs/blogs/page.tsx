import Link from 'next/link';
import { getSession } from '@/lib/session';
import { Button } from '@/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Input } from '@/ui/components/input';
import { BookOpen, ArrowRight } from 'lucide-react';

export default async function BlogsPage() {
  const session = await getSession();

  const blogs = [
    {
      slug: 'gmail-automation-guide',
      title: 'Gmail Automation Guide',
      description: 'Learn how to automate email workflows with Gmail integration',
      category: 'Communication',
      readTime: '8 min read',
    },
    {
      slug: 'slack-automation-guide',
      title: 'Slack Automation Guide',
      description: 'Automate team communication and notifications with Slack',
      category: 'Communication',
      readTime: '7 min read',
    },
    {
      slug: 'notion-automation-guide',
      title: 'Notion Automation Guide',
      description: 'Build powerful workflows with Notion databases and pages',
      category: 'Productivity',
      readTime: '10 min read',
    },
    {
      slug: 'google-sheets-automation-guide',
      title: 'Google Sheets Automation Guide',
      description: 'Automate spreadsheet operations and data management',
      category: 'Productivity',
      readTime: '9 min read',
    },
    {
      slug: 'microsoft-teams-automation-guide',
      title: 'Microsoft Teams Automation Guide',
      description: 'Streamline team collaboration with Microsoft Teams automation',
      category: 'Communication',
      readTime: '8 min read',
    },
    {
      slug: 'discord-automation-guide',
      title: 'Discord Automation Guide',
      description: 'Automate Discord server management and notifications',
      category: 'Communication',
      readTime: '7 min read',
    },
    {
      slug: 'hubspot-automation-guide',
      title: 'HubSpot Automation Guide',
      description: 'Automate CRM workflows and marketing campaigns',
      category: 'CRM',
      readTime: '10 min read',
    },
    {
      slug: 'salesforce-automation-guide',
      title: 'Salesforce Automation Guide',
      description: 'Build powerful sales automation workflows',
      category: 'CRM',
      readTime: '11 min read',
    },
    {
      slug: 'jira-automation-guide',
      title: 'Jira Automation Guide',
      description: 'Automate project management and issue tracking',
      category: 'Project Management',
      readTime: '9 min read',
    },
    {
      slug: 'github-automation-guide',
      title: 'GitHub Automation Guide',
      description: 'Automate code workflows and repository management',
      category: 'Developer Tools',
      readTime: '10 min read',
    },
    {
      slug: 'trello-automation-guide',
      title: 'Trello Automation Guide',
      description: 'Streamline board management and task automation',
      category: 'Project Management',
      readTime: '8 min read',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <img src="/logo.png" alt="Rule Engine" className="w-10 h-10" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Rule Engine
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/docs" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">Documentation</Link>
              <Link href="/docs/blogs" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">Blog</Link>
              <Link href="/pricing" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">Pricing</Link>
            </nav>
            <div className="flex items-center space-x-4">
              {session ? (
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Integration Automation Guides
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Learn how to integrate and automate workflows with our platform. Step-by-step guides for all integrations.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <Link key={blog.slug} href={`/docs/blogs/${blog.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {blog.category}
                    </span>
                    <span className="text-xs text-gray-500">{blog.readTime}</span>
                  </div>
                  <CardTitle className="text-xl">{blog.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{blog.description}</p>
                  <div className="flex items-center text-blue-600 font-medium text-sm">
                    Read Guide
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Start building powerful automation workflows today
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href={session ? '/dashboard' : '/signup'}>
              <Button size="lg" variant="secondary">
                Get Started Free
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20">
                <BookOpen className="w-5 h-5 mr-2" />
                View Documentation
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

