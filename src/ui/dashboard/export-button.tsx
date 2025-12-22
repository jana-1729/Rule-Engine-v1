'use client';

import { Button } from '@/ui/components/button';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';

interface ExportButtonProps {
  executions: any[];
}

export function ExportButton({ executions }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      // Prepare CSV data
      const headers = [
        'Execution ID',
        'Request ID',
        'Integration',
        'Action',
        'App',
        'End User',
        'Status',
        'Created At',
        'Completed At',
        'Duration (s)',
        'Error',
      ];

      const rows = executions.map((execution) => {
        const duration = execution.completedAt
          ? Math.round(
              (new Date(execution.completedAt).getTime() -
                new Date(execution.createdAt).getTime()) /
                1000
            )
          : '';

        const error = execution.error
          ? typeof execution.error === 'object'
            ? (execution.error as any).message || JSON.stringify(execution.error)
            : execution.error
          : '';

        return [
          execution.id,
          execution.requestId || '',
          execution.integration?.name || 'Unknown',
          execution.action || '',
          execution.app?.name || '',
          execution.endUser?.externalId || '',
          execution.status,
          new Date(execution.createdAt).toISOString(),
          execution.completedAt ? new Date(execution.completedAt).toISOString() : '',
          duration,
          error.replace(/"/g, '""'), // Escape quotes
        ];
      });

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${cell}"`).join(',')
        ),
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `executions_${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);
    try {
      // Prepare JSON data
      const jsonData = executions.map((execution) => ({
        id: execution.id,
        requestId: execution.requestId,
        integration: {
          id: execution.integration?.id,
          name: execution.integration?.name,
          slug: execution.integration?.slug,
        },
        action: execution.action,
        app: {
          id: execution.app?.id,
          name: execution.app?.name,
        },
        endUser: {
          id: execution.endUser?.id,
          externalId: execution.endUser?.externalId,
        },
        status: execution.status,
        input: execution.input,
        output: execution.output,
        error: execution.error,
        logs: execution.logs,
        createdAt: execution.createdAt,
        completedAt: execution.completedAt,
        duration:
          execution.completedAt && execution.createdAt
            ? Math.round(
                (new Date(execution.completedAt).getTime() -
                  new Date(execution.createdAt).getTime()) /
                  1000
              )
            : null,
      }));

      // Download file
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
        type: 'application/json',
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `executions_${new Date().toISOString().split('T')[0]}.json`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  if (executions.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        {isExporting ? 'Exporting...' : 'Export'}
      </Button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              <button
                onClick={exportToCSV}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export as CSV
              </button>
              <button
                onClick={exportToJSON}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <FileJson className="w-4 h-4" />
                Export as JSON
              </button>
            </div>
            <div className="border-t border-gray-200 px-4 py-2">
              <p className="text-xs text-gray-500">
                {executions.length} execution{executions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

