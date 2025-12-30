'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { Badge } from '@/ui/components/badge';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Play,
  AlertCircle,
  Download,
  RefreshCw,
} from 'lucide-react';

interface ExecutionPanelProps {
  executionId: string;
  execution: any;
  onClose: () => void;
  onRetry?: () => void;
}

export function ExecutionPanel({ executionId, execution, onClose, onRetry }: ExecutionPanelProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'running':
        return <Play className="h-5 w-5 text-blue-600 animate-pulse" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'running':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const exportLogs = () => {
    const logsText = JSON.stringify(execution, null, 2);
    const blob = new Blob([logsText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-${executionId}.json`;
    a.click();
  };

  return (
    <div className="fixed right-0 top-0 h-full w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          {getStatusIcon(execution.status)}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Execution Details
            </h2>
            <p className="text-sm text-gray-500">
              ID: {executionId.slice(0, 8)}...
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="hover:bg-gray-200"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge className={getStatusColor(execution.status)}>
                    {execution.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="text-sm font-medium">
                    {formatDuration(execution.duration)}
                  </span>
                </div>
                {execution.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-900">
                          Error
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          {execution.error.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Node Results */}
          {execution.nodeResults && execution.nodeResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Node Execution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {execution.nodeResults.map((nodeResult: any, index: number) => (
                    <button
                      key={nodeResult.nodeId}
                      onClick={() => setSelectedNode(
                        selectedNode === nodeResult.nodeId ? null : nodeResult.nodeId
                      )}
                      className="w-full text-left"
                    >
                      <div className="p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(nodeResult.status)}
                            <div>
                              <p className="text-sm font-medium">
                                Step {index + 1}: {nodeResult.nodeType}
                              </p>
                              <p className="text-xs text-gray-500">
                                {nodeResult.nodeId.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {formatDuration(nodeResult.duration || 0)}
                            </p>
                            {nodeResult.retryCount > 0 && (
                              <p className="text-xs text-amber-600">
                                {nodeResult.retryCount} retries
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {selectedNode === nodeResult.nodeId && (
                          <div className="mt-3 pt-3 border-t space-y-3">
                            {/* Input */}
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1">
                                Input:
                              </p>
                              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                                {JSON.stringify(nodeResult.input, null, 2)}
                              </pre>
                            </div>

                            {/* Output */}
                            {nodeResult.output && (
                              <div>
                                <p className="text-xs font-semibold text-gray-700 mb-1">
                                  Output:
                                </p>
                                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(nodeResult.output, null, 2)}
                                </pre>
                              </div>
                            )}

                            {/* Error */}
                            {nodeResult.error && (
                              <div>
                                <p className="text-xs font-semibold text-red-700 mb-1">
                                  Error:
                                </p>
                                <div className="text-xs bg-red-50 p-2 rounded">
                                  <p className="font-semibold">
                                    {nodeResult.error.code}
                                  </p>
                                  <p className="mt-1">{nodeResult.error.message}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logs */}
          {execution.logs && execution.logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Execution Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {execution.logs.map((log: any, index: number) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-xs ${
                        log.level === 'error'
                          ? 'bg-red-50 text-red-900'
                          : log.level === 'warn'
                          ? 'bg-amber-50 text-amber-900'
                          : 'bg-gray-50 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-mono text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="font-semibold uppercase">
                          [{log.level}]
                        </span>
                        <span className="flex-1">{log.message}</span>
                      </div>
                      {log.data && (
                        <pre className="mt-1 ml-20 text-xs opacity-75">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Output */}
          {execution.output && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Final Output</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                  {JSON.stringify(execution.output, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-gray-50 space-y-3">
        <Button
          variant="outline"
          onClick={exportLogs}
          className="w-full gap-2"
        >
          <Download className="h-4 w-4" />
          Export Logs
        </Button>
        {execution.status === 'failed' && onRetry && (
          <Button
            onClick={onRetry}
            className="w-full gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Execution
          </Button>
        )}
      </div>
    </div>
  );
}

