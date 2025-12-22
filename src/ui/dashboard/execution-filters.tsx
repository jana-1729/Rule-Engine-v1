"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { Search, X, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ExecutionFiltersProps {
  integrations: Array<{ id: string; name: string; slug: string }>;
  apps: Array<{ id: string; name: string; appId: string }>;
}

export function ExecutionFilters({ integrations, apps }: ExecutionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const currentStatus = searchParams.get('status') || 'all';
  const currentIntegration = searchParams.get('integration') || '';
  const currentApp = searchParams.get('app') || '';
  const currentDateFrom = searchParams.get('dateFrom') || '';
  const currentDateTo = searchParams.get('dateTo') || '';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value !== '') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/executions?${params.toString()}`);
  };

  const handleSearch = () => {
    updateFilter('search', searchTerm);
  };

  const clearFilters = () => {
    setSearchTerm('');
    router.push('/dashboard/executions');
  };

  const hasActiveFilters = 
    currentStatus !== 'all' || 
    currentIntegration || 
    currentApp || 
    currentDateFrom || 
    currentDateTo || 
    searchTerm;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by action, request ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button onClick={handleSearch} className="px-6">
              Search
            </Button>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" className="px-4">
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={currentStatus}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Integration
              </label>
              <select
                value={currentIntegration}
                onChange={(e) => updateFilter('integration', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Integrations</option>
                {integrations.map((integration) => (
                  <option key={integration.id} value={integration.id}>
                    {integration.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App
              </label>
              <select
                value={currentApp}
                onChange={(e) => updateFilter('app', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Apps</option>
                {apps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                From Date
              </label>
              <input
                type="date"
                value={currentDateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                To Date
              </label>
              <input
                type="date"
                value={currentDateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Active filters:</span>
              {currentStatus !== 'all' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  Status: {currentStatus}
                </span>
              )}
              {currentIntegration && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  Integration: {integrations.find(i => i.id === currentIntegration)?.name}
                </span>
              )}
              {currentApp && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  App: {apps.find(a => a.id === currentApp)?.name}
                </span>
              )}
              {currentDateFrom && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  From: {new Date(currentDateFrom).toLocaleDateString()}
                </span>
              )}
              {currentDateTo && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  To: {new Date(currentDateTo).toLocaleDateString()}
                </span>
              )}
              {searchTerm && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  Search: "{searchTerm}"
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

