"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home,
  Zap,
  GitBranch,
  Activity,
  Smartphone,
  Settings,
  BookOpen,
  Code,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Package,
  FileCode
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  external?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
  collapsible?: boolean;
}

const navigation: NavSection[] = [
  {
    title: 'Main',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: <Home className="w-5 h-5" />,
      },
      {
        name: 'Integrations',
        href: '/dashboard/integrations',
        icon: <Package className="w-5 h-5" />,
      },
      {
        name: 'Integration Health',
        href: '/dashboard/integrations/health',
        icon: <Activity className="w-5 h-5" />,
      },
      {
        name: 'Workflows',
        href: '/dashboard/workflows',
        icon: <GitBranch className="w-5 h-5" />,
      },
      {
        name: 'Executions',
        href: '/dashboard/executions',
        icon: <Activity className="w-5 h-5" />,
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        name: 'Apps',
        href: '/dashboard/apps',
        icon: <Smartphone className="w-5 h-5" />,
      },
      {
        name: 'Settings',
        href: '/dashboard/settings',
        icon: <Settings className="w-5 h-5" />,
      },
    ],
  },
  {
    title: 'Resources',
    collapsible: true,
    items: [
      {
        name: 'Swagger API',
        href: '/docs',
        icon: <FileCode className="w-5 h-5" />,
      },
      {
        name: 'API Documentation',
        href: '/dashboard/docs/api',
        icon: <BookOpen className="w-5 h-5" />,
      },
      {
        name: 'SDK Documentation',
        href: '/dashboard/docs/sdk',
        icon: <Code className="w-5 h-5" />,
      },
      {
        name: 'Integration Guides',
        href: '/dashboard/docs/guides',
        icon: <Zap className="w-5 h-5" />,
      },
    ],
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <nav className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)] flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {navigation.map((section) => {
            const isCollapsed = collapsedSections[section.title];
            const hasActiveItem = section.items.some(item => isActive(item.href));

            return (
              <div key={section.title}>
                {/* Section Header */}
                <div className="flex items-center justify-between mb-2">
                  {section.collapsible ? (
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors w-full"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      {section.title}
                    </button>
                  ) : (
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                      {section.title}
                    </h3>
                  )}
                  {hasActiveItem && !isCollapsed && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  )}
                </div>

                {/* Section Items */}
                {!isCollapsed && (
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = isActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          target={item.external ? '_blank' : undefined}
                          rel={item.external ? 'noopener noreferrer' : undefined}
                          className={cn(
                            'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative',
                            active
                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 font-medium shadow-sm'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          {/* Active Indicator */}
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"></div>
                          )}

                          {/* Icon */}
                          <span
                            className={cn(
                              'flex-shrink-0 transition-colors',
                              active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                            )}
                          >
                            {item.icon}
                          </span>

                          {/* Name */}
                          <span className="flex-1 text-sm">{item.name}</span>

                          {/* Badge */}
                          {item.badge && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              {item.badge}
                            </span>
                          )}

                          {/* External Link Icon */}
                          {item.external && (
                            <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                Need Help?
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                Check our docs or contact support
              </p>
              <Link
                href="/dashboard/docs"
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View Documentation
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
