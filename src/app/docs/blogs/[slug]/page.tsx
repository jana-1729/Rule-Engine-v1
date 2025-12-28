import Link from 'next/link';
import { getSession } from '@/lib/session';
import { Button } from '@/ui/components/button';
import { notFound } from 'next/navigation';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { ArrowLeft, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getSession();

  // Read the markdown file
  let content: string;
  try {
    const filePath = join(process.cwd(), 'docs', 'blogs', `${params.slug}.md`);
    content = await readFile(filePath, 'utf-8');
  } catch (error) {
    notFound();
  }

  // Extract title from first # heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : params.slug;

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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link href="/docs/blogs" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blogs
        </Link>

        {/* Article */}
        <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12">
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </article>

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Ready to automate your workflows?</h2>
          <p className="text-lg mb-6 opacity-90">
            Start building with our platform today
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

// Generate static params for all blog posts
export async function generateStaticParams() {
  const blogs = [
    'gmail-automation-guide',
    'slack-automation-guide',
    'notion-automation-guide',
    'google-sheets-automation-guide',
    'microsoft-teams-automation-guide',
    'discord-automation-guide',
    'hubspot-automation-guide',
    'salesforce-automation-guide',
    'jira-automation-guide',
    'github-automation-guide',
    'trello-automation-guide',
  ];

  return blogs.map((slug) => ({
    slug,
  }));
}

