/**
 * Embeddable Execution Logs
 * For end users to view workflow execution history
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { Badge } from '@/ui/components/badge';

interface Execution {
  id: string;
  workflow: {
    id: string;
    name: string;
  };
  integration: {
    id: string;
    slug: string;
    name: string;
    logo: string;
  };
  status: string;
  input: any;
  output: any;
  error: any;
  logs: any[];
  createdAt: string;
  completedAt: string | null;
}

interface ExecutionLogsProps {
  apiKey: string;
  endUserId: string;
  workflowId?: string;
  baseUrl?: string;
}

export function ExecutionLogs({
  apiKey,
  endUserId,
  workflowId,
  baseUrl = '/api/public/v1',
}: ExecutionLogsProps) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(
    null
  );
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  useEffect(() => {
    loadExecutions();
  }, [page, workflowId]);

  const loadExecutions = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        endUserId,
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });

      if (workflowId) {
        params.append('workflowId', workflowId);
      }

      const response = await fetch(
        `${baseUrl}/executions/logs?${params.toString()}`,
        {
          headers: {
            'X-API-Key': apiKey,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setExecutions(data.data.executions);
        setHasMore(data.data.hasMore);
      }
    } catch (error) {
      console.error('Error loading executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = (execution: Execution) => {
    if (!execution.completedAt) return 'Running...';
    
    const start = new Date(execution.createdAt).getTime();
    const end = new Date(execution.completedAt).getTime();
    const duration = end - start;
    
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  if (loading && executions.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Executions Yet
          </h3>
          <p className="text-gray-600">
            Workflow executions will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Execution History
        </h2>
        <p className="text-gray-600">
          View your workflow execution logs and results
        </p>
      </div>

      {/* Execution List */}
      <div className="space-y-4">
        {executions.map((execution) => (
          <Card
            key={execution.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedExecution(execution)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {execution.integration.logo && (
                    <img
                      src={execution.integration.logo}
                      alt={execution.integration.name}
                      className="w-10 h-10 rounded-lg"
                    />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">
                        {execution.workflow.name}
                      </h3>
                      <Badge className={getStatusColor(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{execution.integration.name}</span>
                      <span>•</span>
                      <span>{formatDate(execution.createdAt)}</span>
                      <span>•</span>
                      <span>{getDuration(execution)}</span>
                    </div>

                    {execution.error && (
                      <div className="mt-2 text-sm text-red-600">
                        Error: {execution.error.message || 'Unknown error'}
                      </div>
                    )}
                  </div>
                </div>

                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Previous
        </Button>
        <span className="text-sm text-gray-600">Page {page + 1}</span>
        <Button
          variant="outline"
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore}
        >
          Next
        </Button>
      </div>

      {/* Execution Details Modal */}
      {selectedExecution && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedExecution(null)}
        >
          <Card
            className="max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Execution Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedExecution(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status */}
              <div>
                <h4 className="font-semibold mb-2">Status</h4>
                <Badge className={getStatusColor(selectedExecution.status)}>
                  {selectedExecution.status}
                </Badge>
              </div>

              {/* Timing */}
              <div>
                <h4 className="font-semibold mb-2">Timing</h4>
                <div className="text-sm space-y-1">
                  <p>Started: {formatDate(selectedExecution.createdAt)}</p>
                  {selectedExecution.completedAt && (
                    <p>Completed: {formatDate(selectedExecution.completedAt)}</p>
                  )}
                  <p>Duration: {getDuration(selectedExecution)}</p>
                </div>
              </div>

              {/* Input */}
              <div>
                <h4 className="font-semibold mb-2">Input</h4>
                <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto">
                  {JSON.stringify(selectedExecution.input, null, 2)}
                </pre>
              </div>

              {/* Output */}
              {selectedExecution.output && (
                <div>
                  <h4 className="font-semibold mb-2">Output</h4>
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto">
                    {JSON.stringify(selectedExecution.output, null, 2)}
                  </pre>
                </div>
              )}

              {/* Error */}
              {selectedExecution.error && (
                <div>
                  <h4 className="font-semibold mb-2 text-red-600">Error</h4>
                  <pre className="bg-red-50 p-4 rounded-lg text-xs overflow-auto text-red-800">
                    {JSON.stringify(selectedExecution.error, null, 2)}
                  </pre>
                </div>
              )}

              {/* Logs */}
              {selectedExecution.logs && selectedExecution.logs.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Logs</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs space-y-1 max-h-96 overflow-auto font-mono">
                    {selectedExecution.logs.map((log: any, index: number) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span
                          className={
                            log.level === 'error'
                              ? 'text-red-400'
                              : log.level === 'warn'
                              ? 'text-yellow-400'
                              : 'text-green-400'
                          }
                        >
                          [{log.level.toUpperCase()}]
                        </span>
                        <span>{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

