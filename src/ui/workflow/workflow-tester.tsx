"use client";

import { useState } from 'react';
import { Button } from '@/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

/**
 * WorkflowTester Component
 * 
 * Test workflow execution with sample data
 */

interface WorkflowTesterProps {
  workflowId?: string;
  integrationSlug: string;
  actionId: string;
  fieldMappings: Record<string, any>;
  onTestComplete?: (result: TestResult) => void;
}

interface TestResult {
  success: boolean;
  duration: number;
  output?: any;
  error?: string;
  logs?: string[];
}

export function WorkflowTester({
  workflowId,
  integrationSlug,
  actionId,
  fieldMappings,
  onTestComplete,
}: WorkflowTesterProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    
    const startTime = Date.now();
    
    try {
      console.log('[WorkflowTester] Starting test execution...');
      console.log('[WorkflowTester] Integration:', integrationSlug);
      console.log('[WorkflowTester] Action:', actionId);
      console.log('[WorkflowTester] Field Mappings:', fieldMappings);
      
      // TODO: Replace with actual API call to test workflow
      // For now, simulate a test execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const testResult: TestResult = {
        success: true,
        duration: Date.now() - startTime,
        output: {
          message: 'Test execution successful',
          data: {
            integration: integrationSlug,
            action: actionId,
            fields: fieldMappings,
          },
        },
        logs: [
          `[${new Date().toISOString()}] Starting workflow test`,
          `[${new Date().toISOString()}] Validating field mappings`,
          `[${new Date().toISOString()}] Connecting to ${integrationSlug}`,
          `[${new Date().toISOString()}] Executing action: ${actionId}`,
          `[${new Date().toISOString()}] Test completed successfully`,
        ],
      };
      
      console.log('[WorkflowTester] ✅ Test completed:', testResult);
      setResult(testResult);
      
      if (onTestComplete) {
        onTestComplete(testResult);
      }
    } catch (error: any) {
      console.error('[WorkflowTester] ❌ Test failed:', error);
      
      const testResult: TestResult = {
        success: false,
        duration: Date.now() - startTime,
        error: error.message || 'Test execution failed',
        logs: [
          `[${new Date().toISOString()}] Starting workflow test`,
          `[${new Date().toISOString()}] Error: ${error.message}`,
        ],
      };
      
      setResult(testResult);
      
      if (onTestComplete) {
        onTestComplete(testResult);
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              Test Workflow
            </CardTitle>
            <CardDescription>
              Run a test execution to verify your workflow configuration
            </CardDescription>
          </div>
          <Button
            onClick={runTest}
            disabled={testing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Test
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      {result && (
        <CardContent>
          <div className="space-y-4">
            {/* Result Summary */}
            <div className={`p-4 rounded-lg border-2 ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-sm font-semibold ${
                      result.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {result.success ? 'Test Passed' : 'Test Failed'}
                    </p>
                    <Badge 
                      variant={result.success ? 'default' : 'destructive'}
                      className={result.success ? 'bg-green-600' : 'bg-red-600'}
                    >
                      {result.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{result.duration}ms</span>
                    </div>
                    {result.logs && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{result.logs.length} log entries</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {result.error && (
                <div className="mt-3 p-3 bg-red-100 rounded text-xs text-red-800 font-mono">
                  {result.error}
                </div>
              )}
              
              {result.output && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowLogs(!showLogs)}
                    className="flex items-center gap-1 text-xs text-gray-700 hover:text-gray-900 font-medium"
                  >
                    {showLogs ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    View Output
                  </button>
                  {showLogs && (
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(result.output, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
            
            {/* Execution Logs */}
            {result.logs && result.logs.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Execution Logs</p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1 max-h-60 overflow-auto">
                  {result.logs.map((log, index) => (
                    <div key={index} className="text-xs font-mono text-gray-600">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * QuickTest Component
 * 
 * Compact inline test button with result indicator
 */

interface QuickTestProps {
  onTest: () => Promise<boolean>;
  label?: string;
}

export function QuickTest({ onTest, label = 'Test' }: QuickTestProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<'success' | 'failed' | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      const success = await onTest();
      setResult(success ? 'success' : 'failed');
      
      // Clear result after 3 seconds
      setTimeout(() => setResult(null), 3000);
    } catch (error) {
      setResult('failed');
      setTimeout(() => setResult(null), 3000);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleTest}
      disabled={testing}
      className={`
        ${result === 'success' ? 'border-green-500 bg-green-50 text-green-700' : ''}
        ${result === 'failed' ? 'border-red-500 bg-red-50 text-red-700' : ''}
      `}
    >
      {testing ? (
        <>
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Testing...
        </>
      ) : result === 'success' ? (
        <>
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Passed
        </>
      ) : result === 'failed' ? (
        <>
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </>
      ) : (
        <>
          <Play className="h-3 w-3 mr-1" />
          {label}
        </>
      )}
    </Button>
  );
}

