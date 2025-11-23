"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface ExecutionLog {
  id: string;
  executionId: string;
  stepNumber: number;
  stepName: string;
  integration: string;
  action: string;
  status: string;
  startedAt: Date;
  finishedAt?: Date;
  duration?: number;
  input?: any;
  output?: any;
  error?: any;
}

interface ExecutionLogViewerProps {
  logs: ExecutionLog[];
}

export function ExecutionLogViewer({ logs }: ExecutionLogViewerProps) {
  return (
    <div className="space-y-4">
      {logs.map((log, index) => (
        <Card key={log.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <StatusIcon status={log.status} />
                <div>
                  <CardTitle className="text-base">
                    Step {log.stepNumber}: {log.stepName}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {log.integration} • {log.action}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <StatusBadge status={log.status} />
                {log.duration && (
                  <Badge variant="secondary">
                    {formatDuration(log.duration)}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Input */}
              {log.input && (
                <div>
                  <div className="text-sm font-medium mb-2">Input:</div>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(log.input, null, 2)}
                  </pre>
                </div>
              )}

              {/* Output */}
              {log.output && (
                <div>
                  <div className="text-sm font-medium mb-2">Output:</div>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(log.output, null, 2)}
                  </pre>
                </div>
              )}

              {/* Error */}
              {log.error && (
                <div>
                  <div className="text-sm font-medium mb-2 text-destructive">Error:</div>
                  <pre className="bg-destructive/10 p-3 rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(log.error, null, 2)}
                  </pre>
                </div>
              )}

              {/* Timeline */}
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Started: {new Date(log.startedAt).toLocaleString()}</span>
                {log.finishedAt && (
                  <span>Finished: {new Date(log.finishedAt).toLocaleString()}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    case 'failed':
      return <XCircle className="w-6 h-6 text-red-500" />;
    case 'running':
      return <Clock className="w-6 h-6 text-blue-500 animate-spin" />;
    default:
      return <AlertCircle className="w-6 h-6 text-yellow-500" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, any> = {
    success: 'success',
    failed: 'destructive',
    running: 'default',
    pending: 'secondary',
  };

  return (
    <Badge variant={variants[status] || 'secondary'}>
      {status}
    </Badge>
  );
}

